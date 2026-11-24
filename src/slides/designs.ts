import type { DeckType, Language } from "@/types/topic-package";
import type { IconName } from "./icons";
import type { SlideTemplate } from "./templates";
import { fitFontSize, sq, SLIDE_W_PT, type Box, type ColorRole, type SlideElement } from "./elements";

// Оформление видов презентации. У каждого вида свой «характер»:
//   урок — тетрадь с полями, открытый урок — праздничная лента с золотом,
//   отчёт — деловая полоса и подвал с номером страницы, доклад — строгие линейки,
//   классный час — мягкие круги, родительское собрание — спокойная шапка,
//   аттестация — двойная рамка и место для фото.
// Раскладка содержимого (layout.ts) общая; вид добавляет рамку на каждый слайд,
// украшение к заголовку и рисует титульный слайд по-своему.
// Цвета берутся из стиля (templates.ts), поэтому любой стиль ложится на любой вид.

type TextEl = Extract<SlideElement, { type: "text" }>;

export interface FrameInfo {
  /** Номер слайда с 1 */
  n: number;
  topic: string;
  /** false — слайд с большой картинкой: только лёгкая рамка, без украшений */
  full: boolean;
  /** На слайде есть обычный заголовок сверху */
  hasHeading: boolean;
}

export interface TitleInfo {
  topic: string;
  kicker: string;
  author: string;
  language: Language;
}

export interface Design {
  /** Элементы под содержимым слайда (кроме титульного) */
  frame(t: SlideTemplate, f: FrameInfo): SlideElement[];
  /** Украшение заголовка: before — под текстом, after — поверх */
  heading?(h: TextEl, t: SlideTemplate): { before?: SlideElement[]; after?: SlideElement[] };
  title(t: SlideTemplate, d: TitleInfo): SlideElement[];
}

// ——— Помощники ———

function text(box: Box, value: string, max: number, min: number, extra: Partial<TextEl> = {}): TextEl {
  return { type: "text", ...box, text: value, fontSize: fitFontSize(value, box, max, min), color: "text", font: "body", ...extra };
}

const rect = (x: number, y: number, w: number, h: number, fill: ColorRole, extra: { rounded?: boolean | "full"; color?: string } = {}): SlideElement => ({
  type: "rect", x, y, w, h, fill, ...extra,
});

const icon = (name: IconName, x: number, y: number, w: number, color: ColorRole): SlideElement => ({ type: "icon", name, x, y, w, h: sq(w), color });

const pageNumber = (n: number, box: Box, color: ColorRole = "muted"): SlideElement => ({
  type: "text", ...box, text: String(n), fontSize: 10, color, font: "body", align: "center", valign: "middle",
});

/** Золото/второй цвет стиля; если его нет — основной цвет */
const detail = (t: SlideTemplate) => t.detail ?? t.colors.accent;

/** Примерная ширина строки текста в % слайда (средний символ ≈ 0,55 размера шрифта) */
const textWidth = (value: string, size: number) => (value.length * size * 0.55 * 100) / SLIDE_W_PT;

const kickerText = (d: TitleInfo) => d.kicker.trim();

const photoLabel: Record<Language, { label: string; prompt: string }> = {
  kk: { label: "Фотосурет", prompt: "Фото қою үшін белгішені басыңыз" },
  ru: { label: "Фотография", prompt: "Нажмите на значок, чтобы вставить фото" },
};

// ——— Виды ———

/** Урок: тетрадь — красные поля слева, подчёркнутый заголовок, номер страницы */
const lesson: Design = {
  frame: (t, f) => [
    ...(f.full && t.decor
      ? [
          { type: "circle", x: 78, y: -30, w: 34, h: 60, color: t.decor.color, transparency: t.decor.transparency } as const,
          { type: "circle", x: 88, y: 18, w: 18, h: 32, color: t.decor.color, transparency: t.decor.transparency } as const,
        ]
      : []),
    rect(3.2, 0, 0.3, 100, "accent"),
    rect(3.8, 0, 0.12, 100, "accent"),
    pageNumber(f.n, { x: 90, y: 92, w: 6, h: 6 }),
  ],
  heading: (h) => ({ after: [rect(h.x, h.y + h.h + 0.4, 7, 1, "accent")] }),
  title: (t, d) => [
    ...(t.decor ? [{ type: "circle", x: 60, y: -20, w: 50, h: 89, color: t.decor.color, transparency: t.decor.transparency } as const] : []),
    rect(3.2, 0, 0.3, 100, "accent"),
    rect(3.8, 0, 0.12, 100, "accent"),
    text({ x: 8, y: 12, w: 54, h: 9 }, kickerText(d), 18, 12, { color: "muted", bold: true, valign: "bottom" }),
    rect(8, 23, 10, 1.4, "accent"),
    text({ x: 8, y: 28, w: 56, h: 44 }, d.topic, 50, 24, { font: "heading", bold: true, valign: "middle" }),
    ...(d.author.trim() ? [text({ x: 8, y: 78, w: 54, h: 10 }, d.author, 18, 12, { color: "muted", valign: "middle" })] : []),
    rect(68, 22, 26, sq(26), "surface", { rounded: "full" }),
    icon("book", 74.5, 22 + sq(6.5), 13, "accent"),
  ],
};

