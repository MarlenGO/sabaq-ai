import type { Language, LayoutKind, LookId, TopicPackage } from "@/types/topic-package";
import type { IconName } from "./icons";
import { slideData, type ContentKind, type DataSlide, type StructureSlide } from "./structures";
import type { SlideTemplate } from "./templates";
import { fitFontSize, mix, sq, type Box, type SlideElement } from "./elements";

// Оформления слайдов (как варианты A–G на макете): у каждого свои шрифты,
// рамка, заголовок, карточки, метки (номера, иконки) и титульный слайд.
// Раскладки по видам слайдов (цели, план, таблица…) общие и собираются
// из этих «деталей», поэтому любое оформление подходит к любому виду презентации.
// Цвета — из стиля (templates.ts): accent — основной тёмный, detail — второй цвет.
// Всё — простые фигуры, текст, иконки и картинки, поэтому превью и PPTX совпадают.

type Text = Extract<SlideElement, { type: "text" }>;
export type LookPages = { title: string; elements: SlideElement[] }[];
export interface LookCopy {
  definition: string;
  facts: string;
  examples: string;
  terms: string;
  image: { label: string; prompt: string };
}

/** Цвета оформления, посчитанные из стиля */
export interface Palette {
  bg: string;
  text: string;
  muted: string;
  light: string;
  dark: string;
  onDark: string;
  dark2: string;
  soft: string;
  acc: string;
  onAcc: string;
  chip: string;
  chipText: string;
  line: string;
}

/** Светлый ли цвет (для выбора цвета текста поверх) */
const isLight = (hex: string) => {
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return r * 0.299 + g * 0.587 + b * 0.114 > 160;
};

function palette(t: SlideTemplate, fallbackAcc: string): Palette {
  const c = t.colors;
  const acc = t.detail ?? fallbackAcc;
  return {
    bg: c.background,
    text: c.text,
    muted: c.muted,
    light: c.surface,
    dark: c.accent,
    onDark: c.onAccent,
    dark2: mix(c.accent, c.onAccent, 0.12),
    soft: mix(c.onAccent, c.accent, 0.3),
    acc,
    onAcc: isLight(acc) ? mix(acc, "000000", 0.8) : "FFFFFF",
    chip: mix(acc, c.background, 0.78),
    chipText: mix(acc, "000000", 0.45),
    line: mix(c.muted, c.background, 0.72),
  };
}

/** Всё, что нужно раскладке: цвета, шрифты и «детали» оформления */
export interface Kit {
  p: Palette;
  look: Look;
  language: Language;
  topic: string;
  /** Номер слайда с 1 */
  n: number;
}

type Shape = boolean | "full";

interface Look {
  fonts: { heading: string; body: string };
  /** Второй цвет, если у стиля его нет */
  fallbackAcc: string;
  /** Скругление карточек и плашек */
  radius: boolean;
  /** Где содержимое под заголовком */
  area: Box;
  /** Форма меток (номер, иконка): круг, скруглённый или прямой квадрат */
  badge: Shape;
  /** true — метка светлая с тёмной иконкой; false — тёмная со светлой */
  tintBadge: boolean;
  /** Карточка: заливка светлым или рамка + цветная полоса сверху/слева */
  card: { fill: boolean; line: boolean; bar?: "top" | "left" };
  /** Цветные плитки по кругу (мозаика); иначе обычные карточки */
  tiles?: string[];
  /** Номера крупными цифрами без кружка (журнал) */
  bigNumerals?: boolean;
  frame(k: Kit): SlideElement[];
  heading(title: string, k: Kit): SlideElement[];
  title(d: TitleData, k: Kit): SlideElement[];
}

export interface TitleData {
  topic: string;
  kicker: string;
  author: string;
}

// ——— Простые детали ———

const rect = (x: number, y: number, w: number, h: number, color: string, rounded: Shape = false, line?: string): SlideElement => ({
  type: "rect", x, y, w, h, fill: "surface", color, rounded, line,
});

function text(k: Kit, b: Box, value: string | string[], max: number, min: number, extra: Partial<Text> = {}): Text {
  return {
    type: "text",
    ...b,
    text: value,
    fontSize: fitFontSize(value, b, max, min),
    color: "text",
    hex: k.p.text,
    font: "body",
    face: k.look.fonts.body,
    ...extra,
  };
}
const serif = (k: Kit): Partial<Text> => ({ face: k.look.fonts.heading, font: "heading", bold: true });
const upper = (value: string, k: Kit) => value.trim().toLocaleUpperCase(k.language === "kk" ? "kk-KZ" : "ru-RU");

const icon = (name: IconName, x: number, y: number, w: number, hex: string): SlideElement => ({ type: "icon", name, color: "text", hex, x, y, w, h: sq(w) });

/** Метка с иконкой: d — ширина в % слайда; strong — тёмная/цветная вместо светлой */
/** onCard — метка лежит на карточке (иначе на фоне страницы) */
function badge(k: Kit, x: number, y: number, d: number, name: IconName, i = 0, strong = false, onCard = true): SlideElement[] {
  const { p, look } = k;
  const tile = look.tiles?.[i % look.tiles.length];
  const tint = look.tintBadge && !strong;
  // Светлая метка на светлой карточке не видна — тогда она цвета фона страницы
  const fill = tile ? "FFFFFF" : tint ? (onCard && look.card.fill ? p.bg : p.light) : strong ? p.acc : p.dark;
  const ink = tile ? p.dark : tint ? p.dark : strong ? p.onAcc : p.onDark;
  const pad = d * 0.24;
  return [rect(x, y, d, sq(d), fill, look.badge), icon(name, x + pad, y + sq(pad), d - pad * 2, ink)];
}

