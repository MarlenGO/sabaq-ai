import { z } from "zod";
import { lessonRequestSchema } from "./topic-package";

// Документы учителя для печати и Word: ҚМЖ (краткосрочный план), тест, БЖБ (СОР).
// Конструктора у них нет: AI пишет содержание, страница показывает предпросмотр,
// а править учитель может уже в Word. Схемы — для Gemini и для проверки ответа.

export const docKindSchema = z.enum(["kmzh", "test", "bzhb"]);
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

export const docSchemas = { kmzh: kmzhSchema, test: testDocSchema, bzhb: bzhbSchema } satisfies Record<DocKind, z.ZodType>;

export type DocData = { kmzh: z.infer<typeof kmzhSchema>; test: z.infer<typeof testDocSchema>; bzhb: z.infer<typeof bzhbSchema> };

/** Сколько вопросов можно выбрать для теста */
export const testCounts = [10, 15, 20, 25, 30] as const;

export const documentRequestSchema = lessonRequestSchema.pick({ topic: true, grade: true, language: true, subject: true }).extend({
  kind: docKindSchema,
  /** Количество вопросов — только для теста */
  count: z.number().int().min(5).max(30).default(15),
});
export type DocumentRequest = z.infer<typeof documentRequestSchema>;
