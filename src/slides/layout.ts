import type { Language, TopicPackage } from "@/types/topic-package";
import { subjectNames } from "@/lib/labels";
import type { IconName } from "./icons";
import type { SlideTemplate } from "./templates";

// Раскладка слайдов — одна на превью и на PPTX.
// buildSlides превращает пакет темы в список слайдов из простых элементов
// (прямоугольник, круг, текст, иконка, место под картинку) с координатами
// в процентах от слайда и размером шрифта в пунктах. Дальше их рисуют два «художника»:
//   SlideCanvas.tsx — в браузере (HTML), export-pptx.ts — в файл PowerPoint.
// Поэтому то, что учитель видит на сайте, совпадает со скачанным файлом.
//
// Слайды двух видов: с содержанием из пакета темы и заготовки (цели, план,
// рефлексия…) с текстом-подсказкой, который учитель заменит в PowerPoint.

/** Слайд 16:9 в PowerPoint — 10 × 5,625 дюйма, то есть 720 × 405 пунктов */
export const SLIDE_W_PT = 720;
export const SLIDE_H_PT = 405;

type ColorRole = keyof SlideTemplate["colors"];

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export type SlideElement =
  /** rounded: true — скруглённые углы, "full" — круг/овал */
  | (Box & { type: "rect"; fill: ColorRole; rounded?: boolean | "full" })
  | (Box & { type: "circle"; color: string; transparency: number })
  | (Box & { type: "icon"; name: IconName; color: ColorRole })
  /** Место под картинку: в PowerPoint учитель нажимает на значок и выбирает фото */
  | (Box & { type: "image"; label: string; prompt: string })
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
      valign?: "top" | "middle" | "bottom";
    });

export type SlideKind =
  | "title"
  | "goals"
  | "plan"
  | "definition"
  | "facts"
  | "examples"
  | "terms"
  | "text-image"
  | "big-image"
  | "compare"
  | "numbers"
  | "think"
  | "task"
  | "reflection"
  | "homework";

export interface Slide {
  kind: SlideKind;
  elements: SlideElement[];
}