/** Метка с номером (или крупная цифра у «журнала») */
function numberMark(k: Kit, x: number, y: number, d: number, n: number, strong = false): SlideElement[] {
  const { p, look } = k;
  if (look.bigNumerals) {
    return [text(k, { x: x - 0.5, y, w: d + 3, h: sq(d) }, String(n).padStart(2, "0"), Math.round(d * 3.4), 12, { ...serif(k), hex: p.acc, valign: "middle" })];
  }
  const fill = look.tintBadge && !strong ? (look.card.fill ? p.bg : p.light) : strong ? p.acc : p.dark;
  const ink = look.tintBadge && !strong ? p.dark : strong ? p.onAcc : p.onDark;
  return [
    rect(x, y, d, sq(d), fill, look.badge),
    text(k, { x, y, w: d, h: sq(d) }, String(n), Math.round(d * 2.6), 9, { hex: ink, bold: true, align: "center", valign: "middle" }),
  ];
}

/** Карточка-подложка по стилю оформления; i — для цветных плиток */
function card(k: Kit, b: Box, i = 0): SlideElement[] {
  const { p, look } = k;
  const tile = look.tiles?.[i % look.tiles.length];
  if (tile) return [rect(b.x, b.y, b.w, b.h, tile, true)];
  const els: SlideElement[] = [rect(b.x, b.y, b.w, b.h, look.card.fill ? p.light : p.bg, look.radius, look.card.line ? p.line : undefined)];
  if (look.card.bar === "top") els.push(rect(b.x, b.y, b.w, 1.1, i % 2 ? p.acc : p.dark));
  if (look.card.bar === "left") els.push(rect(b.x, b.y, 0.5, b.h, p.dark));
  return els;
}
/** Отступ текста внутри карточки слева (у полосы слева — больше) */
const inset = (k: Kit) => (k.look.card.bar === "left" ? 2.4 : 1.8);

/** Тёмная плашка (вывод, критерии, тема) */
const panel = (k: Kit, b: Box, fill = k.p.dark): SlideElement => rect(b.x, b.y, b.w, b.h, fill, k.look.radius);

function chip(k: Kit, x: number, y: number, w: number, h: number, value: string): SlideElement[] {
  return [rect(x, y, w, h, k.p.chip, true), text(k, { x: x + 1, y, w: w - 2, h }, value, 13, 8, { hex: k.p.chipText, bold: true, align: "center", valign: "middle" })];
}

function picture(b: Box, l: LookCopy, src?: { url: string; credit?: string }): SlideElement {
  return { type: "image", ...b, label: l.image.label, prompt: l.image.prompt, src: src?.url, credit: src?.credit };
}

const chunk = <T>(items: T[], size: number) =>
  Array.from({ length: Math.ceil(items.length / size) }, (_, i) => items.slice(i * size, i * size + size));
const numbered = (base: string, i: number, total: number) => (total > 1 ? `${base} (${i + 1})` : base);

// ——— Общие блоки раскладок ———

/** Список строк карточками: номер или галочка + текст. До 3 строк — колонка, больше — две */
function rows(k: Kit, lines: string[], A: Box, mark: "number" | "check"): SlideElement[] {
  const cols = lines.length > 3 ? 2 : 1;
  const perCol = Math.ceil(lines.length / cols);
  const gap = 2.2;
  const w = (A.w - gap * (cols - 1)) / cols;
  const h = Math.min(19, (A.h - gap * (perCol - 1)) / perCol);
  return lines.flatMap((line, i): SlideElement[] => {
    const x = A.x + (i % cols) * (w + gap);
    const y = A.y + Math.floor(i / cols) * (h + gap);
    const d = Math.min(4.8, (h * 0.62) / 1.78);
    const cy = y + (h - sq(d)) / 2;
    const last = i === lines.length - 1;
    const tile = Boolean(k.look.tiles);
    return [
      ...card(k, { x, y, w, h }, i),
      ...(mark === "number" ? numberMark(k, x + inset(k), cy, d, i + 1, last && !tile) : badge(k, x + inset(k), cy, d, "check", i, !tile)),
      text(k, { x: x + inset(k) + d + 1.8, y: y + 1, w: w - d - inset(k) - 3.2, h: h - 2 }, line, 18, 10, { valign: "middle" }),
    ];
  });
}

/** Плашка-вывод внизу: иконка + текст */
function callout(k: Kit, b: Box, value: string, name: IconName, big = false): SlideElement[] {
  const d = Math.min(5.6, (b.h * 0.66) / 1.78);
  return [
    panel(k, b),
    rect(b.x + 2, b.y + (b.h - sq(d)) / 2, d, sq(d), k.p.acc, k.look.badge),
    icon(name, b.x + 2 + d * 0.24, b.y + (b.h - sq(d)) / 2 + sq(d * 0.24), d * 0.52, k.p.onAcc),
    text(k, { x: b.x + d + 4, y: b.y + 1, w: b.w - d - 6, h: b.h - 2 }, value, big ? 24 : 18, 11, {
      hex: k.p.onDark,
      valign: "middle",
      ...(big ? serif(k) : {}),
    }),
  ];
}

// ——— Слайды с содержанием темы ———

