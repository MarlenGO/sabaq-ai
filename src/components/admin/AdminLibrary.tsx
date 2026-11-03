"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { LessonSummary } from "@/lib/storage/lessons";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CheckIcon, SearchIcon } from "@/components/ui/Icons";
import { fieldClass } from "@/components/ui/field";
import { useT } from "@/i18n/client";

// Библиотека: админ отмечает хорошие уроки — они появляются у всех учителей на главной,
// и каждый может забрать себе копию.
export function AdminLibrary({ lessons }: { lessons: LessonSummary[] }) {
  const t = useT();
  const router = useRouter();
  const [busy, startTransition] = useTransition();
  const [query, setQuery] = useState("");
  const needle = query.trim().toLowerCase();
  const shown = needle ? lessons.filter((l) => `${l.topic} ${l.ownerName ?? ""}`.toLowerCase().includes(needle)) : lessons;

  const toggle = (lesson: LessonSummary) =>
    startTransition(async () => {
      await fetch(`/api/admin/lessons/${lesson.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ featured: !lesson.featured }),
      }).catch(() => null);
      router.refresh();
    });

  return (
    <div className="flex flex-col gap-4">
      <p className="text-body text-label-2">{t.admin.libraryHint}</p>
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-label-2" />
        <input className={`${fieldClass} pl-12`} value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t.history.search} />
      </div>
      {shown.map((lesson) => (
        <Card key={lesson.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
          <Link href={`/lesson/${lesson.id}?view=1`} className="min-w-0 flex-1 hover:opacity-70">
            <p className="truncate text-body font-semibold">{lesson.topic}</p>
            <p className="text-footnote text-label-2">
              {t.subjects[lesson.subject]} · {t.common.grade(lesson.grade)} · {lesson.ownerName ?? "—"}
            </p>
          </Link>
          <Button variant={lesson.featured ? "filled" : "tinted"} disabled={busy} onClick={() => toggle(lesson)}>
            {lesson.featured && <CheckIcon />}
            {lesson.featured ? t.admin.inLibrary : t.admin.addToLibrary}
          </Button>
        </Card>
      ))}
    </div>
  );
}
