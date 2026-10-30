import type { TopicPackage } from "@/types/topic-package";
import { buildSlides } from "@/slides/layout";
import { getTemplate } from "@/slides/templates";
import { SlideCanvas } from "./SlideCanvas";

// Все слайды урока: первый крупно, остальные сеткой по два.
export function SlidePreview({ pkg }: { pkg: TopicPackage }) {
  const template = getTemplate(pkg.templateId, pkg.subject);
  const slides = buildSlides(pkg, template);

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {slides.map((slide, i) => (
        <figure key={i} className={i === 0 ? "sm:col-span-2" : ""}>
          <SlideCanvas slide={slide} template={template} />
          <figcaption className="mt-1.5 text-center text-caption text-label-2">{i + 1}-слайд</figcaption>
        </figure>
      ))}
    </div>
  );
}