function contentPages(kind: ContentKind, pkg: TopicPackage, l: LookCopy, k: Kit): LookPages {
  const A = k.look.area;
  const head = (t: string) => k.look.heading(t, k);

  if (kind === "definition") {
    const formula = pkg.formula;
    const top: Box = { x: A.x, y: A.y, w: A.w, h: formula ? A.h * 0.56 : A.h };
    const els: SlideElement[] = [
      ...head(l.definition),
      ...card(k, top),
      ...badge(k, top.x + inset(k), top.y + 3, 5.6, "book", 0, false),
      text(k, { x: top.x + inset(k) + 8, y: top.y + 2, w: top.w - inset(k) - 10, h: top.h - 4 }, pkg.definition, 26, 13, { valign: "middle" }),
    ];
    if (formula) {
      const y = A.y + A.h * 0.6;
      const h = A.h * 0.4;
      const variables = formula.variables.map((v) => `${v.symbol} — ${v.meaning}${v.unit ? `, ${v.unit}` : ""}`);
      els.push(
        panel(k, { x: A.x, y, w: A.w * 0.38, h }),
        text(k, { x: A.x + 2.2, y: y + 1.6, w: A.w * 0.38 - 4.4, h: 6 }, k.language === "kk" ? "Формула" : "Формула", 13, 9, { hex: k.p.acc, bold: true }),
        text(k, { x: A.x + 2.2, y: y + 8, w: A.w * 0.38 - 4.4, h: h - 10 }, formula.expression, 30, 14, { ...serif(k), hex: k.p.onDark, valign: "middle" }),
        rect(A.x + A.w * 0.41, y, A.w * 0.59, h, k.p.chip, k.look.radius),
        text(k, { x: A.x + A.w * 0.41 + 2.4, y: y + 1.5, w: A.w * 0.59 - 4.8, h: h - 3 }, variables, 16, 9, { hex: k.p.chipText, valign: "middle" }),
      );
    }
    return [{ title: l.definition, elements: els }];
  }

  if (kind === "facts") {
    const pages = chunk(pkg.keyFacts, 6);
    return pages.map((facts, i) => {
      const t = numbered(l.facts, i, pages.length);
      return { title: t, elements: [...head(t), ...rows(k, facts, A, "check")] };
    });
  }

  if (kind === "examples") {
    const pages = chunk(pkg.examples, 4);
    return pages.map((examples, i) => {
      const t = numbered(l.examples, i, pages.length);
      return { title: t, elements: [...head(t), ...rows(k, examples.map((e) => e.text), A, "number")] };
    });
  }

  // Термины: плитки — термин, короткая черта, объяснение
  const pages = chunk(pkg.terms, 6);
  return pages.map((terms, i) => {
    const t = numbered(l.terms, i, pages.length);
    const cols = terms.length > 4 ? 3 : 2;
    const perCol = Math.ceil(terms.length / cols);
    const w = (A.w - 2.2 * (cols - 1)) / cols;
    const h = (A.h - 2.2 * (perCol - 1)) / perCol;
    return {
      title: t,
      elements: [
        ...head(t),
        ...terms.flatMap((term, j): SlideElement[] => {
          const x = A.x + (j % cols) * (w + 2.2);
          const y = A.y + Math.floor(j / cols) * (h + 2.2);
          const pad = inset(k);
          return [
            ...card(k, { x, y, w, h }, j),
            text(k, { x: x + pad, y: y + 2, w: w - pad - 1.8, h: h * 0.3 }, term.term, 20, 11, { ...serif(k), hex: k.look.tiles ? k.p.text : k.p.dark, valign: "middle" }),
            rect(x + pad, y + 2 + h * 0.3 + 1, 5, 0.9, k.look.tiles ? k.p.dark : k.p.acc),
            text(k, { x: x + pad, y: y + h * 0.3 + 5.5, w: w - pad - 1.8, h: h * 0.7 - 7 }, term.explanation, 15, 9, { hex: k.look.tiles ? k.p.text : k.p.muted }),
          ];
        }),
      ],
    };
  });
}

// ——— Слайды-заготовки ———

