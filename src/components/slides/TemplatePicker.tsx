"use client";

import type { TopicPackage } from "@/types/topic-package";
import { buildSlides } from "@/slides/layout";
import { templates } from "@/slides/templates";
import { CheckIcon } from "@/components/ui/Icons";
import { SlideCanvas } from "./SlideCanvas";
import { useT } from "@/i18n/client";

// Выбор шаблона по превью: каждая плитка — титульный слайд этого урока в этом шаблоне.
export function TemplatePicker({ pkg, value, onChange }: { pkg: TopicPackage; value: string; onChange: (id: string) => void }) {
  const t = useT();
  return (
    <div role="radiogroup" aria-label={t.lesson.template} className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {templates.map((template) => {
        const selected = template.id === value;
        const [titleSlide] = buildSlides(pkg, template);
        return (
          <button
            key={template.id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(template.id)}
            className={`rounded-2xl border-2 p-1.5 text-left transition ${
              selected ? "border-accent bg-accent/6" : "border-transparent hover:border-separator"
            }`}
          >
            <SlideCanvas slide={titleSlide} template={template} />
            <span className="mt-1.5 flex items-center gap-1 px-1 text-subhead font-semibold">
              {selected && <CheckIcon className="text-accent" />}
              {t.templates[template.id]?.name ?? template.name}
            </span>
            <span className="block px-1 pb-1 text-caption text-label-2">{t.templates[template.id]?.description ?? template.description}</span>
          </button>
        );
      })}
    </div>
  );
}
