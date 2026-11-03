import { z } from "zod";

// Пакет темы — главный контракт проекта.
// AI генерирует его один раз на тему, а слайды и игры собираются из него
// по шаблонам без AI. Схемы zod делают три дела сразу:
//   1) из них выводятся типы TypeScript (z.infer),
//   2) из них строится JSON Schema для Gemini — AI отвечает строго по ней,
//   3) ими проверяется ответ AI и данные, пришедшие из браузера.

export const languageSchema = z.enum(["kk", "ru"]);
// Предмет выбирает учитель на главной (по умолчанию физика) — так AI знает,
// с какой стороны раскрывать тему. Новые значения можно добавлять в конец
// без смены schemaVersion: старые уроки остаются верными.
export const subjectSchema = z.enum([
  "physics",
  "chemistry",
  "biology",
  "history",
  "geography",
  "math",
  "other",
  "informatics",
  "kazakh",
  "russian",
  "literature",
  "english",
]);

const text = z.string().trim().min(1);

// Сколько элементов может быть в списках. Конструкторы используют эти же числа,
// чтобы кнопки «қосу» и «өшіру» не давали выйти за пределы схемы.
export const limits = {
  keyFacts: [3, 10],
  examples: [2, 6],
  terms: [4, 16],
  quiz: [5, 30],
  trueFalse: [4, 20],
  /** Темы «Өз ойын»: AI даёт 3–5, учитель может довести до 6 */
  jeopardy: [3, 6],
  /** Списки в слайдах-заготовках (пункты, строки задания…) */
  deckLines: [1, 6],
  tableColumns: [2, 5],
  tableRows: [1, 8],
  chartItems: [2, 8],
} as const;

export const formulaSchema = z.object({
  expression: text.describe('Формула, например "F = m·a"'),
  variables: z.array(
    z.object({
      symbol: text,
      meaning: text,
      unit: z.string().optional(),
    }),
  ),
});

export const quizQuestionSchema = z.object({
  question: text,
  options: z.array(text).length(4),
  correctIndex: z.number().int().min(0).max(3).describe("Индекс правильного варианта в options"),
  explanation: z.string().optional(),
});

// Картинка к вопросу. Храним только ссылку (строку текста), сам файл
// остаётся на сайте-источнике (обычно Wikimedia Commons) и базу не занимает.
// В схемах для AI картинки нет: модель не должна выдумывать ссылки.
export const imageSchema = z.object({
  url: z.url({ protocol: /^https$/ }).max(1000),
  /** Автор и лицензия — Wikimedia просит их указывать */
  credit: z.string().max(200).optional(),
});

/** Вопрос теста/викторины, как он хранится: то, что дал AI, + картинка от учителя */
export const quizItemSchema = quizQuestionSchema.extend({ image: imageSchema.optional() });

export const trueFalseSchema = z.object({
  statement: text,
  isTrue: z.boolean(),
  explanation: z.string().optional(),
});

// То, что пишет AI: только содержание темы.
export const packageContentSchema = z.object({
  definition: text,
  formula: formulaSchema.optional().describe("Только если у темы есть формула"),
  keyFacts: z.array(text).min(limits.keyFacts[0]).max(limits.keyFacts[1]),
  examples: z
    .array(
      z.object({
        text,
        imageQuery: text.describe("Поисковый запрос для фото на английском, 2–4 слова"),
      }),
    )
    .min(limits.examples[0])
    .max(limits.examples[1]),
  terms: z
    .array(z.object({ term: text, explanation: text }))
    .min(limits.terms[0])
    .max(limits.terms[1]),
  quiz: z.array(quizQuestionSchema).min(limits.quiz[0]).max(limits.quiz[1]),
  trueFalse: z.array(trueFalseSchema).min(limits.trueFalse[0]).max(limits.trueFalse[1]),
});

// «Своя игра»: рубрики по 5 вопросов от лёгкого к трудному (100…500 очков).
// Генерируется отдельно и только когда учитель её открыл: так не тратим
// лишние токены на тех, кому она не нужна.
export const jeopardySchema = z.object({
  categories: z
    .array(
      z.object({
        title: text,
        questions: z.array(z.object({ question: text, answer: text })).length(5),
      }),
    )
    .min(3)
    .max(5),
});