function dataPages(spec: DataSlide, pkg: TopicPackage, l: LookCopy, k: Kit): LookPages {
  const data = <K extends LayoutKind>(s: Extract<DataSlide, { kind: K }>) => slideData<K>(pkg, s);
  const iconAt = (i: number, fallback: IconName): IconName => spec.icons?.[i] ?? fallback;
  const one = (t: string, elements: SlideElement[]): LookPages => [{ title: t, elements }];
  const A = k.look.area;
  const head = (t: string) => k.look.heading(t, k);
  const { p } = k;

  switch (spec.kind) {
    case "title": {
      const d = data(spec);
      return one(pkg.topic, k.look.title({ topic: pkg.topic, kicker: d.kicker, author: d.author }, k));
    }

    // Слева три пункта (метка + название + пояснение), справа плашка с темой
    case "goals": {
      const d = data(spec);
      const fallback: IconName[] = ["target", "lightbulb", "users"];
      const listW = A.w * 0.58;
      const step = A.h / 3;
      return one(d.title, [
        ...head(d.title),
        ...d.items.flatMap(({ title, body }, i): SlideElement[] => {
          const y = A.y + i * step;
          return [
            ...badge(k, A.x, y + 1, 6.6, iconAt(i, fallback[i]), i, i === 2, false),
            text(k, { x: A.x + 9, y, w: listW - 9, h: 7 }, title, 20, 12, { bold: true, valign: "middle" }),
            text(k, { x: A.x + 9, y: y + 7, w: listW - 9, h: step - 8 }, body, 15, 9, { hex: p.muted }),
          ];
        }),
        panel(k, { x: A.x + A.w * 0.62, y: A.y, w: A.w * 0.38, h: A.h }),
        text(k, { x: A.x + A.w * 0.62 + 2.6, y: A.y + 3, w: A.w * 0.38 - 5.2, h: 6 }, k.language === "kk" ? "Тақырып" : "Тема", 14, 10, { hex: p.acc, bold: true }),
        text(k, { x: A.x + A.w * 0.62 + 2.6, y: A.y + 10, w: A.w * 0.38 - 5.2, h: A.h - 20 }, pkg.topic, 26, 13, { ...serif(k), hex: p.onDark }),
        rect(A.x + A.w * 0.62 + 2.6, A.y + A.h - 7, 7, 1.1, p.acc),
      ]);
    }

    // Четыре шага-карточки со стрелками; время — меткой внизу
    case "plan": {
      const d = data(spec);
      const gap = 2.6;
      const w = (A.w - gap * 3) / 4;
      return one(d.title, [
        ...head(d.title),
        ...d.steps.flatMap(({ name, time }, i): SlideElement[] => {
          const x = A.x + i * (w + gap);
          const last = i === 3;
          return [
            ...card(k, { x, y: A.y, w, h: A.h }, i),
            ...numberMark(k, x + inset(k), A.y + 4, 5.6, i + 1, last && !k.look.tiles),
            text(k, { x: x + inset(k), y: A.y + 19, w: w - inset(k) - 1.6, h: A.h - 33 }, name, 16, 10, { bold: true }),
            ...(time.trim() ? chip(k, x + inset(k), A.y + A.h - 12, w - inset(k) - 1.6, 8, time) : []),
            ...(last ? [] : [text(k, { x: x + w, y: A.y + A.h / 2 - 5, w: gap, h: 10 }, "›", 24, 24, { hex: p.acc, bold: true, align: "center", valign: "middle" })]),
          ];
        }),
      ]);
    }

    case "bullets": {
      const d = data(spec);
      return one(d.title, [...head(d.title), ...rows(k, d.lines, A, "number")]);
    }

    // Текст слева карточками с галочками, картинка справа во всю высоту
    case "text-image": {
      const d = data(spec);
      const left: Box = { x: A.x, y: A.y, w: A.w * 0.52, h: A.h };
      return one(d.title, [
        ...head(d.title),
        ...rows(k, d.bullets, left, "check"),
        picture({ x: A.x + A.w * 0.56, y: A.y, w: A.w * 0.44, h: A.h }, l, d.image),
      ]);
    }

    case "big-image": {
      const d = data(spec);
      const imgH = A.h - 17;
      return one(d.caption, [
        ...k.look.heading("", k),
        picture({ x: A.x, y: A.y - 12, w: A.w, h: imgH + 12 }, l, d.image),
        ...callout(k, { x: A.x, y: A.y + imgH + 3, w: A.w, h: 14 }, d.caption, "image"),
      ]);
    }

    // Две карточки: шапки тёмная и цветная, между ними весы
    case "compare": {
      const d = data(spec);
      const w = (A.w - 4) / 2;
      return one(d.title, [
        ...head(d.title),
        ...[0, 1].flatMap((i): SlideElement[] => {
          const x = A.x + i * (w + 4);
          return [
            ...card(k, { x, y: A.y, w, h: A.h }, i),
            panel(k, { x, y: A.y, w, h: 12 }, i === 0 ? p.dark : p.acc),
            text(k, { x: x + 2, y: A.y, w: w - 4, h: 12 }, i === 0 ? d.left : d.right, 20, 12, { hex: i === 0 ? p.onDark : p.onAcc, bold: true, align: "center", valign: "middle" }),
            text(k, { x: x + 3, y: A.y + 16, w: w - 6, h: A.h - 19 }, i === 0 ? d.leftLines : d.rightLines, 17, 10, { bullet: true }),
          ];
        }),
        rect(A.x + A.w / 2 - 3.6, A.y + 1.5 - 0.6, 7.2, sq(7.2), "FFFFFF", k.look.badge, p.line),
        icon("scale", A.x + A.w / 2 - 2.2, A.y + 1.5 + sq(1.4) - 0.6, 4.4, p.dark),
      ]);
    }

    // Три плитки с большими числами
    case "numbers": {
      const d = data(spec);
      const w = (A.w - 4.4) / 3;
      const darkTiles = !k.look.card.line && !k.look.tiles;
      return one(d.title, [
        ...head(d.title),
        ...d.items.flatMap((item, i): SlideElement[] => {
          const x = A.x + i * (w + 2.2);
          const h = Math.min(A.h, 56);
          const y = A.y + (A.h - h) / 2;
          return [
            ...(darkTiles ? [panel(k, { x, y, w, h })] : card(k, { x, y, w, h }, i)),
            text(k, { x: x + 2.4, y: y + 4, w: w - 4.8, h: 22 }, item.value, 44, 18, { ...serif(k), hex: darkTiles ? p.acc : k.look.tiles ? p.text : p.dark, valign: "middle" }),
            rect(x + 2.4, y + 28, 6, 1, darkTiles ? p.acc : k.look.tiles ? p.dark : p.acc),
            text(k, { x: x + 2.4, y: y + 32, w: w - 4.8, h: h - 35 }, item.caption, 16, 9, { hex: darkTiles ? p.soft : k.look.tiles ? p.text : p.muted }),
          ];
        }),
      ]);
    }

    // Таблица: тёмная шапка, строки через одну с подложкой
    case "table": {
      const d = data(spec);
      const rowH = Math.min(11, A.h / (d.rows.length + 1));
      const colW = A.w / d.columns.length;
      const cells = (values: string[], y: number, header: boolean): SlideElement[] =>
        d.columns.map((_, c) =>
          text(k, { x: A.x + c * colW + 1.4, y, w: colW - 2.8, h: rowH }, values[c] ?? "", header ? 17 : 15, 9, {
            valign: "middle",
            bold: header || c === 0,
            ...(header ? { hex: p.onDark } : {}),
          }),
        );
      return one(d.title, [
        ...head(d.title),
        rect(A.x, A.y, A.w, rowH, p.dark),
        ...cells(d.columns, A.y, true),
        ...d.rows.flatMap((row, r): SlideElement[] => {
          const y = A.y + (r + 1) * rowH;
          return [...(r % 2 === 1 ? [rect(A.x, y, A.w, rowH, p.light)] : []), ...cells(row, y, false)];
        }),
        rect(A.x, A.y + (d.rows.length + 1) * rowH, A.w, 0.4, p.acc),
      ]);
    }

    // Диаграмма: столбики, самый высокий — вторым цветом
    case "chart": {
      const d = data(spec);
      const max = Math.max(1, ...d.items.map((item) => item.value));
      const slot = (A.w - 4) / d.items.length;
      const barW = Math.min(12, slot * 0.55);
      const base = A.y + A.h - 14;
      const number = (value: number) => String(Math.round(value * 100) / 100).replace(".", ",");
      return one(d.title, [
        ...head(d.title),
        ...d.items.flatMap((item, i): SlideElement[] => {
          const h = Math.max(0.8, (item.value / max) * (A.h - 26));
          const x = A.x + 2 + i * slot + (slot - barW) / 2;
          return [
            rect(x, base - h, barW, h, item.value === max ? p.acc : p.dark, false),
            text(k, { x: x - 3, y: base - h - 8, w: barW + 6, h: 7 }, number(item.value), 16, 10, { hex: p.dark, bold: true, align: "center", valign: "bottom" }),
            text(k, { x: A.x + 2 + i * slot, y: base + 2, w: slot, h: 11 }, item.label, 14, 9, { hex: p.muted, align: "center" }),
          ];
        }),
        rect(A.x, base, A.w, 0.5, p.dark),
      ]);
    }

    // Вопрос на тёмном слайде, подсказка на плашке
    case "think": {
      const d = data(spec);
      return one(d.title, [
        rect(0, 0, 100, 100, p.dark),
        rect(7, 16, 14, sq(14), p.acc, k.look.badge),
        icon(iconAt(0, "question"), 9.8, 16 + sq(2.8), 8.4, p.onAcc),
        text(k, { x: 26, y: 14, w: 66, h: 9 }, d.title, 18, 12, { hex: p.acc, bold: true, valign: "middle" }),
        text(k, { x: 26, y: 25, w: 68, h: 40 }, d.question, 34, 16, { ...serif(k), hex: p.onDark }),
        ...(d.hint.trim()
          ? [
              rect(26, 72, 68, 15, p.dark2, k.look.radius),
              icon("lightbulb", 28.5, 75.5, 4, p.acc),
              text(k, { x: 34.5, y: 72, w: 57, h: 15 }, d.hint, 16, 10, { hex: p.soft, valign: "middle", italic: true }),
            ]
          : []),
      ]);
    }

    // Задание на карточке, критерии — на тёмной плашке с галочками
    case "task": {
      const d = data(spec);
      const lw = A.w * 0.6;
      const rx = A.x + lw + 2.6;
      const rw = A.w - lw - 2.6;
      return one(d.title, [
        ...head(d.title),
        ...card(k, { x: A.x, y: A.y, w: lw, h: A.h }),
        ...badge(k, A.x + inset(k) + 1, A.y + 3, 6, iconAt(0, "notebook"), 0, false),
        text(k, { x: A.x + inset(k) + 9, y: A.y + 3, w: lw - inset(k) - 11, h: sq(6) }, d.name, 20, 12, { bold: true, valign: "middle" }),
        text(k, { x: A.x + inset(k) + 1, y: A.y + 18, w: lw - inset(k) - 3, h: A.h - 21 }, d.lines, 17, 10, { bullet: true }),
        panel(k, { x: rx, y: A.y, w: rw, h: A.h }),
        text(k, { x: rx + 2.4, y: A.y + 2, w: rw - 4.8, h: 10 }, d.criteriaTitle, 18, 11, { hex: p.acc, bold: true, valign: "middle" }),
        ...d.criteria.flatMap((item, i): SlideElement[] => {
          const y = A.y + 15 + i * ((A.h - 17) / 3);
          return [
            rect(rx + 2.4, y + 0.6, 3.4, sq(3.4), p.acc, k.look.badge),
            icon("check", rx + 2.4 + 0.7, y + 0.6 + sq(0.7), 2, p.onAcc),
            text(k, { x: rx + 7.4, y, w: rw - 9.6, h: (A.h - 17) / 3 - 1 }, item, 15, 9, { hex: p.onDark }),
          ];
        }),
      ]);
    }

    // Три карточки-начала фраз; средняя — тёмная
    case "reflection": {
      const d = data(spec);
      const fallback: IconName[] = ["star", "puzzle", "heart"];
      const w = (A.w - 4.4) / 3;
      return one(d.title, [
        ...head(d.title),
        ...d.items.flatMap((item, i): SlideElement[] => {
          const x = A.x + i * (w + 2.2);
          const dark = i === 1 && !k.look.tiles;
          return [
            ...(dark ? [panel(k, { x, y: A.y, w, h: A.h })] : card(k, { x, y: A.y, w, h: A.h }, i)),
            rect(x + w / 2 - 3.6, A.y + 5, 7.2, sq(7.2), p.acc, k.look.badge),
            icon(iconAt(i, fallback[i]), x + w / 2 - 2, A.y + 5 + sq(1.6), 4, p.onAcc),
            text(k, { x: x + 2.4, y: A.y + 24, w: w - 4.8, h: A.h - 27 }, item, 22, 12, {
              ...serif(k),
              align: "center",
              hex: dark ? p.onDark : k.look.tiles ? p.text : p.dark,
            }),
          ];
        }),
      ]);
    }

    // Задания карточками и плашка со «спасибо»
    case "homework": {
      const d = data(spec);
      return one(d.title, [
        ...head(d.title),
        ...rows(k, d.lines, { x: A.x, y: A.y, w: A.w, h: A.h - 19 }, "number"),
        ...callout(k, { x: A.x, y: A.y + A.h - 15, w: A.w, h: 15 }, d.thanks, iconAt(0, "star"), true),
      ]);
    }
  }
}

