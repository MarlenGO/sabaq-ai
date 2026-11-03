"use client";

import { useEffect, useRef, useState } from "react";
import type { PlayerResult, QuestionStat, RaceTeacherView, RoomGame } from "@/types/room";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CheckIcon, SparkleIcon } from "@/components/ui/Icons";
import { RemoteImage } from "@/components/ui/RemoteImage";
import { QrCode } from "./QrCode";
import { CsvButton, QuestionStats, ResultsTable } from "./ResultsTable";
import { raceTiles, RACE_POLL_MS } from "./race";
import { useT } from "@/i18n/client";

// Экран учителя для игры через QR: код, QR-код и таблица, которая
// обновляется каждые 2 секунды, пока ученики отвечают на телефонах.
// «Жарыс» ведёт учитель: вопрос за вопросом, все отвечают одновременно (RaceRoom).

const POLL_MS = 2000;

interface RoomState {
  status: "open" | "finished";
  total: number;
  results: PlayerResult[];
  stats: QuestionStat[];
  race?: RaceTeacherView;
}

const isLocalHost = (host: string) => host === "localhost" || host === "127.0.0.1" || host === "[::1]";

export function RoomHost({ lessonId, game }: { lessonId: string; game: RoomGame }) {
  const [code, setCode] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [shuffle, setShuffle] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const t = useT();
  const race = game === "race";

  const start = async () => {
    setStarting(true);
    setError(null);
    const response = await fetch("/api/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lessonId, game, shuffle }),
    }).catch(() => null);
    const data = await response?.json().catch(() => null);
    setStarting(false);
    if (response?.ok && data?.code) setCode(data.code);
    else setError(data?.error ?? t.room.startError);
  };

  if (!code) {
    return (
      <Card className="flex flex-col items-center gap-5 p-8 text-center">
        <p className="max-w-lg text-body text-label-2">{race ? t.games_ui.liveHint : t.room.intro}</p>
        {!race && (
          <label className="flex max-w-lg cursor-pointer items-start gap-3 rounded-2xl bg-fill p-4 text-left">
            <input
              type="checkbox"
              checked={shuffle}
              onChange={(e) => setShuffle(e.target.checked)}
              className="mt-0.5 h-6 w-6 shrink-0 accent-accent"
            />
            <span>
              <span className="block text-body font-semibold">{t.room.shuffle}</span>
              <span className="mt-0.5 block text-footnote text-label-2">{t.room.shuffleHint}</span>
            </span>
          </label>
        )}
        <Button size="lg" onClick={start} disabled={starting}>
          <SparkleIcon />
          {starting ? t.room.starting : t.room.start}
        </Button>
        {error && <p className="text-subhead text-red">{error}</p>}
      </Card>
    );
  }

  const restart = () => setCode(null);
  return race ? (
    <RaceRoom key={code} code={code} onRestart={restart} />
  ) : (
    <LiveRoom key={code} code={code} game={game} onRestart={restart} />
  );
}

/** Состояние комнаты с сервера; receivedAt — когда пришло (для обратного отсчёта между опросами) */
function useRoom(code: string, pollMs: number) {
  const [room, setRoom] = useState<(RoomState & { receivedAt: number }) | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let active = true;
    const load = () =>
      fetch(`/api/rooms/${code}`)
        .then((r) => r.json())
        .then((data) => active && data.results && setRoom({ ...data, receivedAt: Date.now() }))
        .catch(() => {});
    load();
    const timer = setInterval(load, pollMs);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [code, pollMs, version]);

  // reload — сразу перечитать комнату (после действия учителя), не дожидаясь опроса
  return { room, setRoom, reload: () => setVersion((v) => v + 1) };
}

async function finishRoom(code: string, confirmText: string) {
  if (!window.confirm(confirmText)) return false;
  await fetch(`/api/rooms/${code}`, { method: "PATCH" }).catch(() => null);
  return true;
}

