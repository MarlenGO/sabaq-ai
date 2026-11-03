"use client";

import { useEffect, useState } from "react";
import type { PlayerResult, RoomGame } from "@/types/room";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SparkleIcon } from "@/components/ui/Icons";
import { QrCode } from "./QrCode";
import { CsvButton, ResultsTable } from "./ResultsTable";
import { useT } from "@/i18n/client";

// Экран учителя для игры через QR: код, QR-код и таблица, которая
// обновляется каждые 2 секунды, пока ученики отвечают на телефонах.

const POLL_MS = 2000;

interface RoomState {
  status: "open" | "finished";
  total: number;
  results: PlayerResult[];
}

const isLocalHost = (host: string) => host === "localhost" || host === "127.0.0.1" || host === "[::1]";

export function RoomHost({ lessonId, game }: { lessonId: string; game: RoomGame }) {
  const [code, setCode] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const t = useT();

  const start = async () => {
    setStarting(true);
    setError(null);
    const response = await fetch("/api/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lessonId, game }),
    }).catch(() => null);
    const data = await response?.json().catch(() => null);
    setStarting(false);
    if (response?.ok && data?.code) setCode(data.code);
    else setError(data?.error ?? t.room.startError);
  };

  if (!code) {
    return (
      <Card className="flex flex-col items-center gap-4 p-8 text-center">
        <p className="max-w-lg text-body text-label-2">
          {t.room.intro}
        </p>
        <Button size="lg" onClick={start} disabled={starting}>
          <SparkleIcon />
          {starting ? t.room.starting : t.room.start}
        </Button>
        {error && <p className="text-subhead text-red">{error}</p>}
      </Card>
    );
  }

  return <LiveRoom key={code} code={code} game={game} onRestart={() => setCode(null)} />;
}

function LiveRoom({ code, game, onRestart }: { code: string; game: RoomGame; onRestart: () => void }) {
  const [room, setRoom] = useState<RoomState | null>(null);
  const [baseIndex, setBaseIndex] = useState(0);
  const t = useT();
  // Адрес для QR: на опубликованном сайте — его адрес, а если сайт открыт
  // как localhost — адрес этого компьютера в Wi-Fi сети (lan: true).
  // LiveRoom появляется только после нажатия кнопки, поэтому window здесь уже есть.
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

  useEffect(() => {
    let active = true;
    const load = () =>
      fetch(`/api/rooms/${code}`)
        .then((r) => r.json())
        .then((data) => active && data.results && setRoom(data))
        .catch(() => {});
    load();
    const timer = setInterval(load, POLL_MS);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [code]);

  const finish = async () => {
    if (!window.confirm(t.room.confirmFinish)) return;
    await fetch(`/api/rooms/${code}`, { method: "PATCH" }).catch(() => null);
    setRoom((r) => r && { ...r, status: "finished" });
  };

  const base = joinBases[baseIndex];
  const joinUrl = base ? `${base}/play/${code}` : null;
  const finished = room?.status === "finished";
  const total = room?.total ?? 0;
  const results = room?.results ?? [];

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,22rem)_1fr]">
      <Card className="flex flex-col items-center gap-3 p-5 text-center">
        {finished ? (
          <p className="py-10 text-title2 font-bold">{t.room.finished}</p>
        ) : (
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
            {network?.lan && (
              <p className="text-caption text-label-2">
                {t.room.sameWifi}
              </p>
            )}
          </>
        )}
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
  );
}