// ——— Семь оформлений ———

const pageNo = (k: Kit, b: Box, hex = k.p.muted): Text => text(k, b, String(k.n), 10, 10, { hex, align: "center", valign: "middle" });

/** A · Белес: тёмно-синий и жёлтый, кружки, заголовок по центру засечками */
const beles: Look = {
  fonts: { heading: "Cambria", body: "Calibri" },
  fallbackAcc: "F2A33A",
  radius: true,
  area: { x: 6, y: 22, w: 88, h: 70 },
  badge: "full",
  tintBadge: true,
  card: { fill: true, line: false },
  frame: (k) => [pageNo(k, { x: 91, y: 93, w: 5, h: 5 })],
  heading: (t, k) => (t ? [text(k, { x: 6, y: 5, w: 88, h: 13 }, t, 30, 18, { ...serif(k), hex: k.p.dark, align: "center", valign: "middle", role: "heading" })] : []),
  title: (d, k) => [
    rect(0, 0, 100, 100, k.p.dark),
    rect(64, 34, 48, sq(48), k.p.dark2, "full"),
    rect(80, -18, 28, sq(28), k.p.acc, "full"),
    icon("graduation", 85, 5, 10, k.p.onAcc),
    ...(d.kicker.trim() ? [text(k, { x: 6, y: 16, w: 60, h: 7 }, upper(d.kicker, k), 14, 10, { hex: k.p.acc, bold: true, valign: "bottom" })] : []),
    text(k, { x: 6, y: 25, w: 60, h: 36 }, d.topic, 44, 24, { ...serif(k), hex: k.p.onDark, valign: "middle" }),
    rect(6, 64, 8, 1.2, k.p.acc),
    ...(d.author.trim() ? [rect(6, 74, 48, 13, k.p.acc, true), text(k, { x: 8.5, y: 74, w: 44, h: 13 }, d.author, 18, 11, { hex: k.p.onAcc, bold: true, valign: "middle" })] : []),
  ],
};

