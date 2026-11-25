"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import type { Subject } from "@/types/topic-package";
import { deckTypeOrder } from "@/slides/structures";
import { games } from "@/games/registry";
import { deckTypeIcon, docIcon, docPath, gameIcon, type CreateKind } from "@/data/catalog";
import { docKinds } from "@/types/documents";
import { useT } from "@/i18n/client";
import { SearchField } from "@/components/ui/SearchField";
import { LucideIcon } from "@/components/ui/LucideIcon";
import { ArrowLeftIcon, ChevronDownIcon, ChevronRightIcon } from "@/components/ui/Icons";
import { CreatePanel } from "@/components/home/CreateForm";
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
// Презентация и игра создаются прямо здесь: нажали на строку — под ней раскрылась
// короткая форма (тема, язык, класс), без лишней страницы. Открыта одна строка за раз.
// Документы открываются отдельной страницей: там нужен предпросмотр листа.
export function SubjectMenu({ subject }: { subject: Subject }) {
  const t = useT();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const toggle = (key: string) => setOpen(open === key ? null : key);
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
      {/* ?all=1 — сетка всех предметов, даже если выбран «Менің пәнім» */}
      <Link
        href="/?all=1"
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
              <CreateRow
                key={item.id}
                item={item}
                subject={subject}
                kind={{ type: "deck", id: item.id }}
                open={open === `deck:${item.id}`}
                onToggle={() => toggle(`deck:${item.id}`)}
              />
            ))}
          </List>
        )}
        {gameItems.length > 0 && (
          <List title={t.subject.games} hint={t.subject.gamesHint}>
            {gameItems.map((item) => (
              <CreateRow
                key={item.id}
                item={item}
                subject={subject}
                kind={{ type: "game", id: item.id }}
                open={open === `game:${item.id}`}
                onToggle={() => toggle(`game:${item.id}`)}
              />
            ))}
          </List>
        )}
      </div>
      {docs.length + decks.length + gameItems.length === 0 && <p className="mt-10 text-body text-label-2">{t.home.nothing}</p>}
    </div>
  );
}

// Без overflow-hidden у списка: иначе всплывающие списки формы обрезаются краем листа.
// Поэтому углы скругляем сами — у первой и последней строки.
function List({ title, hint, children }: { title: string; hint: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="text-title2 font-extrabold tracking-tight">{title}</h2>
      <p className="mt-0.5 text-subhead text-label-2">{hint}</p>
      <ul className="mt-4 divide-y divide-separator rounded-3xl bg-surface *:first:rounded-t-3xl *:last:rounded-b-3xl">{children}</ul>
    </section>
  );
}

function Row({ item, href }: { item: Item; href: string }) {
  return (
    <li>
      <Link href={href} className="flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-fill sm:px-5 [li:first-child>&]:rounded-t-3xl [li:last-child>&:last-child]:rounded-b-3xl">
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

/** Строка, которая раскрывается в форму создания прямо под собой */
function CreateRow(props: {
  item: Item;
  subject: Subject;
  kind: Exclude<CreateKind, { type: "doc" }>;
  open: boolean;
  onToggle: () => void;
}) {
  const { item, open } = props;
  const panelId = `create-${props.kind.type}-${item.id}`;
  return (
    <li className={open ? "bg-(--tile)/40" : ""}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={props.onToggle}
        className="flex w-full items-center gap-4 px-4 py-3.5 text-left transition-colors hover:bg-fill sm:px-5 [li:first-child>&]:rounded-t-3xl [li:last-child>&:last-child]:rounded-b-3xl"
      >
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-(--tile) text-(--ink)">
          <LucideIcon svg={item.icon} className="size-6 [&>svg]:stroke-[1.7]" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-body font-bold leading-snug">{item.title}</span>
          <span className="block text-footnote text-label-2">{item.text}</span>
        </span>
        <ChevronDownIcon className={`shrink-0 transition ${open ? "rotate-180 text-accent" : "text-label-3"}`} />
      </button>
      {open && (
        <div id={panelId} className="px-4 pb-5 pt-1 sm:px-5">
          <CreatePanel subject={props.subject} kind={props.kind} autoFocus />
        </div>
      )}
    </li>
  );
}
