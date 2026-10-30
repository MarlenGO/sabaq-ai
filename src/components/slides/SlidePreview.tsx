import type { ReactNode } from "react";
import type { TopicPackage } from "@/types/topic-package";
import { subjectNames } from "@/lib/labels";

// Временный набросок шаблона «Ғылым». На этапе 3 его цвета переедут
// в конфиг шаблонов, а слайды начнут строиться по раскладкам.
// Цвета здесь — часть шаблона презентации, а не интерфейса сайта,
// поэтому они не зависят от светлой/тёмной темы.
const scienceTemplate = {
  background: "linear-gradient(135deg, #0b3d91 0%, #1e6fd9 100%)",
  text: "#ffffff",
  muted: "rgb(255 255 255 / 0.72)",
  accent: "#7dd3fc",
  panel: "rgb(255 255 255 / 0.12)",
};

// Шрифты в слайде заданы в cqw (процент ширины слайда),
// поэтому слайд выглядит одинаково и на телефоне, и на большом экране.
function Slide({ children, n }: { children: ReactNode; n: number }) {
  const t = scienceTemplate;
  return (
    <figure className="@container">
      <div
        className="relative aspect-video overflow-hidden rounded-xl shadow-card"
        style={{ background: t.background, color: t.text }}
      >
        <div
          className="absolute -right-[10cqw] -top-[18cqw] h-[45cqw] w-[45cqw] rounded-full"
          style={{ background: t.panel }}
        />
        <div className="relative flex h-full flex-col p-[6cqw]">{children}</div>
      </div>
      <figcaption className="mt-1.5 text-center text-caption text-label-2">{n}-слайд</figcaption>
    </figure>
  );
}

export function SlidePreview({ pkg }: { pkg: TopicPackage }) {
  const t = scienceTemplate;
  const terms = pkg.terms.slice(0, 4);

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <Slide n={1}>
          <p className="text-[2.4cqw] font-semibold uppercase tracking-widest" style={{ color: t.accent }}>
            {subjectNames[pkg.subject]} · {pkg.grade}-сынып
          </p>
          <h3 className="mt-auto text-[6.5cqw] font-bold leading-[1.1]">{pkg.topic || "Тақырып"}</h3>
          <p className="mt-[2cqw] text-[2.4cqw]" style={{ color: t.muted }}>
            Sabaq AI
          </p>
        </Slide>
      </div>

      <Slide n={2}>
        <h3 className="text-[4.5cqw] font-bold" style={{ color: t.accent }}>
          Анықтама
        </h3>
        <p className="mt-[3cqw] line-clamp-5 text-[3.6cqw] leading-snug">{pkg.definition}</p>
        {pkg.formula && (
          <p
            className="mt-auto rounded-[1.5cqw] px-[3cqw] py-[1.5cqw] text-center font-mono text-[4cqw]"
            style={{ background: t.panel }}
          >
            {pkg.formula.expression}
          </p>
        )}
      </Slide>

      <Slide n={3}>
        <h3 className="text-[4.5cqw] font-bold" style={{ color: t.accent }}>
          Терминдер
        </h3>
        <div className="mt-[3cqw] grid flex-1 grid-cols-2 gap-[2cqw]">
          {terms.map((term, i) => (
            <div key={i} className="rounded-[1.5cqw] p-[2cqw]" style={{ background: t.panel }}>
              <p className="text-[3.2cqw] font-semibold">{term.term}</p>
              <p className="mt-[0.5cqw] line-clamp-2 text-[2.4cqw]" style={{ color: t.muted }}>
                {term.explanation}
              </p>
            </div>
          ))}
        </div>
      </Slide>
    </div>
  );
}
