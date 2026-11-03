"use client";

import type { DeckType, TopicPackage } from "@/types/topic-package";
import { deckSlideIds, deckTypeOrder } from "@/slides/structures";
import { AiButton } from "@/components/lesson/AiButton";
import { useT } from "@/i18n/client";

// Вид презентации — её структура: урок, отчёт для комиссии, доклад…
// Карточки с названием и тем, какие слайды внутри, чтобы было понятно без примеров.
export function DeckTypePicker({ value, onChange }: { value: DeckType; onChange: (type: DeckType) => void }) {
  const t = useT();
  return (
    <div role="radiogroup" aria-label={t.lesson.chooseType} className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {deckTypeOrder.map((type) => {
        const selected = type === value;
        return (
          <button
            key={type}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(type)}
            className={`rounded-2xl border-2 px-4 py-3 text-left transition ${
              selected ? "border-accent bg-accent/6" : "border-transparent bg-fill hover:border-separator"
            }`}
          >
            <span className="block text-callout font-semibold">{t.deckTypes[type].name}</span>
            <span className="mt-0.5 block text-footnote text-label-2">{t.deckTypes[type].description}</span>
          </button>
        );
      })}
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
