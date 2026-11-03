"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import type { HistoryEntry } from "@/types/history";
import { dayKey, dayLabel, timeOf } from "@/lib/dates";
import { Card } from "@/components/ui/Card";
import { fieldClass } from "@/components/ui/field";
import { BookIcon, GameIcon, SearchIcon, SlidesIcon } from "@/components/ui/Icons";
import type { Messages } from "@/i18n/kk";
import { useT } from "@/i18n/client";

// Лента истории: события по дням, фильтр по виду и поиск по теме.
type Filter = "all" | "lesson" | "pptx" | "game";

const filters: { value: Filter; label: (t: Messages) => string }[] = [
  { value: "all", label: (t) => t.history.all },
  { value: "lesson", label: (t) => t.history.lessons },
  { value: "pptx", label: (t) => t.history.presentations },
  { value: "game", label: (t) => t.history.games },
];

export function HistoryList({ entries, today, yesterday }: { entries: HistoryEntry[]; today: string; yesterday: string }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const t = useT();

  const q = query.trim().toLowerCase();
  const visible = entries.filter((e) => (filter === "all" || e.kind === filter) && (!q || e.topic.toLowerCase().includes(q)));

  const days: { key: string; items: HistoryEntry[] }[] = [];
  for (const entry of visible) {
    const key = dayKey(entry.at);
    const last = days[days.length - 1];
    if (last?.key === key) last.items.push(entry);
    else days.push({ key, items: [entry] });
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-label-3" />
          <input
            className={`${fieldClass} pl-12`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.history.search}
            aria-label={t.history.search}
          />
        </div>
        <div role="radiogroup" aria-label={t.history.show} className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <button
              key={f.value}
              type="button"
              role="radio"
              aria-checked={filter === f.value}
              onClick={() => setFilter(f.value)}
              className={`h-11 rounded-full px-4 text-callout font-semibold transition ${
                filter === f.value ? "bg-accent text-white" : "bg-fill text-label hover:bg-accent/15"
              }`}
            >
              {f.label(t)}
            </button>
          ))}
        </div>
      </div>

      {days.length === 0 ? (
        <Card className="p-8 text-center text-body text-label-2">
          {entries.length === 0 ? (
            <>
              {t.history.empty}{" "}
              <Link href="/" className="font-semibold text-accent">
                {t.history.firstLesson}
              </Link>
            </>
          ) : (
            t.history.nothing
          )}
        </Card>
      ) : (
        days.map((day) => (
          <section key={day.key}>
            <h2 className="mb-2 px-1 text-footnote font-semibold uppercase tracking-wide text-label-2">
              {day.key === today ? t.history.today : day.key === yesterday ? t.history.yesterday : dayLabel(day.key)}
            </h2>
            <Card className="divide-y divide-separator overflow-hidden">
              {day.items.map((entry, i) => (
                <Row key={`${entry.kind}-${entry.at}-${i}`} entry={entry} />
              ))}
            </Card>
          </section>
        ))
      )}
    </div>
  );
}

function Row({ entry }: { entry: HistoryEntry }) {
  const t = useT();
  // Из истории урок открывается только для просмотра; «Өзгерту» там же
  const lessonHref = `/lesson/${entry.lessonId}?view=1`;
  let icon: ReactNode;
  let tint: string;
  let title: string;
  let detail: string;
  let href = lessonHref;
  let action = t.common.open;

  if (entry.kind === "lesson") {
    icon = <BookIcon />;
    tint = "bg-accent";
    title = t.history.lessonCreated;
    detail = `${t.subjects[entry.subject]} · ${t.common.grade(entry.grade)}${entry.demo ? ` · ${t.common.demo}` : ""}`;
  } else if (entry.kind === "pptx") {
    icon = <SlidesIcon />;
    tint = "bg-indigo";
    title = t.history.pptxDownloaded;
    detail = `${t.history.templateOf(t.templates[entry.templateId]?.name ?? entry.templateId)} · ${t.common.grade(entry.grade)}`;
  } else if (entry.mode === "screen") {
    icon = <GameIcon />;
    tint = "bg-purple";
    title = t.history.playedOnScreen(t.games[entry.game].title);
    detail = t.common.grade(entry.grade);
    href = `${lessonHref}&game=${entry.game}`;
  } else {
    icon = <GameIcon />;
    tint = "bg-orange";
    title = t.history.viaQr(t.games[entry.game].title);
    detail = entry.players ? t.history.playersAverage(entry.players, entry.averagePercent) : t.history.noPlayers;
    href = `/history/game/${entry.roomCode}`;
    action = t.history.results;
  }

  return (
    <Link href={href} className="flex items-center gap-3 px-4 py-3 transition hover:bg-fill/60">
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white ${tint}`}>{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-body font-semibold">{entry.topic}</p>
        <p className="truncate text-footnote text-label-2">
          {title} · {detail}
        </p>
      </div>
      <span className="shrink-0 text-right">
        <span className="block text-footnote tabular-nums text-label-2">{timeOf(entry.at)}</span>
        <span className="block text-subhead font-semibold text-accent">{action}</span>
      </span>
    </Link>
  );
}