/** B · Сызба: номер слайда крупно, короткая черта, карточки с цветной полосой, подвал */
const syzba: Look = {
  fonts: { heading: "Arial", body: "Arial" },
  fallbackAcc: "EF6F5E",
  radius: true,
  area: { x: 6, y: 23, w: 88, h: 63 },
  badge: true,
  tintBadge: true,
  card: { fill: false, line: true, bar: "top" },
  frame: (k) => [
    rect(0, 92, 100, 8, k.p.dark),
    text(k, { x: 6, y: 92, w: 70, h: 8 }, k.topic, 11, 8, { hex: k.p.onDark, valign: "middle" }),
    text(k, { x: 80, y: 92, w: 14, h: 8 }, String(k.n), 11, 11, { hex: k.p.onDark, align: "left", valign: "middle" }),
  ],
  heading: (t, k) =>
    t
      ? [
          text(k, { x: 6, y: 5, w: 13, h: 15 }, String(k.n).padStart(2, "0"), 48, 30, { bold: true, hex: mix(k.p.dark, k.p.bg, 0.75), valign: "bottom" }),
          text(k, { x: 19, y: 5, w: 75, h: 12 }, t, 28, 16, { bold: true, hex: k.p.text, valign: "bottom", role: "heading" }),
          rect(19, 18, 5, 1, k.p.acc, true),
        ]
      : [],
  title: (d, k) => [
    rect(0, 0, 56, 100, k.p.dark),
    rect(56, 0, 44, 100, k.p.light),
    icon("lightbulb", 70, 26, 16, mix(k.p.dark, k.p.light, 0.55)),
    ...(d.kicker.trim() ? [rect(6, 14, 30, 7, k.p.dark, true, mix(k.p.onDark, k.p.dark, 0.35)), text(k, { x: 7, y: 14, w: 28, h: 7 }, d.kicker, 12, 8, { hex: k.p.onDark, align: "center", valign: "middle" })] : []),
    text(k, { x: 6, y: 26, w: 44, h: 40 }, d.topic, 40, 22, { bold: true, hex: k.p.onDark, valign: "middle" }),
    ...(d.author.trim() ? [text(k, { x: 6, y: 80, w: 44, h: 8 }, d.author, 14, 10, { hex: k.p.soft, valign: "middle" })] : []),
    rect(56 - 9, 62, 18, sq(18), k.p.acc, "full", "FFFFFF"),
    icon("star", 56 - 4.5, 62 + sq(4.5), 9, k.p.onAcc),
  ],
};

/** C · Журнал: крупные цифры 01, надпись сверху, тонкие линии, плитки без скругления */
const journal: Look = {
  fonts: { heading: "Cambria", body: "Calibri" },
  fallbackAcc: "D39B1C",
  radius: false,
  area: { x: 6, y: 25, w: 88, h: 67 },
  badge: false,
  tintBadge: false,
  card: { fill: true, line: false, bar: "top" },
  bigNumerals: true,
  frame: (k) => [rect(6, 95, 88, 0.25, k.p.line), text(k, { x: 6, y: 95.5, w: 60, h: 4 }, k.topic, 9, 8, { hex: k.p.muted, italic: true, valign: "middle" }), pageNo(k, { x: 88, y: 95.5, w: 6, h: 4 })],
  heading: (t, k) =>
    t
      ? [
          text(k, { x: 6, y: 5, w: 60, h: 5 }, upper(k.topic, k), 11, 8, { hex: k.p.acc, bold: true, valign: "bottom" }),
          text(k, { x: 6, y: 10, w: 88, h: 11 }, t, 30, 18, { ...serif(k), hex: k.p.text, valign: "middle", role: "heading" }),
          rect(6, 22, 88, 0.25, k.p.line),
        ]
      : [],
  title: (d, k) => [
    rect(58, 0, 42, 100, k.p.dark),
    rect(0, 0, 58, 100, k.p.light),
    icon("book", 21, 30, 16, mix(k.p.dark, k.p.light, 0.6)),
    ...(d.kicker.trim() ? [text(k, { x: 62, y: 18, w: 34, h: 6 }, upper(d.kicker, k), 12, 8, { hex: k.p.acc, bold: true })] : []),
    text(k, { x: 62, y: 26, w: 34, h: 40 }, d.topic, 30, 18, { ...serif(k), hex: k.p.onDark, valign: "middle" }),
    rect(62, 70, 7, 0.9, k.p.acc),
    ...(d.author.trim() ? [text(k, { x: 62, y: 74, w: 34, h: 10 }, d.author, 15, 10, { hex: k.p.soft })] : []),
  ],
};

