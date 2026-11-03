import { z } from "zod";

// Запрос «напиши заново одну часть урока» — кнопка «AI» в конструкторе.
// Части слайдов называются как виды слайдов (SlideKind), плюс один вопрос
// теста, одно утверждение и один вопрос «Өз ойын».

export const aiPartSchema = z.enum([
  "definition",
  "facts",
  "examples",
  "terms",
  "title",
  "goals",
  "plan",
  "bullets",
  "text-image",
  "big-image",
  "compare",
  "numbers",
  "table",
  "chart",
  "think",
  "task",
  "reflection",
  "homework",
  "quiz",
  "trueFalse",
  "jeopardy",
  // Все слайды-заготовки текущего вида презентации одним запросом
  "deck",
]);

export const aiRequestSchema = z.object({
  part: aiPartSchema,
  /** id слайда в виде презентации — чтобы AI знал, о чём слайд («Жетістіктер» в отчёте и т.п.) */
  slide: z.string().max(40).optional(),
  /** Что уже есть рядом — чтобы AI не повторялся (другие вопросы теста и т.п.) */
  avoid: z.array(z.string().max(500)).max(40).default([]),
  /** Для «Өз ойын»: название темы на табло и цена вопроса (сложность) */
  category: z.string().max(200).optional(),
  points: z.number().int().min(100).max(500).optional(),
});

export type AiPart = z.infer<typeof aiPartSchema>;
export type AiRequest = z.input<typeof aiRequestSchema>;