// Тексты слайдов. Всё, что в заготовках, — подсказки для учителя.
const copy = {
  kk: {
    grade: "сынып",
    definition: "Анықтама",
    facts: "Негізгі фактілер",
    examples: "Өмірдегі мысалдар",
    terms: "Терминдер",
    goals: {
      title: "Сабақтың мақсаты",
      items: [
        ["Білу", "Оқушылар … біледі"],
        ["Түсіну", "Оқушылар … түсінеді"],
        ["Қолдану", "Оқушылар … қолдана алады"],
      ],
    },
    plan: {
      title: "Сабақ жоспары",
      steps: [
        ["Ұйымдастыру", "3 мин"],
        ["Жаңа тақырып", "15 мин"],
        ["Бекіту", "15 мин"],
        ["Рефлексия", "5 мин"],
      ],
    },
    textImage: {
      title: "Тақырыпшаны жазыңыз",
      bullets: ["Бірінші ойды осында жазыңыз", "Екінші ойды осында жазыңыз", "Үшінші ойды осында жазыңыз"],
    },
    image: { label: "Сурет орны", prompt: "Сурет қою үшін белгішені басыңыз", caption: "Суретке түсініктеме жазыңыз" },
    compare: { title: "Салыстырайық", left: "1-ұғым", right: "2-ұғым", lines: ["Белгісі …", "Белгісі …", "Белгісі …"] },
    numbers: { title: "Сандар сөйлейді", caption: "Бұл сан нені білдіреді?" },
    think: {
      title: "Ойланайық",
      question: "Талқылауға арналған сұрақты осында жазыңыз?",
      hint: "Ойлан — жұптас — бөліс · 3 минут",
    },
    task: {
      title: "Тапсырма",
      name: "1-тапсырма",
      lines: ["Тапсырманың шартын осында жазыңыз", "Не істеу керек — қадам бойынша", "Уақыты: 5 минут"],
      criteriaTitle: "Дескрипторлар",
      criteria: ["Анықтаманы атайды", "Мысал келтіреді", "Қорытынды жасайды"],
    },
    reflection: { title: "Рефлексия", items: ["Бүгін мен білдім…", "Маған қиын болды…", "Мен әлі білгім келеді…"] },
    homework: { title: "Үй тапсырмасы", lines: ["§ ___ , ___-бетті оқу", "___-жаттығуды орындау"], thanks: "Сабаққа рахмет!" },
  },
  ru: {
    grade: "класс",
    definition: "Определение",
    facts: "Главное",
    examples: "Примеры из жизни",
    terms: "Термины",
    goals: {
      title: "Цели урока",
      items: [
        ["Знать", "Учащиеся будут знать …"],
        ["Понимать", "Учащиеся поймут …"],
        ["Применять", "Учащиеся смогут …"],
      ],
    },
    plan: {
      title: "План урока",
      steps: [
        ["Орг. момент", "3 мин"],
        ["Новая тема", "15 мин"],
        ["Закрепление", "15 мин"],
        ["Рефлексия", "5 мин"],
      ],
    },
    textImage: {
      title: "Впишите подзаголовок",
      bullets: ["Впишите первую мысль", "Впишите вторую мысль", "Впишите третью мысль"],
    },
    image: { label: "Место для рисунка", prompt: "Нажмите на значок, чтобы вставить рисунок", caption: "Впишите подпись к рисунку" },
    compare: { title: "Сравним", left: "Понятие 1", right: "Понятие 2", lines: ["Признак …", "Признак …", "Признак …"] },
    numbers: { title: "Цифры и факты", caption: "Что означает это число?" },
    think: {
      title: "Подумаем",
      question: "Впишите вопрос для обсуждения?",
      hint: "Думай — объединяйся — делись · 3 минуты",
    },
    task: {
      title: "Задание",
      name: "Задание 1",
      lines: ["Впишите условие задания", "Что нужно сделать — по шагам", "Время: 5 минут"],
      criteriaTitle: "Дескрипторы",
      criteria: ["Называет определение", "Приводит пример", "Делает вывод"],
    },
    reflection: { title: "Рефлексия", items: ["Сегодня я узнал…", "Мне было трудно…", "Я хочу узнать…"] },
    homework: { title: "Домашнее задание", lines: ["§ ___ , стр. ___ прочитать", "Выполнить упражнение ___"], thanks: "Спасибо за урок!" },
  },
} satisfies Record<Language, unknown>;

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

const chunk = <T>(items: T[], size: number) =>
  Array.from({ length: Math.ceil(items.length / size) }, (_, i) => items.slice(i * size, i * size + size));

/** Высота в % для квадрата шириной w % (слайд 16:9) */
const sq = (w: number) => (w * SLIDE_W_PT) / SLIDE_H_PT;

function decor(template: SlideTemplate): SlideElement[] {
  if (!template.decor) return [];
  const { color, transparency } = template.decor;
  return [
    { type: "circle", x: 78, y: -30, w: 34, h: 60, color, transparency },
    { type: "circle", x: 88, y: 18, w: 18, h: 32, color, transparency },
  ];
}

function heading(value: string, w = 80): SlideElement {
  return { type: "text", x: 6, y: 7, w, h: 13, text: value, fontSize: fitFontSize(value, { w, h: 13 }, 30, 20), color: "accent", font: "heading", bold: true, valign: "middle" };
}

function text(box: Box, value: string | string[], max: number, min: number, extra: Partial<SlideElement> = {}): SlideElement {
  return {
    type: "text",
    ...box,
    text: value,
    fontSize: fitFontSize(value, box, max, min),
    color: "text",
    font: "body",
    ...extra,
  } as SlideElement;
}

/** Квадратный значок: цветная плашка с иконкой внутри */
function badge(x: number, y: number, size: number, name: IconName, fill: ColorRole = "accent", color: ColorRole = "onAccent"): SlideElement[] {
  const pad = size * 0.22;
  return [
    { type: "rect", x, y, w: size, h: sq(size), fill, rounded: true },
    { type: "icon", name, color, x: x + pad, y: y + sq(pad), w: size - pad * 2, h: sq(size - pad * 2) },
  ];
}

