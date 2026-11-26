"use client";

import { useMemo } from "react";
import type { TopicPackage } from "@/types/topic-package";
import { buildSlides } from "@/slides/layout";
import { lookOf, lookOrder, templateOf } from "@/slides/templates";
import { CheckIcon } from "@/components/ui/Icons";
import { SlideCanvas } from "./SlideCanvas";
import { useT } from "@/i18n/client";


// Выбор дизайна по превью: плитка — титульный и второй слайд этого урока в этом оформлении.
// При выборе дизайна цвета сбрасываются на цвета дизайна (их можно поменять в «Слайд түсі»).
export function LookPicker({ pkg, onChange }: { pkg: TopicPackage; onChange: (pkg: TopicPackage) => void }) {
  const t = useT();
  const current = lookOf(pkg);
  const previews = useMemo(
    () =>
      lookOrder.map((look) => {
        const sample = { ...pkg, look, templateId: undefined };
        const template = templateOf(sample);
        return { look, template, slides: buildSlides(sample, template).slice(0, 2) };
      }),
    [pkg],
  );

  return (
    <div role="radiogroup" aria-label={t.lesson.chooseLook} className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {previews.map(({ look, template, slides }) => {
        const selected = look === current;
        return (
          <button
            key={look}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => !selected && onChange({ ...pkg, look, templateId: undefined })}
            className={`rounded-2xl border-2 p-2 text-left transition ${
              selected ? "border-accent bg-accent/6" : "border-transparent bg-fill hover:border-separator"
            }`}
          >
            <span className="grid grid-cols-2 gap-1.5">
              {slides.map((slide, i) => (
                <SlideCanvas key={i} slide={slide} template={template} />
              ))}
            </span>
            <span className="mt-2 flex items-center gap-1.5 px-1 text-callout font-semibold">
              {selected && <CheckIcon className="text-accent" />}
              {t.looks[look].name}
            </span>
            <span className="block px-1 pb-1 text-footnote text-label-2">{t.looks[look].description}</span>
          </button>
        );
      })}
    </div>
  );
}
