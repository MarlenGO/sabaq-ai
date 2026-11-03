"use client";

import type { PlayerResult, RoomGame } from "@/types/room";
import { schoolGrade } from "@/lib/labels";
import { Button } from "@/components/ui/Button";
import type { Messages } from "@/i18n/kk";
import { useT } from "@/i18n/client";

// Таблица результатов QR-игры: на экране учителя во время игры
// и на странице прошлой игры в истории.
export function ResultsTable({ results, total, game }: { results: PlayerResult[]; total: number; game: RoomGame }) {
  const t = useT();
  return (
    <ol className="flex flex-col divide-y divide-separator">
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
              <div
                className="h-full rounded-full bg-accent transition-all"
                style={{ width: `${(r.answered / Math.max(total, 1)) * 100}%` }}
              />
            </div>
          </div>
          <span className="shrink-0 text-right text-subhead tabular-nums">
            <b className="text-green">{r.correct}</b>
            <span className="text-label-2"> / {total}</span>
          </span>
          <span className="w-20 shrink-0 text-right text-body font-bold tabular-nums">
            {game === "quiz" ? r.points : r.answered === total ? t.room.markShort(schoolGrade(r.correct, total)) : "—"}
          </span>
        </li>
      ))}
    </ol>
  );
}

export function CsvButton(props: { code: string; game: RoomGame; total: number; results: PlayerResult[] }) {
  const t = useT();
  return (
    <Button variant="tinted" onClick={() => downloadCsv(props, t)} disabled={props.results.length === 0}>
      {t.room.csv}
    </Button>
  );
}

// CSV с «;» и меткой BOM — Excel сразу открывает его с кириллицей и по колонкам
function downloadCsv(
  { code, game, total, results }: { code: string; game: RoomGame; total: number; results: PlayerResult[] },
  t: Messages,
) {
  const rows = [
    [...t.room.csvHeader, game === "quiz" ? t.room.csvPoints : t.room.csvMark],
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
  link.download = `${t.room.csvFile}-${code}.csv`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
