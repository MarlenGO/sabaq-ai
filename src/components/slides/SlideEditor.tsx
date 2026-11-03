"use client";

import { useRef, useState } from "react";
import type { TopicPackage } from "@/types/topic-package";
import { buildSlides } from "@/slides/layout";
import { getTemplate } from "@/slides/templates";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ArrowLeftIcon, ChevronRightIcon } from "@/components/ui/Icons";
import { useT } from "@/i18n/client";
import { SlideCanvas } from "./SlideCanvas";
import { SlideFields } from "./SlideFields";

// Конструктор презентации по слайдам, как в PowerPoint: слева (на телефоне — сверху)
// маленькие слайды, справа выбранный слайд крупно и поля именно этого слайда.
export function SlideEditor({ pkg, onChange }: { pkg: TopicPackage; onChange: (pkg: TopicPackage) => void }) {
  const t = useT();
  const template = getTemplate(pkg.templateId, pkg.subject);
  const slides = buildSlides(pkg, template);
  const [selected, setSelected] = useState(0);
  // Если факты удалили и слайдов стало меньше — остаёмся на последнем
  const index = Math.min(selected, slides.length - 1);
  const slide = slides[index];
  const top = useRef<HTMLDivElement>(null);

  const select = (i: number) => {
    setSelected(i);
    top.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[11rem_minmax(0,1fr)] lg:gap-6">
      <nav
        aria-label={t.deck.slides}
        className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 lg:sticky lg:top-36 lg:mx-0 lg:max-h-[calc(100vh-10rem)] lg:flex-col lg:overflow-y-auto lg:px-1 lg:pb-1"
      >
        {slides.map((s, i) => (
          <button
            key={i}
            type="button"
            onClick={() => select(i)}
            aria-current={i === index ? "true" : undefined}
            className={`w-36 shrink-0 rounded-xl p-1.5 text-left transition lg:w-full ${
              i === index ? "bg-accent/12 ring-2 ring-accent" : "hover:bg-fill"
            }`}
          >
            <SlideCanvas slide={s} template={template} />
            <span className="mt-1 flex items-baseline gap-1.5 px-0.5 text-caption">
              <b className="tabular-nums">{i + 1}</b>
              <span className="truncate text-label-2">{t.deck.kinds[s.kind]}</span>
            </span>
          </button>
        ))}
      </nav>

      <div ref={top} className="flex min-w-0 scroll-mt-36 flex-col gap-4">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <h2 className="text-title3 font-semibold">
            {index + 1}. {t.deck.kinds[slide.kind]}
          </h2>
          <span className="text-footnote text-label-2">{t.deck.of(index + 1, slides.length)}</span>
        </div>
        <SlideCanvas slide={slide} template={template} />
        <p className="text-subhead text-label-2">{t.deck.hint}</p>
        <Card className="p-4 sm:p-6">
          <SlideFields kind={slide.kind} pkg={pkg} onChange={onChange} />
        </Card>
        <div className="flex justify-between gap-2">
          <Button variant="tinted" disabled={index === 0} onClick={() => select(index - 1)}>
            <ArrowLeftIcon />
            {t.deck.prev}
          </Button>
          <Button variant="tinted" disabled={index === slides.length - 1} onClick={() => select(index + 1)}>
            {t.deck.next}
            <ChevronRightIcon />
          </Button>
        </div>
      </div>
    </div>
  );
}