// Адрес для QR: на опубликованном сайте — его адрес, а если сайт открыт
// как localhost — адрес этого компьютера в Wi-Fi сети (lan: true).
// Панель появляется только после нажатия кнопки, поэтому window здесь уже есть.
function JoinPanel({ code }: { code: string }) {
  const t = useT();
  const [baseIndex, setBaseIndex] = useState(0);
  const [network, setNetwork] = useState<{ urls: string[]; lan: boolean } | null>(() =>
    isLocalHost(window.location.hostname) ? null : { urls: [window.location.origin], lan: false },
  );

  useEffect(() => {
    if (network) return;
    const fallback = { urls: [window.location.origin], lan: false };
    fetch("/api/network")
      .then((r) => r.json())
      .then((data: { urls: string[] }) => setNetwork(data.urls.length ? { urls: data.urls, lan: true } : fallback))
      .catch(() => setNetwork(fallback));
  }, [network]);

  const joinBases = network?.urls ?? [];
  const base = joinBases[baseIndex];
  const joinUrl = base ? `${base}/play/${code}` : null;

  return (
    <>
      <p className="text-subhead font-semibold text-label-2">{t.room.scan}</p>
      {joinUrl ? (
        <QrCode text={joinUrl} className="w-full max-w-72 rounded-xl" />
      ) : (
        <div className="aspect-square w-full max-w-72 animate-pulse rounded-xl bg-fill" />
      )}
      <p className="text-footnote text-label-2">
        {t.room.orOpen} <b className="break-all text-accent">{base ? `${base}/play` : "…"}</b> {t.room.typeCode}
      </p>
      <p className="text-display font-bold tabular-nums tracking-widest">{code}</p>
      {joinBases.length > 1 && (
        <select
          value={baseIndex}
          onChange={(e) => setBaseIndex(Number(e.target.value))}
          aria-label={t.room.network}
          className="rounded-lg bg-fill px-3 py-1.5 text-footnote"
        >
          {joinBases.map((b, i) => (
            <option key={b} value={i}>
              {b}
            </option>
          ))}
        </select>
      )}
      {network?.lan && <p className="text-caption text-label-2">{t.room.sameWifi}</p>}
    </>
  );
}

function LiveRoom({ code, game, onRestart }: { code: string; game: RoomGame; onRestart: () => void }) {
  const { room, setRoom } = useRoom(code, POLL_MS);
  const t = useT();

  const finish = async () => {
    if (await finishRoom(code, t.room.confirmFinish)) setRoom((r) => r && { ...r, status: "finished" });
  };

  const finished = room?.status === "finished";
  const total = room?.total ?? 0;
  const results = room?.results ?? [];

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,22rem)_1fr]">
        <Card className="flex flex-col items-center gap-3 p-5 text-center">
          {finished ? <p className="py-10 text-title2 font-bold">{t.room.finished}</p> : <JoinPanel code={code} />}
        </Card>

        <Card className="flex flex-col p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-title3 font-semibold">
              {t.room.results} <span className="text-label-2">· {t.room.students(results.length)}</span>
            </h3>
            <div className="flex flex-wrap gap-2">
              <CsvButton code={code} game={game} total={total} results={results} />
              {finished ? (
                <Button onClick={onRestart}>{t.room.newGame}</Button>
              ) : (
                <Button onClick={finish} className="bg-red hover:bg-red/85">
                  {t.room.finish}
                </Button>
              )}
            </div>
          </div>

          {results.length === 0 ? (
            <p className="py-14 text-center text-body text-label-2">{t.room.waiting}</p>
          ) : (
            <div className="mt-4">
              <ResultsTable results={results} total={total} game={game} />
            </div>
          )}
        </Card>
      </div>
      {results.length > 0 && room && <QuestionStats stats={room.stats} />}
    </div>
  );
}

// ——— «Жарыс» ———

