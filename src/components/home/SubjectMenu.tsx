"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import type { Subject } from "@/types/topic-package";
import { deckTypeOrder } from "@/slides/structures";
import { games } from "@/games/registry";
import { deckTypeIcon, docIcon, docPath, gameIcon } from "@/data/catalog";
import { docKinds } from "@/types/documents";
import { useT } from "@/i18n/client";
import { SearchField } from "@/components/ui/SearchField";
import { LucideIcon } from "@/components/ui/LucideIcon";
import { ArrowLeftIcon, ChevronRightIcon } from "@/components/ui/Icons";
import { SubjectBadge, subjectColors } from "@/components/home/SubjectBadge";

interface Item {
  id: string;
  icon: string;
  title: string;
  text: string;
}

// Меню предмета: три списка — «Құжаттар» (ҚМЖ, тест, БЖБ), «Презентация» (все виды)
// и «Ойындар» (все игры).
// Каждый список — один белый лист со строками, как страница в тетради:
// глазу спокойнее, чем от россыпи отдельных карточек. Поиск фильтрует все три.
export function SubjectMenu({ subject }: { subject: Subject }) {
  const t = useT();
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const match = (item: Item) => !q || `${item.title} ${item.text}`.toLowerCase().includes(q);

  const docs = docKinds
    .map((id) => ({ id, icon: docIcon[id], title: t.docs.kinds[id].name, text: t.docs.kinds[id].description }))
    .filter(match);
  const decks = deckTypeOrder
    .map((id) => ({ id, icon: deckTypeIcon[id], title: t.deckTypes[id].name, text: t.deckTypes[id].description }))
    .filter(match);
  const gameItems = games
    .map((g) => ({ id: g.id, icon: gameIcon[g.id], title: t.games[g.id].title, text: t.games[g.id].description }))
    .filter(match);

  return (
    <div style={subjectColors(subject)}>
      <Link
        href="/"
        className="inline-flex h-11 items-center gap-1.5 rounded-full pr-3 text-subhead font-semibold text-accent hover:opacity-70"
      >
        <ArrowLeftIcon />
        {t.subject.all}
      </Link>

      <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <SubjectBadge subject={subject} />
          <h1 className="text-title1 font-extrabold tracking-tight sm:text-large">{t.subjects[subject]}</h1>
        </div>
        <SearchField value={query} onChange={setQuery} placeholder={t.subject.search} label={t.subject.searchLabel} />
      </div>

      <div className="mt-8 grid items-start gap-8 lg:grid-cols-2 xl:grid-cols-3">
        {docs.length > 0 && (
          <List title={t.docs.title} hint={t.docs.hint}>
            {docs.map((item) => (
              <Row key={item.id} item={item} href={`/subject/${subject}/${docPath(item.id)}`} />
            ))}
          </List>
        )}
        {decks.length > 0 && (
          <List title={t.subject.presentations} hint={t.subject.presentationsHint}>
            {decks.map((item) => (
              <Row key={item.id} item={item} href={`/subject/${subject}/${item.id}`} />
            ))}
          </List>
        )}
        {gameItems.length > 0 && (
          <List title={t.subject.games} hint={t.subject.gamesHint}>
            {gameItems.map((item) => (
              <Row key={item.id} item={item} href={`/subject/${subject}/${item.id}`} />
            ))}
          </List>
        )}
      </div>
      {docs.length + decks.length + gameItems.length === 0 && <p className="mt-10 text-body text-label-2">{t.home.nothing}</p>}
    </div>
  );
}

function List({ title, hint, children }: { title: string; hint: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="text-title2 font-extrabold tracking-tight">{title}</h2>
      <p className="mt-0.5 text-subhead text-label-2">{hint}</p>
      <ul className="mt-4 divide-y divide-separator overflow-hidden rounded-3xl bg-surface">{children}</ul>
    </section>
  );
}

function Row({ item, href }: { item: Item; href: string }) {
  return (
    <li>
      <Link href={href} className="flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-fill sm:px-5">
        {/* Иконка в цвете предмета: страница «Тарих» — тёплая, «Физика» — фиолетовая */}
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-(--tile) text-(--ink)">
          <LucideIcon svg={item.icon} className="size-6 [&>svg]:stroke-[1.7]" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-body font-bold leading-snug">{item.title}</span>
          <span className="block text-footnote text-label-2">{item.text}</span>
        </span>
        <ChevronRightIcon className="shrink-0 text-label-3" />
      </Link>
    </li>
  );
}
