"use client";

import { useEffect, useState } from "react";
import type { PlayerResult, RoomGame } from "@/types/room";
import { schoolGrade } from "@/lib/labels";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SparkleIcon } from "@/components/ui/Icons";
import { QrCode } from "./QrCode";

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
    else setError(data?.error ?? "Ойын басталмады. Қайталап көріңіз.");
  };

  if (!code) {
    return (
      <Card className="flex flex-col items-center gap-4 p-8 text-center">
        <p className="max-w-lg text-body text-label-2">
          Оқушылар телефонмен QR-кодты сканерлеп, атын жазып кіреді де, сұрақтарға өз қарқынымен жауап береді.
          Әр оқушының нәтижесі осы жерде кесте болып шығады.
        </p>
        <Button size="lg" onClick={start} disabled={starting}>
          <SparkleIcon />
          {starting ? "Дайындап жатырмын…" : "Ойынды бастау"}
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
    if (!window.confirm("Ойынды аяқтаймыз ба? Оқушылар бұдан кейін жауап бере алмайды.")) return;
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
          <p className="py-10 text-title2 font-bold">Ойын аяқталды</p>
        ) : (
          <>
            <p className="text-subhead font-semibold text-label-2">Телефон камерасымен сканерлеңіз</p>
            {joinUrl ? (
              <QrCode text={joinUrl} className="w-full max-w-72 rounded-xl" />
            ) : (
              <div className="aspect-square w-full max-w-72 animate-pulse rounded-xl bg-fill" />
            )}
            <p className="text-footnote text-label-2">
              немесе <b className="break-all text-accent">{base ? `${base}/play` : "…"}</b> ашып, кодты теріңіз:
            </p>
            <p className="text-display font-bold tabular-nums tracking-widest">{code}</p>
            {joinBases.length > 1 && (
              <select
                value={baseIndex}
                onChange={(e) => setBaseIndex(Number(e.target.value))}
                aria-label="Желі мекенжайы"
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
                Телефондар осы компьютермен бір Wi-Fi желісінде болуы керек
              </p>
            )}
          </>
        )}
      </Card>

      <Card className="flex flex-col p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-title3 font-semibold">
            Нәтижелер <span className="text-label-2">· {results.length} оқушы</span>
          </h3>
          <div className="flex flex-wrap gap-2">
            <Button variant="tinted" onClick={() => downloadCsv(code, game, total, results)} disabled={results.length === 0}>
              Excel-ге жүктеу
            </Button>
            {finished ? (
              <Button onClick={onRestart}>Жаңа ойын</Button>
            ) : (
              <Button onClick={finish} className="bg-red hover:bg-red/85">
                Аяқтау
              </Button>
            )}
          </div>
        </div>

        {results.length === 0 ? (
          <p className="py-14 text-center text-body text-label-2">Оқушыларды күтіп тұрмыз…</p>
        ) : (
          <ol className="mt-4 flex flex-col divide-y divide-separator">
            {results.map((r, i) => (
              <li key={r.id} className="flex items-center gap-3 py-2.5">
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-subhead font-bold ${
                    i < 3 ? "bg-orange text-white" : "bg-fill text-label-2"
                  }`}
                >
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-body font-semibold">{r.name}</p>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-fill">
                    <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${(r.answered / Math.max(total, 1)) * 100}%` }} />
                  </div>
                </div>
                <span className="shrink-0 text-right text-subhead tabular-nums">
                  <b className="text-green">{r.correct}</b>
                  <span className="text-label-2"> / {total}</span>
                </span>
                <span className="w-20 shrink-0 text-right text-body font-bold tabular-nums">
                  {game === "quiz" ? r.points : r.answered === total ? `${schoolGrade(r.correct, total)} баға` : "—"}
                </span>
              </li>
            ))}
          </ol>
        )}
      </Card>
    </div>
  );
}

// CSV с «;» и меткой BOM — Excel сразу открывает его с кириллицей и по колонкам
function downloadCsv(code: string, game: RoomGame, total: number, results: PlayerResult[]) {
  const rows = [
    ["№", "Аты-жөні", "Дұрыс", "Барлығы", game === "quiz" ? "Ұпай" : "Баға"],
    ...results.map((r, i) => [
      String(i + 1),
      r.name,
      String(r.correct),
      String(total),
      game === "quiz" ? String(r.points) : String(schoolGrade(r.correct, total)),
    ]),
  ];
  const csv = rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(";")).join("\r\n");
  const url = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `Нәтижелер-${code}.csv`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
