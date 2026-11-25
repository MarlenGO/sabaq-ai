import { z } from "zod";
import { languageSchema, subjectSchema } from "@/types/topic-package";

// КТП (күнтізбелік-тақырыптық жоспар) — план уроков на год, который учитель загрузил
// из своего Word или Excel. Из каждой строки одной кнопкой делается ҚМЖ.

export const lessonKindSchema = z.enum(["lesson", "bzhb", "tzhb"]);

export const planLessonSchema = z.object({
  id: z.string().min(1).max(40),
  /** Тоқсан 1–4; 0 — в файле не указана */
  quarter: z.number().int().min(0).max(4),
  /** Дата как в файле («12.09», «12.09.2026») или пусто */
  date: z.string().max(40),
  section: z.string().max(400),
  topic: z.string().max(400),
  /** Оқу мақсаты с кодом: «8.3.2.17 – …» */
  objective: z.string().max(2000),
  /** Урок, БЖБ или ТЖБ: у БЖБ/ТЖБ кнопки ҚМЖ нет */
  kind: lessonKindSchema,
  /** Темы нет в тексте файла дословно — AI мог ошибиться, просим проверить */
  unsure: z.boolean().optional(),
  /** Когда по уроку сделан ҚМЖ */
  kmzhAt: z.string().optional(),
});
export type PlanLesson = z.infer<typeof planLessonSchema>;

/** То, что учитель сохраняет и меняет: название, предмет, класс, язык и уроки */
export const planInputSchema = z.object({
  title: z.string().trim().min(1).max(120),
  subject: subjectSchema,
  grade: z.number().int().min(1).max(11),
  language: languageSchema,
  lessons: z.array(planLessonSchema).max(250),
});
export type PlanInput = z.infer<typeof planInputSchema>;

export interface Plan extends PlanInput {
  id: string;
  updatedAt: string;
}

// Ответ Gemini при разборе файла. Неизвестное — 0 или пустая строка (не null:
// так проще и схеме Gemini, и проверке)
export const planAiSchema = z.object({
  subject: subjectSchema,
  /** Класс из файла, 0 — не нашёл */
  grade: z.number().int().min(0).max(11),
  language: languageSchema,
  lessons: z
    .array(
      z.object({
        quarter: z.number().int().min(0).max(4),
        date: z.string(),
        section: z.string(),
        topic: z.string(),
        objective: z.string(),
        kind: lessonKindSchema,
      }),
    )
    .min(1),
});
export type PlanAi = z.infer<typeof planAiSchema>;