/** Открытый урок / конкурс: праздничная лента сверху, золотая линия, титул на цветном фоне */
const openLesson: Design = {
  frame: (t) => [
    rect(0, 0, 100, 2.4, "accent"),
    rect(0, 2.4, 100, 0.7, "accent", { color: detail(t) }),
    { type: "circle", x: 95.5, y: 91.5, w: 1.6, h: sq(1.6), color: detail(t), transparency: 0 },
    { type: "circle", x: 92.6, y: 91.5, w: 1.6, h: sq(1.6), color: detail(t), transparency: 40 },
  ],
  title: (t, d) => [
    rect(0, 0, 100, 100, "accent"),
    { type: "circle", x: 68, y: -28, w: 46, h: 82, color: detail(t), transparency: 78 },
    { type: "circle", x: -12, y: 66, w: 28, h: 50, color: detail(t), transparency: 84 },
    icon("award", 46, 9, 8, "onAccent"),
    text({ x: 12, y: 26, w: 76, h: 8 }, kickerText(d), 18, 12, { color: "onAccent", bold: true, align: "center", valign: "middle" }),
    text({ x: 10, y: 35, w: 80, h: 32 }, d.topic, 48, 24, { font: "heading", bold: true, color: "onAccent", align: "center", valign: "middle" }),
    rect(43, 71, 14, 0.9, "accent", { color: detail(t) }),
    ...(d.author.trim() ? [text({ x: 15, y: 76, w: 70, h: 10 }, d.author, 18, 12, { color: "onAccent", align: "center", valign: "middle" })] : []),
  ],
};

/** Отчёт: деловая полоса слева и подвал с темой и номером страницы */
const report: Design = {
  frame: (_t, f) => [
    rect(0, 0, 1.4, 100, "accent"),
    rect(0, 94, 100, 6, "surface"),
    text({ x: 6, y: 94, w: 70, h: 6 }, f.topic, 9, 7, { color: "muted", valign: "middle" }),
    pageNumber(f.n, { x: 90, y: 94, w: 6, h: 6 }, "accent"),
  ],
  heading: (h) => ({ before: [rect(h.x - 4.6, h.y + 3, 1.4, h.h - 6, "accent")] }),
  title: (_t, d) => [
    rect(0, 0, 38, 100, "accent"),
    icon("clipboard", 8, 14, 9, "onAccent"),
    text({ x: 8, y: 62, w: 26, h: 22 }, kickerText(d), 20, 12, { color: "onAccent", bold: true, font: "heading", valign: "top" }),
    rect(38, 94, 62, 6, "surface"),
    text({ x: 44, y: 20, w: 50, h: 46 }, d.topic, 40, 20, { font: "heading", bold: true, valign: "middle" }),
    rect(44, 70, 10, 1.2, "accent"),
    ...(d.author.trim() ? [text({ x: 44, y: 74, w: 50, h: 12 }, d.author, 18, 11, { color: "muted", valign: "top" })] : []),
  ],
};

/** Доклад: строгие тонкие линейки сверху и снизу, номер страницы — как в научной статье */
const talk: Design = {
  frame: (_t, f) => [
    rect(6, 4, 88, 0.3, "muted"),
    rect(6, 93, 88, 0.3, "muted"),
    text({ x: 6, y: 94, w: 70, h: 5 }, f.topic, 9, 7, { color: "muted", valign: "middle" }),
    pageNumber(f.n, { x: 88, y: 94, w: 6, h: 5 }),
  ],
  title: (_t, d) => [
    rect(6, 8, 88, 0.3, "muted"),
    text({ x: 10, y: 16, w: 80, h: 8 }, kickerText(d), 16, 11, { color: "accent", bold: true, align: "center", valign: "middle" }),
    text({ x: 10, y: 28, w: 80, h: 38 }, d.topic, 46, 22, { font: "heading", bold: true, align: "center", valign: "middle" }),
    rect(45, 70, 10, 0.8, "accent"),
    ...(d.author.trim() ? [text({ x: 15, y: 75, w: 70, h: 10 }, d.author, 17, 11, { color: "muted", align: "center", valign: "middle" })] : []),
    rect(6, 92, 88, 0.3, "muted"),
  ],
};