// «Өз ойын», как она хранится: вопросы могут быть с картинками
export const jeopardyStoredSchema = z.object({
  categories: z
    .array(
      z.object({
        title: text,
        questions: z.array(z.object({ question: text, answer: text, image: imageSchema.optional() })).length(5),
      }),
    )
    .min(limits.jeopardy[0])
    .max(limits.jeopardy[1]),
});

// Тексты слайдов-заготовок, которые учитель поменял в конструкторе.
// Раздела нет — на слайде текст-подсказка по умолчанию (src/slides/deck.ts).
// Пустые строки разрешены: это заготовки, учитель может дописать их в PowerPoint.
const line = z.string().max(400);
const lines = z.array(line).min(limits.deckLines[0]).max(limits.deckLines[1]);
export const deckSchema = z
  .object({
    goals: z.object({ title: line, items: z.array(z.object({ title: line, body: line })).length(3) }),
    plan: z.object({ title: line, steps: z.array(z.object({ name: line, time: line })).length(4) }),
    textImage: z.object({ title: line, bullets: lines }),
    bigImage: z.object({ caption: line }),
    compare: z.object({ title: line, left: line, right: line, leftLines: lines, rightLines: lines }),
    numbers: z.object({ title: line, items: z.array(z.object({ value: line, caption: line })).length(3) }),
    table: z.object({
      title: line,
      columns: z.array(line).min(limits.tableColumns[0]).max(limits.tableColumns[1]),
      rows: z.array(z.array(line)).min(limits.tableRows[0]).max(limits.tableRows[1]),
    }),
    chart: z.object({
      title: line,
      items: z
        .array(z.object({ label: line, value: z.number().min(0).max(1e9) }))
        .min(limits.chartItems[0])
        .max(limits.chartItems[1]),
    }),
    think: z.object({ title: line, question: line, hint: line }),
    task: z.object({ title: line, name: line, lines, criteriaTitle: line, criteria: z.array(line).length(3) }),
    reflection: z.object({ title: line, items: z.array(line).length(3) }),
    homework: z.object({ title: line, lines, thanks: line }),
  })
  .partial();

export const topicPackageSchema = packageContentSchema.extend({
  subject: subjectSchema,
  quiz: z.array(quizItemSchema).min(limits.quiz[0]).max(limits.quiz[1]),
  /** Версия схемы: если поменяем структуру, старые сохранённые пакеты можно будет распознать */
  schemaVersion: z.literal(2),
  id: z.string(),
  topic: text,
  grade: z.number().int().min(1).max(11),
  language: languageSchema,
  /** Код цели обучения из программы РК, например "7.2.1.1" */
  curriculumCode: z.string().optional(),
  /** ai — сгенерировано, demo — подставлен пример, потому что нет ключа AI */
  source: z.enum(["ai", "demo"]),
  createdAt: z.string(),
  updatedAt: z.string(),
  jeopardy: jeopardyStoredSchema.optional(),
  /** Выбранный шаблон презентации; если нет — подбирается по предмету */
  templateId: z.string().optional(),
  /** Тексты слайдов-заготовок из конструктора */
  deck: deckSchema.optional(),
});

export type Language = z.infer<typeof languageSchema>;
export type Subject = z.infer<typeof subjectSchema>;
export type Formula = z.infer<typeof formulaSchema>;
export type QuizQuestion = z.infer<typeof quizItemSchema>;
export type QuestionImage = z.infer<typeof imageSchema>;
export type TrueFalseStatement = z.infer<typeof trueFalseSchema>;
export type PackageContent = z.infer<typeof packageContentSchema>;
export type Jeopardy = z.infer<typeof jeopardyStoredSchema>;
export type TopicPackage = z.infer<typeof topicPackageSchema>;
export type Term = TopicPackage["terms"][number];
export type Example = TopicPackage["examples"][number];
export type Deck = Required<z.infer<typeof deckSchema>>;

// Что приходит из формы на главной
export const lessonRequestSchema = z.object({
  topic: z.string().trim().min(2).max(200),
  grade: z.number().int().min(1).max(11),
  language: languageSchema,
  subject: subjectSchema.default("physics"),
});
export type LessonRequest = z.infer<typeof lessonRequestSchema>;