function RaceRoom({ code, onRestart }: { code: string; onRestart: () => void }) {
  const { room, reload } = useRoom(code, RACE_POLL_MS);
  const [now, setNow] = useState(() => Date.now());
  const [busy, setBusy] = useState(false);
  const autoRevealed = useRef(-1);
  const t = useT();
  const race = room?.race;

  // Часы для обратного отсчёта между опросами сервера
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(timer);
  }, []);

  const act = async (action: "start" | "reveal" | "next") => {
    setBusy(true);
    await fetch(`/api/rooms/${code}/live`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    }).catch(() => null);
    setBusy(false);
    reload();
  };

  const remaining = race && room ? Math.max(0, race.remainingMs - (now - room.receivedAt)) : 0;
  const players = race?.players.length ?? 0;
  const allAnswered = players > 0 && (race?.answered ?? 0) >= players;

  // Время вышло или ответили все — показываем ответ сами, один раз на вопрос
  useEffect(() => {
    if (race?.phase !== "question" || autoRevealed.current === race.index) return;
    if (remaining > 0 && !allAnswered) return;
    autoRevealed.current = race.index;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- запрос к серверу по таймеру, а не вычисление состояния
    act("reveal");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [race?.phase, race?.index, remaining, allAnswered]);

  if (!room || !race) return <Card className="h-80 animate-pulse" />;

  if (race.phase === "lobby") {
    return (
      <div className="grid gap-5 lg:grid-cols-[minmax(0,22rem)_1fr]">
        <Card className="flex flex-col items-center gap-3 p-5 text-center">
          <JoinPanel code={code} />
        </Card>
        <Card className="flex flex-col gap-4 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-title3 font-semibold">
              {t.race.lobbyTitle} <span className="text-label-2">· {t.race.joined(players)}</span>
            </h3>
            <Button size="lg" onClick={() => act("start")} disabled={players === 0 || busy}>
              {t.race.start}
            </Button>
          </div>
          {players === 0 ? (
            <p className="py-14 text-center text-body text-label-2">{t.race.needPlayers}</p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {race.players.map((name, i) => (
                <li key={i} className="rounded-full bg-accent/12 px-4 py-2 text-body font-semibold text-accent">
                  {name}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    );
  }

  if (race.phase === "finished" || room.status === "finished") {
    return (
      <div className="flex flex-col gap-5">
        <Card className="flex flex-col items-center gap-6 p-6">
          <h3 className="text-title1 font-bold">{t.race.winners}</h3>
          <Podium results={room.results} />
        </Card>
        <Card className="flex flex-col p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-title3 font-semibold">
              {t.race.allResults} <span className="text-label-2">· {t.room.students(room.results.length)}</span>
            </h3>
            <div className="flex flex-wrap gap-2">
              <CsvButton code={code} game="race" total={room.total} results={room.results} />
              <Button onClick={onRestart}>{t.room.newGame}</Button>
            </div>
          </div>
          <div className="mt-4">
            <ResultsTable results={room.results} total={room.total} game="race" />
          </div>
        </Card>
        <QuestionStats stats={room.stats} />
      </div>
    );
  }

  const question = race.question;
  const revealed = race.phase === "reveal";
  const last = race.index + 1 >= race.total;
  const seconds = Math.ceil(remaining / 1000);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-subhead font-semibold text-label-2">{t.race.questionOf(race.index + 1, race.total)}</span>
        <span className="text-subhead font-semibold">{t.race.answered(race.answered, players)}</span>
        {!revealed && (
          <span
            className={`flex h-16 w-16 items-center justify-center rounded-full text-title1 font-bold tabular-nums text-white ${
              seconds <= 5 ? "bg-red" : "bg-accent"
            }`}
          >
            {seconds}
          </span>
        )}
      </div>

      {question && (
        <>
          <Card className="flex flex-col items-center gap-4 p-6 text-center">
            <h3 className="text-title1 font-bold">{question.prompt}</h3>
            {question.image && <RemoteImage image={question.image} className="max-h-[35vh]" />}
          </Card>
          <div className="grid gap-3 sm:grid-cols-2">
            {question.options.map((option, i) => {
              const correct = revealed && race.correctIndex === i;
              return (
                <div
                  key={i}
                  className={`flex min-h-20 items-center gap-4 rounded-2xl px-5 py-3 text-title3 font-semibold text-white transition ${
                    raceTiles[i].color
                  } ${revealed && !correct ? "opacity-30" : ""}`}
                >
                  <span className="text-title1" aria-hidden="true">
                    {raceTiles[i].shape}
                  </span>
                  <span className="flex-1">{option}</span>
                  {revealed && (
                    <span className="flex items-center gap-1.5 text-title2 font-bold tabular-nums">
                      {correct && <CheckIcon />}
                      {race.counts?.[i] ?? 0}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {revealed && (
        <Card className="flex flex-col gap-3 p-5">
          <h3 className="text-title3 font-semibold">{t.race.leaders}</h3>
          <ResultsTable results={room.results.slice(0, 5)} total={room.total} game="race" />
        </Card>
      )}

      <div className="flex flex-wrap justify-between gap-3">
        <Button
          variant="plain"
          onClick={async () => (await finishRoom(code, t.room.confirmFinish)) && reload()}
          className="text-red"
        >
          {t.room.finish}
        </Button>
        {revealed ? (
          <Button size="lg" onClick={() => act("next")} disabled={busy}>
            {last ? t.race.toResults : t.race.next}
          </Button>
        ) : (
          <Button size="lg" variant="tinted" onClick={() => act("reveal")} disabled={busy}>
            {t.race.showAnswer}
          </Button>
        )}
      </div>
    </div>
  );
}

/** Пьедестал: 2-е место слева, 1-е по центру и выше, 3-е справа */
function Podium({ results }: { results: PlayerResult[] }) {
  const t = useT();
  const places = [
    { result: results[1], place: 2, height: "h-28", color: "bg-indigo" },
    { result: results[0], place: 1, height: "h-40", color: "bg-orange" },
    { result: results[2], place: 3, height: "h-20", color: "bg-teal" },
  ];
  return (
    <div className="flex w-full max-w-xl items-end justify-center gap-3">
      {places.map(({ result, place, height, color }) => (
        <div key={place} className="flex flex-1 flex-col items-center gap-2 text-center">
          {result && (
            <>
              <p className="w-full truncate text-body font-bold">{result.name}</p>
              <p className="text-subhead text-label-2 tabular-nums">{t.common.points(result.points)}</p>
            </>
          )}
          <div className={`flex w-full items-start justify-center rounded-t-2xl pt-3 text-title1 font-bold text-white ${height} ${color}`}>
            {place}
          </div>
        </div>
      ))}
    </div>
  );
}