/** D · Мозаика: цветные плитки, скруглённые квадраты, жирный заголовок слева */
const mosaic: Look = {
  fonts: { heading: "Segoe UI", body: "Segoe UI" },
  fallbackAcc: "FFA585",
  radius: true,
  area: { x: 5, y: 21, w: 90, h: 73 },
  badge: true,
  tintBadge: false,
  card: { fill: true, line: false },
  tiles: ["FFFFFF", "FFE0D3", "D6F3EA", "FFF0C2"],
  frame: () => [],
  heading: (t, k) => (t ? [text(k, { x: 5, y: 5, w: 90, h: 13 }, t, 30, 18, { bold: true, face: k.look.fonts.heading, hex: k.p.text, valign: "middle", role: "heading" })] : []),
  title: (d, k) => [
    rect(4, 6, 55, 88, k.p.dark, true),
    ...(d.kicker.trim() ? [text(k, { x: 8, y: 12, w: 47, h: 6 }, upper(d.kicker, k), 12, 8, { hex: mix(k.p.onDark, k.p.dark, 0.3), bold: true })] : []),
    text(k, { x: 8, y: 40, w: 47, h: 36 }, d.topic, 40, 22, { bold: true, hex: k.p.onDark, valign: "bottom" }),
    ...(d.author.trim() ? [text(k, { x: 8, y: 79, w: 47, h: 9 }, d.author, 14, 10, { hex: mix(k.p.onDark, k.p.dark, 0.3), valign: "middle" })] : []),
    rect(61, 6, 35, 42, k.p.acc, true),
    icon("star", 71, 12, 15, k.p.onAcc),
    rect(61, 52, 16, 42, "8FD8C0", true),
    icon("lightbulb", 64, 64, 10, k.p.text),
    rect(80, 52, 16, 42, "FFD86B", true),
    icon("smile", 83, 64, 10, k.p.text),
  ],
};

/** E · Ресми есеп: полоса сверху с золотой линией, надпись-раздел, подвал с линией */
const official: Look = {
  fonts: { heading: "Times New Roman", body: "Arial" },
  fallbackAcc: "B8913A",
  radius: false,
  area: { x: 6, y: 26, w: 88, h: 60 },
  badge: false,
  tintBadge: false,
  card: { fill: false, line: true, bar: "top" },
  frame: (k) => [
    rect(0, 0, 100, 2.4, k.p.dark),
    rect(0, 3.2, 100, 0.25, k.p.acc),
    rect(6, 89.5, 88, 0.25, k.p.line),
    text(k, { x: 6, y: 90.5, w: 70, h: 5 }, k.topic, 9, 8, { hex: k.p.muted, valign: "middle" }),
    text(k, { x: 80, y: 90.5, w: 14, h: 5 }, String(k.n), 9, 9, { hex: k.p.muted, align: "left", valign: "middle" }),
  ],
  heading: (t, k) =>
    t
      ? [
          text(k, { x: 6, y: 8, w: 88, h: 5 }, k.language === "kk" ? `${k.n}-БӨЛІМ` : `РАЗДЕЛ ${k.n}`, 11, 8, { hex: k.p.acc, bold: true, valign: "bottom" }),
          text(k, { x: 6, y: 13, w: 88, h: 10 }, t, 28, 16, { ...serif(k), hex: k.p.dark, valign: "middle", role: "heading" }),
        ]
      : [],
  title: (d, k) => [
    rect(0, 0, 100, 2.4, k.p.dark),
    rect(0, 3.2, 100, 0.25, k.p.acc),
    rect(46, 14, 8, sq(8), k.p.bg, "full", k.p.dark),
    icon("school", 47.8, 14 + sq(1.8), 4.4, k.p.dark),
    ...(d.kicker.trim() ? [text(k, { x: 10, y: 31, w: 80, h: 6 }, d.kicker, 14, 10, { hex: k.p.muted, align: "center", valign: "middle" })] : []),
    rect(45, 39.5, 10, 0.3, k.p.acc),
    text(k, { x: 10, y: 43, w: 80, h: 26 }, d.topic, 36, 20, { ...serif(k), hex: k.p.dark, align: "center", valign: "middle" }),
    ...(d.author.trim() ? [text(k, { x: 10, y: 74, w: 80, h: 8 }, d.author, 15, 10, { hex: k.p.text, align: "center", valign: "middle" })] : []),
    rect(6, 89.5, 88, 0.25, k.p.line),
  ],
};

