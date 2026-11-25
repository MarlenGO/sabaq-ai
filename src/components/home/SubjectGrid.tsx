"use client";

import Link from "next/link";
import { useState } from "react";
import { subjectOrder } from "@/lib/labels";
import { subjectLook } from "@/data/catalog";
import { useT } from "@/i18n/client";
import { SearchField } from "@/components/ui/SearchField";
import { LucideIcon } from "@/components/ui/LucideIcon";
import type { Subject } from "@/types/topic-package";

// Главная: карточки предметов с поиском. Сверху — обложка насыщенного цвета
// предмета (кольца-линии и большая иконка в светлом круге), снизу — название.
// Нажали — открывается страница предмета.
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
                className="group flex h-full flex-col overflow-hidden rounded-3xl bg-surface shadow-card"
              >
                <Cover subject={subject} />
                <span className="flex flex-1 items-center px-4 py-3 text-callout font-bold leading-tight sm:px-5 sm:py-4 sm:text-title3">
                  {t.subjects[subject]}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

/** Обложка: тёмный цвет предмета, белые кольца слева внизу, большая иконка справа */
function Cover({ subject }: { subject: Subject }) {
  const hue = subjectLook[subject].hue;
  return (
    <span
      style={{ background: `color-mix(in srgb, ${hue} 78%, black)` }}
      className="relative block aspect-[16/10] overflow-hidden transition group-hover:brightness-110"
    >
      <svg viewBox="0 0 160 100" className="absolute inset-0 size-full" aria-hidden preserveAspectRatio="xMidYMid slice">
        {[18, 30, 42, 54, 66].map((r) => (
          <circle key={r} cx="0" cy="100" r={r} fill="none" stroke="white" strokeOpacity={0.22} strokeWidth="1" />
        ))}
        <circle cx="122" cy="46" r="44" fill="white" fillOpacity="0.14" />
        <circle cx="122" cy="46" r="32" fill="white" fillOpacity="0.12" />
      </svg>
      <LucideIcon
        svg={subjectLook[subject].icon}
        className="absolute right-[10%] top-1/2 size-[42%] -translate-y-[58%] text-white [&>svg]:size-full [&>svg]:stroke-[1.4]"
      />
    </span>
  );
}
