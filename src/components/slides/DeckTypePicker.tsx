"use client";

import { useEffect, useRef, useState } from "react";
import type { DeckType, TopicPackage } from "@/types/topic-package";
import { CheckIcon, ChevronDownIcon } from "@/components/ui/Icons";
import { deckSlideIds, deckTypeOrder } from "@/slides/structures";
import { AiButton } from "@/components/lesson/AiButton";
import { useT } from "@/i18n/client";

// Вид презентации — её структура: урок, отчёт для комиссии, доклад…
// На странице — одна кнопка с выбранным видом; по нажатию всплывает окно с карточками
// (название и какие слайды внутри). Закрывается после выбора, нажатием мимо и Esc.
export function DeckTypePicker({ value, onChange }: { value: DeckType; onChange: (type: DeckType) => void }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (!box.current?.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="flex min-h-11 w-full items-center justify-between gap-3 rounded-2xl border-2 border-accent bg-accent/6 px-4 py-3 text-left transition hover:bg-accent/10"
      >
        <span>
          <span className="block text-callout font-semibold">{t.deckTypes[value].name}</span>
          <span className="mt-0.5 block text-footnote text-label-2">{t.deckTypes[value].description}</span>
        </span>
        <ChevronDownIcon className={`size-5 shrink-0 text-label-2 transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div
          role="radiogroup"
          aria-label={t.lesson.chooseType}
          className="absolute left-0 right-0 top-full z-50 mt-1.5 grid max-h-[70vh] gap-2 overflow-y-auto rounded-2xl bg-surface p-2 shadow-card ring-1 ring-separator sm:grid-cols-2 lg:grid-cols-3"
        >
          {deckTypeOrder.map((type) => {
            const selected = type === value;
            return (
              <button
                key={type}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => {
                  setOpen(false);
                  if (!selected) onChange(type);
                }}
                className={`rounded-2xl border-2 px-4 py-3 text-left transition ${
                  selected ? "border-accent bg-accent/6" : "border-transparent bg-fill hover:border-separator"
                }`}
              >
                <span className="flex items-center gap-1.5 text-callout font-semibold">
                  {selected && <CheckIcon className="size-4 text-accent" />}
                  {t.deckTypes[type].name}
                </span>
                <span className="mt-0.5 block text-footnote text-label-2">{t.deckTypes[type].description}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** «AI для всех слайдов»: пишет все заготовки вида одним запросом, с «Болдырмау» */
export function FillDeckButton({ pkg, onChange }: { pkg: TopicPackage; onChange: (pkg: TopicPackage) => void }) {
  const t = useT();
  const ids = deckSlideIds(pkg);
  return (
    <AiButton
      wide
      label={t.ai.fillAll}
      request={{ part: "deck" }}
      current={Object.fromEntries(ids.map((id) => [id, pkg.deck?.[id]]))}
      apply={(value: Record<string, Record<string, unknown> | undefined>) => {
        const deck = { ...pkg.deck };
        // undefined — у слайда не было правок (при «Болдырмау» возвращаем подсказку)
        for (const id of ids) {
          const data = value[id];
          if (data) deck[id] = data;
          else delete deck[id];
        }
        onChange({ ...pkg, deck });
      }}
      hint={t.ai.fillAllHint}
    />
  );
}