/** F · Аттестация: двойная рамка, надпись-раздел, короткая черта, квадратные метки */
const attest: Look = {
  fonts: { heading: "Palatino Linotype", body: "Arial" },
  fallbackAcc: "B8913A",
  radius: false,
  area: { x: 7, y: 27, w: 86, h: 63 },
  badge: false,
  tintBadge: false,
  card: { fill: true, line: false, bar: "left" },
  frame: (k) => [
    rect(2.2, 3.9, 95.6, 92.2, k.p.bg, false, k.p.line),
    rect(3, 5.3, 94, 89.4, k.p.bg, false, mix(k.p.line, k.p.bg, 0.5)),
    pageNo(k, { x: 88, y: 89.5, w: 5, h: 4 }),
  ],
  heading: (t, k) =>
    t
      ? [
          text(k, { x: 7, y: 9, w: 86, h: 5 }, upper(k.topic, k), 10, 8, { hex: k.p.dark, bold: true, valign: "bottom" }),
          text(k, { x: 7, y: 14, w: 86, h: 9 }, t, 26, 16, { ...serif(k), hex: k.p.text, valign: "middle", role: "heading" }),
          rect(7, 23.6, 6, 0.6, k.p.dark),
        ]
      : [],
  title: (d, k) => [
    rect(2.2, 3.9, 95.6, 92.2, k.p.bg, false, k.p.line),
    rect(3, 5.3, 94, 89.4, k.p.bg, false, mix(k.p.line, k.p.bg, 0.5)),
    rect(11, 18, 24, 64, k.p.bg, false, k.p.dark),
    rect(8, 14, 24, 64, k.p.light),
    icon("users", 14, 36, 12, mix(k.p.muted, k.p.light, 0.3)),
    ...(d.kicker.trim() ? [text(k, { x: 42, y: 22, w: 50, h: 6 }, upper(d.kicker, k), 12, 8, { hex: k.p.dark, bold: true })] : []),
    text(k, { x: 42, y: 30, w: 50, h: 30 }, d.topic, 36, 20, { ...serif(k), hex: k.p.text, valign: "middle" }),
    rect(42, 63, 7, 0.7, k.p.dark),
    ...(d.author.trim() ? [text(k, { x: 42, y: 67, w: 50, h: 9 }, d.author, 16, 10, { hex: k.p.muted, valign: "middle" })] : []),
    rect(82, 70, 10, sq(10), k.p.bg, "full", k.p.dark),
    icon("award", 84.5, 70 + sq(2.5), 5, k.p.dark),
  ],
};

/** G · Әдістемелік: тёмная полоса слева с номером, синяя надпись сверху, рамки без заливки */
const method: Look = {
  fonts: { heading: "Calibri", body: "Calibri" },
  fallbackAcc: "1F6F8B",
  radius: false,
  area: { x: 13, y: 25, w: 81, h: 67 },
  badge: false,
  tintBadge: true,
  card: { fill: false, line: true },
  frame: (k) => [
    rect(0, 0, 7, 100, k.p.dark),
    text(k, { x: 0, y: 5, w: 7, h: 10 }, String(k.n).padStart(2, "0"), 20, 14, { bold: true, hex: k.p.onDark, align: "center", valign: "middle" }),
    rect(2.5, 88, 2, 0.4, k.p.acc),
  ],
  heading: (t, k) =>
    t
      ? [
          text(k, { x: 13, y: 6, w: 81, h: 5 }, k.topic, 11, 8, { hex: k.p.acc, bold: true, valign: "bottom" }),
          text(k, { x: 13, y: 11, w: 81, h: 11 }, t, 28, 16, { bold: true, face: k.look.fonts.heading, hex: k.p.text, valign: "middle", role: "heading" }),
        ]
      : [],
  title: (d, k) => [
    rect(68, 0, 32, 100, k.p.dark),
    ...(d.kicker.trim() ? [text(k, { x: 8, y: 20, w: 56, h: 6 }, d.kicker, 14, 10, { hex: k.p.acc, bold: true })] : []),
    text(k, { x: 8, y: 28, w: 56, h: 36 }, d.topic, 38, 20, { bold: true, face: k.look.fonts.heading, hex: k.p.text, valign: "middle" }),
    rect(8, 67, 8, 0.8, k.p.acc),
    ...(d.author.trim() ? [text(k, { x: 8, y: 71, w: 56, h: 10 }, d.author, 16, 10, { hex: k.p.muted })] : []),
    icon("messages", 76, 30, 16, mix(k.p.onDark, k.p.dark, 0.6)),
    rect(74, 72, 20, 0.3, mix(k.p.onDark, k.p.dark, 0.6)),
  ],
};

const looks: Record<Exclude<LookId, "classic">, Look> = { beles, syzba, journal, mosaic, official, attest, method };

/** Страницы одного слайда в выбранном оформлении (рамку добавляет lookSlides) */
export function lookSlides(
  look: Exclude<LookId, "classic">,
  specs: StructureSlide[],
  isData: (s: StructureSlide) => s is DataSlide,
  pkg: TopicPackage,
  l: LookCopy,
  template: SlideTemplate,
) {
  // Шрифт, выбранный учителем, заменяет шрифты дизайна
  const def = pkg.font ? { ...looks[look], fonts: { heading: pkg.font, body: pkg.font } } : looks[look];
  const p = palette(template, def.fallbackAcc);
  let n = 0;
  return specs.flatMap((spec) => {
    // Номер слайда нужен заранее (у «Сызба» и «Әдістемелік» он в заголовке)
    const start = n;
    const kit = (i: number): Kit => ({ p, look: def, language: pkg.language, topic: pkg.topic, n: start + i + 1 });
    const pages = isData(spec) ? dataPagesNumbered(spec, pkg, l, kit) : contentPagesNumbered(spec.kind as ContentKind, pkg, l, kit);
    n += pages.length;
    return pages.map((page, i) => ({
      spec,
      title: page.title,
      elements: spec.kind === "title" || spec.kind === "think" ? page.elements : [...def.frame(kit(i)), ...page.elements],
    }));
  });
}

// Слайд может разбиться на несколько страниц (длинные списки) — у каждой свой номер.
// Номер известен только после раскладки, поэтому раскладываем с номером первой
// страницы, а для остальных — ещё раз с их номером (это дёшево).
function dataPagesNumbered(spec: DataSlide, pkg: TopicPackage, l: LookCopy, kit: (i: number) => Kit): LookPages {
  return dataPages(spec, pkg, l, kit(0));
}
function contentPagesNumbered(kind: ContentKind, pkg: TopicPackage, l: LookCopy, kit: (i: number) => Kit): LookPages {
  const first = contentPages(kind, pkg, l, kit(0));
  return first.map((page, i) => (i === 0 ? page : contentPages(kind, pkg, l, kit(i))[i]));
}
