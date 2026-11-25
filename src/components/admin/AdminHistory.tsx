"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition, type ReactNode } from "react";
import type { HistoryDelete, HistoryLesson, HistoryRoom } from "@/lib/admin";
import type { DeckType, Subject } from "@/types/topic-package";
import type { GameId } from "@/games/registry";
import { useT } from "@/i18n/client";
import { fieldClass } from "@/components/ui/field";
import { SearchIcon, TrashIcon } from "@/components/ui/Icons";

/** Сколько строк показываем сразу: остальное — через поиск или выбор учителя */
const LIMIT = 100;

// Тарих: уроки (презентации и игры) и QR-игры всех учителей. Админ может удалить
// один урок, одну QR-игру или всю историю выбранного учителя — чтобы база не переполнялась.
export function AdminHistory(props: {
  teachers: { id: string; name: string }[];
  lessons: HistoryLesson[];
  rooms: HistoryRoom[];
  /** Даты, отформатированные на сервере (так они совпадут с браузером) */
  dates: Record<string, string>;
}) {
  const t = useT();
  const h = t.admin.history;
  const router = useRouter();
  const [busy, startTransition] = useTransition();
  const [teacher, setTeacher] = useState("");
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const needle = query.trim().toLowerCase();

  const lessons = props.lessons.filter(
    (l) => (!teacher || l.ownerId === teacher) && (!needle || l.topic.toLowerCase().includes(needle)),
  );
  const rooms = props.rooms.filter(
    (r) => (!teacher || r.ownerId === teacher) && (!needle || r.topic.toLowerCase().includes(needle)),
  );
  const teacherName = props.teachers.find((x) => x.id === teacher)?.name ?? "";

  const run = (target: HistoryDelete, question: string) => {
    if (!window.confirm(question)) return;
    startTransition(async () => {
      const response = await fetch("/api/admin/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(target),
      }).catch(() => null);
      const data = await response?.json().catch(() => null);
      setResult(response?.ok ? h.deleted(data?.removed ?? 0) : (data?.error ?? t.common.netError));
      router.refresh();
    });
  };

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

      {(teacher || result) && (
        <div className="flex flex-wrap items-center gap-3">
          {teacher && (
            <DeleteButton
              disabled={busy}
              onClick={() =>
                run(
                  { action: "teacher", userId: teacher },
                  h.confirmTeacher(teacherName, props.lessons.filter((l) => l.ownerId === teacher).length),
                )
              }
            >
              {h.deleteTeacher}
            </DeleteButton>
          )}
          {result && <span className="text-subhead text-label-2">{result}</span>}
        </div>
      )}

      <Section title={`${h.lessons} (${lessons.length})`}>
        {lessons.length === 0 && <Empty>{h.nothing}</Empty>}
        {lessons.slice(0, LIMIT).map((l) => (
          <Row
            key={l.id}
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
            action={
              <DeleteButton disabled={busy} onClick={() => run({ action: "lesson", id: l.id }, h.confirmLesson(l.topic))}>
                {h.delete}
              </DeleteButton>
            }
          />
        ))}
        {lessons.length > LIMIT && <Empty>{h.more(lessons.length - LIMIT)}</Empty>}
      </Section>

      <Section title={`${h.rooms} (${rooms.length})`}>
        {rooms.length === 0 && <Empty>{h.nothing}</Empty>}
        {rooms.slice(0, LIMIT).map((r) => (
          <Row
            key={r.code}
            title={`${t.games[r.game as GameId]?.title ?? r.game} · ${r.topic}`}
            details={[h.players(r.players), r.ownerName, props.dates[r.at]]}
            action={
              <DeleteButton disabled={busy} onClick={() => run({ action: "room", code: r.code }, h.confirmRoom)}>
                {h.delete}
              </DeleteButton>
            }
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

function Row(props: { title: string; details: (string | null | undefined)[]; href?: string; openLabel?: string; action: ReactNode }) {
  const text = (
    <>
      <span className="block truncate text-body font-semibold">{props.title}</span>
      <span className="block text-footnote text-label-2">{props.details.filter(Boolean).join(" · ")}</span>
    </>
  );
  return (
    <li className="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-5">
      {props.href ? (
        <Link href={props.href} title={props.openLabel} className="min-w-0 flex-1 hover:opacity-70">
          {text}
        </Link>
      ) : (
        <span className="min-w-0 flex-1">{text}</span>
      )}
      {props.action}
    </li>
  );
}

function DeleteButton({ children, disabled, onClick }: { children: ReactNode; disabled: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-11 items-center gap-2 rounded-full bg-red/10 px-4 text-subhead font-semibold text-red transition hover:bg-red/15 disabled:opacity-50"
    >
      <TrashIcon />
      {children}
    </button>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return <li className="px-5 py-4 text-subhead text-label-2">{children}</li>;
}
