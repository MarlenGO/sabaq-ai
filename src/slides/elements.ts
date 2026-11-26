import type { IconName } from "./icons";
import type { SlideTemplate } from "./templates";

// Простые элементы слайда и их размеры — общие для раскладки (layout.ts)
// и оформления видов презентации (designs.ts).

/** Слайд 16:9 в PowerPoint — 10 × 5,625 дюйма, то есть 720 × 405 пунктов */
export const SLIDE_W_PT = 720;
export const SLIDE_H_PT = 405;

export type ColorRole = keyof SlideTemplate["colors"];

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export type SlideElement =
  /** rounded: true — скруглённые углы, "full" — круг/овал; color — свой цвет (hex) вместо цвета шаблона */
  /** line — тонкая рамка этого цвета (hex) */
  | (Box & { type: "rect"; fill: ColorRole; rounded?: boolean | "full"; color?: string; line?: string })
  | (Box & { type: "circle"; color: string; transparency: number })
  /** hex — свой цвет вместо цвета шаблона (как у rect) */
  | (Box & { type: "icon"; name: IconName; color: ColorRole; hex?: string })
  /**
   * Картинка. С src — настоящее фото (из Wikimedia, с подписью автора credit).
   * Без src — место под картинку: в PowerPoint учитель нажимает на значок и выбирает фото.
   */
  | (Box & { type: "image"; label: string; prompt: string; src?: string; credit?: string })
  | (Box & {
      type: "text";
      /** Один абзац или несколько (массив) */
      text: string | string[];
      /** Маркеры списка перед абзацами */
      bullet?: boolean;
      fontSize: number;
      color: ColorRole;
      font: "heading" | "body";
      bold?: boolean;
      align?: "left" | "center";
      /** Заголовок слайда: по нему вид презентации добавляет своё оформление (designs.ts) */
      role?: "heading";
      valign?: "top" | "middle" | "bottom";
      italic?: boolean;
      /** Свой цвет (hex) вместо цвета шаблона */
      hex?: string;
      /** Свой шрифт вместо шрифта шаблона (у оформления «Белес») */
      face?: string;
    });

/** Цвет текста или иконки: свой hex, если задан, иначе цвет шаблона */
export const colorOf = (el: { color: ColorRole; hex?: string }, template: SlideTemplate) => el.hex ?? template.colors[el.color];

/** Смешать два цвета hex (без «#»): t = 0 — первый, 1 — второй */
export function mix(a: string, b: string, t: number) {
  const ch = (c: string, i: number) => parseInt(c.slice(i, i + 2), 16);
  return [0, 2, 4]
    .map((i) => Math.round(ch(a, i) * (1 - t) + ch(b, i) * t).toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
}

// Подбор размера шрифта: грубо оцениваем, сколько строк займёт текст в рамке,
// и уменьшаем шрифт, пока не влезет. Средний символ ≈ 0,55 от размера шрифта.
export function fitFontSize(text: string | string[], box: { w: number; h: number }, max: number, min: number) {
  const paragraphs = Array.isArray(text) ? text : [text];
  const widthPt = (box.w / 100) * SLIDE_W_PT;
  const heightPt = (box.h / 100) * SLIDE_H_PT;
  for (let size = max; size > min; size--) {
    const charsPerLine = Math.max(1, Math.floor(widthPt / (size * 0.55)));
    const lines = paragraphs.reduce((sum, p) => sum + Math.max(1, Math.ceil(p.length / charsPerLine)), 0);
    const gaps = (paragraphs.length - 1) * size * 0.5;
    if (lines * size * 1.2 + gaps <= heightPt) return size;
  }
  return min;
}

/** Высота в % для квадрата шириной w % (слайд 16:9) */
export const sq = (w: number) => (w * SLIDE_W_PT) / SLIDE_H_PT;