function image(box: Box, l: (typeof copy)[Language]): SlideElement {
  return { type: "image", ...box, label: l.image.label, prompt: l.image.prompt };
}

export function buildSlides(pkg: TopicPackage, template: SlideTemplate): Slide[] {
  const l = copy[pkg.language];
  const slides: Slide[] = [];
  const add = (kind: SlideKind, elements: SlideElement[], withDecor = true) =>
    slides.push({ kind, elements: withDecor ? [...decor(template), ...elements] : elements });
  const page = (base: string, i: number, total: number) => (total > 1 ? `${base} (${i + 1})` : base);

  // 1. Титульный
  add("title", [
    { type: "rect", x: 6, y: 22, w: 10, h: 2, fill: "accent" },
    {
      type: "text",
      x: 6,
      y: 12,
      w: 70,
      h: 9,
      text: `${subjectNames[pkg.subject]} · ${pkg.grade}-${l.grade}`.toUpperCase(),
      fontSize: 16,
      color: "muted",
      font: "body",
      bold: true,
      valign: "bottom",
    },
    text({ x: 6, y: 34, w: 80, h: 38 }, pkg.topic, 54, 28, { font: "heading", bold: true, valign: "middle" }),
  ]);

  // 2. Цели урока — три карточки с иконками
  add("goals", [
    heading(l.goals.title),
    ...l.goals.items.flatMap(([title, body], i): SlideElement[] => {
      const x = 6 + i * 30;
      return [
        { type: "rect", x, y: 26, w: 28, h: 64, fill: "surface", rounded: true },
        ...badge(x + 2.5, 31, 7, (["lightbulb", "brain", "rocket"] as const)[i]),
        text({ x: x + 2.5, y: 48, w: 23, h: 10 }, title, 22, 14, { font: "heading", bold: true, color: "accent", valign: "middle" }),
        text({ x: x + 2.5, y: 59, w: 23, h: 26 }, body, 16, 11, { color: "muted" }),
      ];
    }),
  ]);

  // 3. План урока — линия времени из четырёх шагов
  add("plan", [
    heading(l.plan.title),
    { type: "rect", x: 12, y: 49, w: 76, h: 1.2, fill: "surface" },
    ...l.plan.steps.flatMap(([step, minutes], i): SlideElement[] => {
      const cx = 12 + i * (76 / 3);
      return [
        { type: "rect", x: cx - 4, y: 49.6 - sq(8) / 2, w: 8, h: sq(8), fill: "accent", rounded: "full" },
        { type: "text", x: cx - 4, y: 49.6 - sq(8) / 2, w: 8, h: sq(8), text: String(i + 1), fontSize: 24, color: "onAccent", font: "heading", bold: true, align: "center", valign: "middle" },
        text({ x: cx - 11, y: 66, w: 22, h: 10 }, step, 18, 12, { bold: true, align: "center", valign: "top" }),
        text({ x: cx - 11, y: 76, w: 22, h: 7 }, minutes, 14, 10, { color: "muted", align: "center" }),
      ];
    }),
  ]);

  // 4. Определение (+ формула)
  const hasFormula = Boolean(pkg.formula);
  const definition: SlideElement[] = [
    heading(l.definition),
    text({ x: 6, y: 24, w: 88, h: hasFormula ? 38 : 66 }, pkg.definition, 30, 16, { valign: "top" }),
  ];
  if (pkg.formula) {
    const variables = pkg.formula.variables.map((v) => `${v.symbol} — ${v.meaning}${v.unit ? `, ${v.unit}` : ""}`);
    definition.push(
      { type: "rect", x: 6, y: 66, w: 88, h: 26, fill: "surface", rounded: true },
      { type: "text", x: 9, y: 68, w: 38, h: 22, text: pkg.formula.expression, fontSize: 28, color: "accent", font: "heading", bold: true, valign: "middle" },
      text({ x: 49, y: 68, w: 43, h: 22 }, variables, 16, 10, { color: "muted", valign: "middle" }),
    );
  }
  add("definition", definition);

  // 5. Главные факты — до 5 на слайд
  const factPages = chunk(pkg.keyFacts, 5);
  factPages.forEach((facts, i) =>
    add("facts", [
      heading(page(l.facts, i, factPages.length)),
      { type: "rect", x: 6, y: 24, w: 0.6, h: 66, fill: "accent" },
      text({ x: 9, y: 24, w: 85, h: 66 }, facts, 24, 13, { valign: "top", bullet: true }),
    ]),
  );

  // 6. Примеры — карточки 2 × 2
  const examplePages = chunk(pkg.examples, 4);
  examplePages.forEach((examples, i) =>
    add("examples", [
      heading(page(l.examples, i, examplePages.length)),
      ...examples.flatMap((example, j): SlideElement[] => {
        const x = 6 + (j % 2) * 45;
        const y = 24 + Math.floor(j / 2) * 35;
        return [
          { type: "rect", x, y, w: 43, h: 32, fill: "surface", rounded: true },
          { type: "rect", x: x + 2.5, y: y + 6, w: 5, h: 9, fill: "accent", rounded: true },
          { type: "text", x: x + 2.5, y: y + 6, w: 5, h: 9, text: String(j + 1), fontSize: 18, color: "onAccent", font: "heading", bold: true, align: "center", valign: "middle" },
          text({ x: x + 9.5, y: y + 3, w: 31, h: 26 }, example.text, 18, 10, { valign: "middle" }),
        ];
      }),
    ]),
  );

  // 7. Термины — сетка 2 × 3
  const termPages = chunk(pkg.terms, 6);
  termPages.forEach((terms, i) =>
    add("terms", [
      heading(page(l.terms, i, termPages.length)),
      ...terms.flatMap((term, j): SlideElement[] => {
        const x = 6 + (j % 2) * 45;
        const y = 24 + Math.floor(j / 2) * 23.5;
        return [
          { type: "rect", x, y, w: 43, h: 21, fill: "surface", rounded: true },
          text({ x: x + 2.5, y: y + 2, w: 38, h: 7 }, term.term, 18, 11, { bold: true, color: "accent", font: "heading", valign: "middle" }),
          text({ x: x + 2.5, y: y + 9.5, w: 38, h: 10 }, term.explanation, 14, 9, { color: "muted", valign: "top" }),
        ];
      }),
    ]),
  );

  // 8. Текст + картинка
  add(
    "text-image",
    [
      heading(l.textImage.title, 44),
      { type: "rect", x: 6, y: 23, w: 8, h: 1.2, fill: "accent" },
      text({ x: 6, y: 30, w: 42, h: 58 }, l.textImage.bullets, 22, 14, { bullet: true, color: "muted" }),
      image({ x: 53, y: 9, w: 41, h: 82 }, l),
    ],
    false,
  );

  // 9. Большая картинка с подписью
  add(
    "big-image",
    [
      image({ x: 6, y: 8, w: 88, h: 68 }, l),
      { type: "rect", x: 6, y: 79, w: 88, h: 13, fill: "accent", rounded: true },
      text({ x: 9, y: 79, w: 82, h: 13 }, l.image.caption, 20, 12, { color: "onAccent", valign: "middle", bold: true }),
    ],
    false,
  );

  // 10. Сравнение — две колонки и весы посередине
  add("compare", [
    heading(l.compare.title),
    ...[l.compare.left, l.compare.right].flatMap((name, i): SlideElement[] => {
      const x = i === 0 ? 6 : 55;
      return [
        { type: "rect", x, y: 25, w: 39, h: 66, fill: "surface", rounded: true },
        { type: "rect", x, y: 25, w: 39, h: 13, fill: "accent", rounded: true },
        text({ x: x + 2.5, y: 25, w: 34, h: 13 }, name, 22, 14, { color: "onAccent", bold: true, font: "heading", align: "center", valign: "middle" }),
        text({ x: x + 3, y: 43, w: 33, h: 44 }, l.compare.lines, 18, 12, { bullet: true, color: "muted" }),
      ];
    }),
    ...badge(46, 50, 8, "scale", "background", "accent"),
  ]);

  // 11. Цифры — три больших числа
  add("numbers", [
    heading(l.numbers.title),
    ...[0, 1, 2].flatMap((i): SlideElement[] => {
      const x = 6 + i * 30;
      return [
        { type: "rect", x, y: 30, w: 28, h: 1.2, fill: "accent" },
        { type: "text", x, y: 34, w: 28, h: 26, text: "00", fontSize: 72, color: "accent", font: "heading", bold: true, valign: "middle" },
        text({ x, y: 62, w: 26, h: 20 }, l.numbers.caption, 16, 11, { color: "muted" }),
      ];
    }),
  ]);

  // 12. Вопрос для обсуждения
  add("think", [
    { type: "icon", name: "question", color: "accent", x: 6, y: 22, w: 24, h: sq(24) },
    text({ x: 35, y: 16, w: 59, h: 14 }, l.think.title, 30, 20, { color: "accent", font: "heading", bold: true, valign: "bottom" }),
    text({ x: 35, y: 32, w: 59, h: 40 }, l.think.question, 34, 18, { font: "heading", bold: true, valign: "middle" }),
    { type: "rect", x: 35, y: 76, w: 44, h: 11, fill: "surface", rounded: true },
    text({ x: 37, y: 76, w: 40, h: 11 }, l.think.hint, 15, 10, { color: "muted", valign: "middle" }),
  ]);

  // 13. Задание + дескрипторы оценивания
  add("task", [
    heading(l.task.title),
    { type: "rect", x: 6, y: 25, w: 53, h: 66, fill: "surface", rounded: true },
    ...badge(9, 30, 6, "notebook"),
    text({ x: 18, y: 30, w: 38, h: sq(6) }, l.task.name, 22, 14, { bold: true, font: "heading", valign: "middle" }),
    text({ x: 9, y: 48, w: 47, h: 40 }, l.task.lines, 18, 12, { bullet: true, color: "muted" }),
    { type: "rect", x: 62, y: 25, w: 32, h: 66, fill: "accent", rounded: true },
    text({ x: 65, y: 29, w: 27, h: 10 }, l.task.criteriaTitle, 20, 13, { color: "onAccent", bold: true, font: "heading", valign: "middle" }),
    ...l.task.criteria.flatMap((item, i): SlideElement[] => [
      { type: "icon", name: "check", color: "onAccent", x: 65, y: 44 + i * 15, w: 3.5, h: sq(3.5) },
      text({ x: 70, y: 43 + i * 15, w: 22, h: 12 }, item, 15, 10, { color: "onAccent", valign: "top" }),
    ]),
  ]);

  // 14. Рефлексия — три «стикера» с началом фразы
  add("reflection", [
    heading(l.reflection.title),
    ...l.reflection.items.flatMap((item, i): SlideElement[] => {
      const x = 6 + i * 30;
      return [
        { type: "rect", x, y: 27, w: 28, h: 60, fill: "surface", rounded: true },
        ...badge(x + 10.5, 33, 7, (["star", "puzzle", "heart"] as const)[i]),
        text({ x: x + 2.5, y: 52, w: 23, h: 30 }, item, 20, 13, { font: "heading", bold: true, align: "center", valign: "top" }),
      ];
    }),
  ]);

  // 15. Домашнее задание и «спасибо за урок»
  add("homework", [
    ...badge(6, 10, 8, "house"),
    text({ x: 17, y: 10, w: 60, h: sq(8) }, l.homework.title, 30, 20, { color: "accent", font: "heading", bold: true, valign: "middle" }),
    text({ x: 6, y: 34, w: 50, h: 30 }, l.homework.lines, 22, 14, { bullet: true }),
    { type: "rect", x: 6, y: 74, w: 88, h: 1.2, fill: "surface" },
    text({ x: 6, y: 78, w: 88, h: 14 }, l.homework.thanks, 32, 20, { color: "accent", font: "heading", bold: true, valign: "middle" }),
  ]);

  return slides;
}
