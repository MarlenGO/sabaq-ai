"use client";

import Link from "next/link";
import { useState } from "react";
import { subjectOrder } from "@/lib/labels";
import { subjectLook } from "@/data/catalog";
import { useT } from "@/i18n/client";
import { SearchField } from "@/components/ui/SearchField";
import { LucideIcon } from "@/components/ui/LucideIcon";
import { subjectColors } from "@/components/home/SubjectBadge";

// Главная: плитки предметов с поиском. Плитка — мягкий цвет предмета,
// крупная иконка и название. Нажали — открывается страница предмета.
export function SubjectGrid() {
  const t = useT();
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const shown = subjectOrder.filter((s) => !q || t.subjects[s].toLowerCase().includes(q));

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-title1 font-extrabold tracking-tight sm:text-large">{t.home.title}</h1>
        <SearchField value={query} onChange={setQuery} placeholder={t.home.search} label={t.home.searchLabel} />
      </div>

      {shown.length === 0 ? (
        <p className="mt-10 text-body text-label-2">{t.home.nothing}</p>
      ) : (
        <ul className="mt-7 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {shown.map((subject) => (
            <li key={subject}>
              <Link
                href={`/subject/${subject}`}
                style={subjectColors(subject)}
                className="flex aspect-[4/3] flex-col justify-between rounded-3xl bg-(--tile) p-4 transition-colors hover:bg-[color-mix(in_srgb,var(--tile)_88%,var(--ink))] sm:p-5"
              >
                <LucideIcon svg={subjectLook[subject].icon} className="size-10 text-(--ink) sm:size-12 [&>svg]:stroke-[1.5]" />
                <span className="text-callout font-bold leading-tight sm:text-title3">{t.subjects[subject]}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
