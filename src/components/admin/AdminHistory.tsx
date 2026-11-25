"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import type { HistoryLesson, HistoryRoom } from "@/lib/admin";
import type { DeckType, Subject } from "@/types/topic-package";
import type { GameId } from "@/games/registry";
import { useT } from "@/i18n/client";
import { fieldClass } from "@/components/ui/field";
import { SearchIcon } from "@/components/ui/Icons";
import { Checkbox, SelectionBar, useHistorySelection } from "@/components/ui/Selection";

/** Сколько строк показываем сразу: остальное — через поиск или выбор учителя */
const LIMIT = 100;

// Тарих: уроки (презентации и игры) и QR-игры всех учителей. Админ отмечает галочками
// (или «Барлығын таңдау» — всё найденное) и удаляет, чтобы база не переполнялась.
export function AdminHistory(props: {
  teachers: { id: string; name: string }[];
  lessons: HistoryLesson[];
  rooms: HistoryRoom[];
  /** Даты, отформатированные на сервере (так они совпадут с браузером) */
  dates: Record<string, string>;
}) {
  const t = useT();
  const h = t.admin.history;
  const [teacher, setTeacher] = useState("");
  const [query, setQuery] = useState("");
  const selection = useHistorySelection("/api/admin/history");
  const needle = query.trim().toLowerCase();

  const lessons = props.lessons.filter(
    (l) => (!teacher || l.ownerId === teacher) && (!needle || l.topic.toLowerCase().includes(needle)),
  );
  const rooms = props.rooms.filter(
    (r) => (!teacher || r.ownerId === teacher) && (!needle || r.topic.toLowerCase().includes(needle)),
  );
  // «Барлығын таңдау» берёт всё найденное, а не только первые 100 строк
  const refs = [...lessons.map((l) => `lesson:${l.id}`), ...rooms.map((r) => `room:${r.code}`)];

  return (
    <div className="flex flex-col gap-5">
      <p className="text-body text-label-2">{h.hint}</p>

      <div className="grid gap-3 md:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]">
        <label className="flex flex-col gap-1">
          <span className="text-footnote text-label-2">{h.teacher}</span>
          <select className={fieldClass} value={teacher} onChange={(e) => setTeacher(e.target.value)}>
            <option value="">{h.allTeachers}</option>
            {props.teachers.map((x) => (
              <option key={x.id} value={x.id}>
                {x.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-footnote text-label-2">{h.search}</span>
          <span className="relative">
            <SearchIcon className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-label-2" />
            <input className={`${fieldClass} w-full pl-12`} value={query} onChange={(e) => setQuery(e.target.value)} />
          </span>
        </label>
      </div>

      <SelectionBar refs={refs} selection={selection} />

      <Section title={`${h.lessons} (${lessons.length})`}>
        {lessons.length === 0 && <Empty>{h.nothing}</Empty>}
        {lessons.slice(0, LIMIT).map((l) => (
          <Row
            key={l.id}
            check={<Checkbox checked={selection.selected.has(`lesson:${l.id}`)} onChange={() => selection.toggle(`lesson:${l.id}`)} label={l.topic} />}
            title={l.topic}
            href={`/lesson/${l.id}?view=1`}
            openLabel={h.open}
            details={[
              t.subjects[l.subject as Subject] ?? l.subject,
              t.common.grade(l.grade),
              t.deckTypes[l.deckType as DeckType]?.name ?? l.deckType,
              l.empty ? h.empty : null,
              l.featured ? h.inLibrary : null,
              l.ownerName,
              props.dates[l.at],
            ]}
          />
        ))}
        {lessons.length > LIMIT && <Empty>{h.more(lessons.length - LIMIT)}</Empty>}
      </Section>

      <Section title={`${h.rooms} (${rooms.length})`}>
        {rooms.length === 0 && <Empty>{h.nothing}</Empty>}
        {rooms.slice(0, LIMIT).map((r) => (
          <Row
            key={r.code}
            check={<Checkbox checked={selection.selected.has(`room:${r.code}`)} onChange={() => selection.toggle(`room:${r.code}`)} label={r.topic} />}
            title={`${t.games[r.game as GameId]?.title ?? r.game} · ${r.topic}`}
            details={[h.players(r.players), r.ownerName, props.dates[r.at]]}
          />
        ))}
        {rooms.length > LIMIT && <Empty>{h.more(rooms.length - LIMIT)}</Empty>}
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="text-title3 font-bold">{title}</h2>
      <ul className="mt-3 divide-y divide-separator overflow-hidden rounded-3xl bg-surface">{children}</ul>
    </section>
  );
}

function Row(props: { title: string; details: (string | null | undefined)[]; href?: string; openLabel?: string; check: ReactNode }) {
  const text = (
    <>
      <span className="block truncate text-body font-semibold">{props.title}</span>
      <span className="block text-footnote text-label-2">{props.details.filter(Boolean).join(" · ")}</span>
    </>
  );
  return (
    <li className="flex items-center gap-2 py-2 pl-1 pr-4 sm:pr-5">
      {props.check}
      {props.href ? (
        <Link href={props.href} title={props.openLabel} className="min-w-0 flex-1 hover:opacity-70">
          {text}
        </Link>
      ) : (
        <span className="min-w-0 flex-1">{text}</span>
      )}
    </li>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return <li className="px-5 py-4 text-subhead text-label-2">{children}</li>;
}
