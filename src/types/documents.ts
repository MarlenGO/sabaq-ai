import { z } from "zod";
import { lessonRequestSchema } from "./topic-package";

// Документы учителя для печати и Word: ҚМЖ (краткосрочный план), тест, БЖБ (СОР).
// Конструктора у них нет: AI пишет содержание, страница показывает предпросмотр,
// а править учитель может уже в Word. Схемы — для Gemini и для проверки ответа.

export const docKindSchema = z.enum(["kmzh", "test", "bzhb", "pisa", "worksheet"]);
export type DocKind = z.infer<typeof docKindSchema>;
export const docKinds = docKindSchema.options;

const line = z.string().max(600);
const block = z.string().max(1500);

/** Одна строка таблицы «Сабақтың барысы» */
const stageSchema = z.object({
  teacher: z.string().max(3500),
  students: z.string().max(2000),
  assessment: z.string().max(1500),
  resources: z.string().max(600),
});

/** Строки ҚМЖ по шаблону учителя — порядок и время фиксированы (45 минут) */
export const kmzhStages = ["org", "start", "newKnowledge", "task1", "task2", "task3", "special", "end"] as const;
export type KmzhStage = (typeof kmzhStages)[number];

/** ҚМЖ по шаблону: шапка из 2 колонок + таблица из 5 колонок с фиксированными строками */
export const kmzhSchema = z.object({
  /** Бөлім — раздел учебной программы */
  section: line,
  /** Оқу бағдарламасына сәйкес оқу мақсаты: «8.3.2.17 – …» */
  learningObjective: line,
  /** Сабақтың мақсаты — 2–3 предложения */
  lessonGoal: block,
  stages: z.object(Object.fromEntries(kmzhStages.map((id) => [id, stageSchema])) as Record<KmzhStage, typeof stageSchema>),
});

/** Тест для печати: вопросы с 4 вариантами + ключ ответов отдельно */
export const testDocSchema = z.object({
  instructions: line,
  questions: z
    .array(
      z.object({
        question: line,
        options: z.array(z.string().max(200)).length(4),
        correct: z.number().int().min(0).max(3),
      }),
    )
    .min(5)
    .max(30),
});

/** БЖБ (суммативное оценивание за раздел): задания с баллами и дескрипторы */
export const bzhbSchema = z.object({
  section: line,
  learningObjectives: z.array(line).min(1).max(4),
  criteria: z.array(line).min(1).max(5),
  thinkingLevels: z.array(z.string().max(120)).min(1).max(3),
  duration: z.string().max(40),
  tasks: z.array(z.object({ text: block, points: z.number().int().min(1).max(10) })).min(2).max(8),
  descriptors: z
    .array(
      z.object({
        task: z.string().max(10),
        descriptor: line,
        points: z.number().int().min(1).max(10),
      }),
    )
    .min(2)
    .max(20),
});

/** Задание PISA: одна жизненная ситуация и 4 вопроса к ней + руководство по оцениванию */
export const pisaSchema = z.object({
  /** Название ситуации: «Велосипедпен мектепке» */
  title: z.string().max(150),
  /** Текст ситуации: факты, числа, при необходимости — данные таблицей в строках */
  situation: z.string().max(3000),
  questions: z
    .array(
      z.object({
        question: block,
        /** Что проверяет вопрос: «Ақпаратты табу», «Түсіндіру», «Бағалау және негіздеу» */
        skill: z.string().max(120),
        answer: block,
        /** Как ставить баллы: полный / частичный / нет ответа */
        scoring: block,
        points: z.number().int().min(1).max(3),
      }),
    )
    .length(4),
});

/**
 * Жұмыс парағы — раздаточный лист для печати, только на казахском: пять заданий
 * разного вида по теме и ответы для учителя на отдельной странице.
 * Кроссворд раскладывает код (documents/crossword.ts), AI даёт только слова и подсказки.
 */
