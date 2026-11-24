import type { CSSProperties } from "react";
import type { Subject } from "@/types/topic-package";
import { subjectLook } from "@/data/catalog";
import { LucideIcon } from "@/components/ui/LucideIcon";

/**
 * Цвета предмета для стилей: --tile — мягкий фон, --ink — цвет иконки.
 * Смешиваем цвет предмета с фоном/текстом темы, поэтому в тёмной теме
 * плитка сама становится тёмной, а иконка — светлее.
 */
export function subjectColors(subject: Subject): CSSProperties {
  const hue = subjectLook[subject].hue;
  return {
    "--tile": `color-mix(in srgb, ${hue} 14%, var(--surface))`,
    "--ink": `color-mix(in srgb, ${hue} 78%, var(--label))`,
  } as CSSProperties;
}

/** Иконка предмета на его мягком цветном фоне (маленькая — в заголовке страницы предмета) */
export function SubjectBadge({ subject, className = "size-14" }: { subject: Subject; className?: string }) {
  return (
    <span
      style={subjectColors(subject)}
      className={`flex shrink-0 items-center justify-center rounded-2xl bg-(--tile) text-(--ink) ${className}`}
    >
      <LucideIcon svg={subjectLook[subject].icon} className="size-[55%] [&>svg]:stroke-[1.6]" />
    </span>
  );
}