/** Классный час: мягкие круги по углам и заголовок на «облачке» */
const classHour: Design = {
  frame: (t, f) => {
    if (!f.full) return [];
    const color = t.decor?.color ?? t.colors.accent;
    return [
      { type: "circle", x: -9, y: 76, w: 22, h: sq(22), color, transparency: 82 },
      { type: "circle", x: 91, y: -12, w: 16, h: sq(16), color, transparency: 78 },
      { type: "circle", x: 93, y: 86, w: 2.4, h: sq(2.4), color: t.colors.accent, transparency: 30 },
      { type: "circle", x: 89.5, y: 89, w: 1.4, h: sq(1.4), color: t.colors.accent, transparency: 50 },
    ];
  },
  heading: (h) => {
    const w = Math.min(h.w + 3, textWidth(Array.isArray(h.text) ? h.text.join(" ") : h.text, h.fontSize) + 5);
    return { before: [rect(h.x - 2, h.y + 1.5, w, h.h - 3, "surface", { rounded: true })] };
  },
  title: (t, d) => {
    const color = t.decor?.color ?? t.colors.accent;
    return [
      { type: "circle", x: -10, y: 50, w: 34, h: sq(34), color, transparency: 80 },
      { type: "circle", x: 78, y: -22, w: 30, h: sq(30), color, transparency: 76 },
      { type: "circle", x: 84, y: 74, w: 6, h: sq(6), color: t.colors.accent, transparency: 40 },
      rect(44, 8, 12, sq(12), "surface", { rounded: "full" }),
      icon("smile", 46.5, 8 + sq(2.5), 7, "accent"),
      text({ x: 12, y: 33, w: 76, h: 8 }, kickerText(d), 18, 12, { color: "accent", bold: true, align: "center", valign: "middle" }),
      text({ x: 12, y: 42, w: 76, h: 32 }, d.topic, 48, 24, { font: "heading", bold: true, align: "center", valign: "middle" }),
      ...(d.author.trim() ? [text({ x: 15, y: 78, w: 70, h: 10 }, d.author, 18, 12, { color: "muted", align: "center", valign: "middle" })] : []),
    ];
  },
};

/** Родительское собрание: спокойная шапка под заголовком и тонкая полоса внизу */
const parents: Design = {
  frame: (_t, f) => [
    ...(f.full && f.hasHeading ? [rect(0, 0, 100, 21.5, "surface"), icon("users", 89, 6.5, 5, "accent")] : []),
    rect(0, 98.6, 100, 1.4, "accent"),
  ],
  title: (_t, d) => [
    rect(0, 0, 100, 64, "accent"),
    text({ x: 8, y: 8, w: 66, h: 8 }, kickerText(d), 18, 12, { color: "onAccent", bold: true, valign: "middle" }),
    text({ x: 8, y: 18, w: 68, h: 40 }, d.topic, 46, 22, { font: "heading", bold: true, color: "onAccent", valign: "middle" }),
    icon("users", 80, 22, 12, "onAccent"),
    ...(d.author.trim() ? [text({ x: 8, y: 72, w: 70, h: 12 }, d.author, 20, 12, { valign: "middle" })] : []),
    rect(0, 98.6, 100, 1.4, "accent"),
  ],
};

/** Двойная рамка: золотая снаружи, тонкая цветная внутри */
function doubleFrame(t: SlideTemplate): SlideElement[] {
  const gold = detail(t);
  const o = 2.2;
  const i = 3.2;
  return [
    rect(o, o, 100 - o * 2, 0.35, "accent", { color: gold }),
    rect(o, 100 - o - 0.35, 100 - o * 2, 0.35, "accent", { color: gold }),
    rect(o, o, 0.2, 100 - o * 2, "accent", { color: gold }),
    rect(100 - o - 0.2, o, 0.2, 100 - o * 2, "accent", { color: gold }),
    rect(i, i + 0.8, 100 - i * 2, 0.15, "accent"),
    rect(i, 100 - i - 0.95, 100 - i * 2, 0.15, "accent"),
    rect(i, i + 0.8, 0.1, 100 - i * 2 - 1.6, "accent"),
    rect(100 - i - 0.1, i + 0.8, 0.1, 100 - i * 2 - 1.6, "accent"),
  ];
}

/** Аттестация / портфолио: двойная рамка, на титуле — место для фото учителя */
const attestation: Design = {
  frame: (t) => doubleFrame(t),
  heading: (h, t) => ({ after: [rect(h.x, h.y + h.h + 0.6, 12, 0.5, "accent", { color: detail(t) })] }),
  title: (t, d) => [
    ...doubleFrame(t),
    text({ x: 9, y: 16, w: 52, h: 8 }, kickerText(d), 18, 12, { color: "accent", bold: true, valign: "middle" }),
    text({ x: 9, y: 27, w: 54, h: 38 }, d.topic, 42, 22, { font: "heading", bold: true, valign: "middle" }),
    rect(9, 69, 12, 0.6, "accent", { color: detail(t) }),
    ...(d.author.trim() ? [text({ x: 9, y: 73, w: 54, h: 12 }, d.author, 20, 12, { color: "muted", valign: "top" })] : []),
    { type: "image", x: 68, y: 14, w: 23, h: 72, ...photoLabel[d.language] },
  ],
};

const designs: Record<DeckType, Design> = {
  lesson,
  "open-lesson": openLesson,
  report,
  talk,
  "class-hour": classHour,
  parents,
  attestation,
};

export const designOf = (type: DeckType | undefined) => designs[type ?? "lesson"];