export const worksheetSchema = z.object({
  /** Сәйкестендіру: термин — анықтама */
  matching: z.array(z.object({ term: z.string().max(80), definition: z.string().max(250) })).min(4).max(8),
  /** Сөзжұмбақ: одно слово без пробелов и подсказка-вопрос */
  crossword: z.array(z.object({ word: z.string().max(20), clue: z.string().max(200) })).min(5).max(10),
  /** Бос орынды толтыр: предложение с «____» и пропущенное слово */
  gaps: z.array(z.object({ sentence: z.string().max(300), answer: z.string().max(60) })).min(4).max(8),
  /** Дұрыс па, бұрыс па? */
  trueFalse: z.array(z.object({ statement: line, correct: z.boolean() })).min(4).max(8),
  /** Ойлан да жауап бер: вопрос или задача + ответ для учителя */
  questions: z.array(z.object({ question: block, answer: block })).min(2).max(4),
});

export const docSchemas = { kmzh: kmzhSchema, test: testDocSchema, bzhb: bzhbSchema, pisa: pisaSchema, worksheet: worksheetSchema } satisfies Record<DocKind, z.ZodType>;

export type DocData = {
  kmzh: z.infer<typeof kmzhSchema>;
  test: z.infer<typeof testDocSchema>;
  bzhb: z.infer<typeof bzhbSchema>;
  pisa: z.infer<typeof pisaSchema>;
  worksheet: z.infer<typeof worksheetSchema>;
};

/** ҚМЖ: вид плана и тип урока (по умолчанию — полный план, новый материал) */
export const planTypes = ["full", "short", "simple", "sen"] as const;
export const lessonTypes = ["new", "consolidate", "practice", "review"] as const;

/** Сколько вопросов можно выбрать для теста */
export const testCounts = [10, 15, 20, 25, 30] as const;

export const documentRequestSchema = lessonRequestSchema.pick({ topic: true, grade: true, language: true, subject: true }).extend({
  kind: docKindSchema,
  /** Количество вопросов — только для теста */
  count: z.number().int().min(5).max(30).default(15),
  /** Только ҚМЖ: что учитель знает сам. Пустое оқу мақсаты и бөлім предлагает AI */
  section: z.string().trim().max(200).default(""),
  objective: z.string().trim().max(400).default(""),
  textbook: z.string().trim().max(200).default(""),
  /** Апта құндылығы — ценность недели, если в школе она есть */
  value: z.string().trim().max(200).default(""),
  planType: z.enum(planTypes).default("full"),
  lessonType: z.enum(lessonTypes).default("new"),
  /** Число заданий ҚМЖ: 3 (баллы 4 + 6) или 4 (баллы 3 + 4 + 3), всего 10 */
  taskCount: z.union([z.literal(3), z.literal(4)]).default(3),
  /** Открыт заново из «Тарих» — в историю второй раз не пишем */
  again: z.boolean().optional(),
});
export type DocumentRequest = z.infer<typeof documentRequestSchema>;

/** Поля формы слева у сохранённого документа («Менің құжаттарым»): запрос + шапка листа */
export const docFieldsSchema = documentRequestSchema.omit({ kind: true, again: true }).extend({
  teacher: z.string().max(200).default(""),
  school: z.string().max(300).default(""),
  date: z.string().max(60).default(""),
});
export type DocFields = z.infer<typeof docFieldsSchema>;

/** Документ учителя в базе: вид, поля формы и ответ AI (файл Word собирается из этого при скачивании) */
export interface MyDocument {
  id: string;
  kind: DocKind;
  fields: DocFields;
  content: unknown;
  createdAt: string;
  updatedAt: string;
}

/** Строка списка «Менің құжаттарым» — без самого документа, чтобы список грузился быстро */
export type MyDocumentItem = Omit<MyDocument, "fields" | "content"> & {
  subject: DocFields["subject"];
  topic: string;
  grade: number;
  language: DocFields["language"];
};
