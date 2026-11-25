import { z } from "zod";
import { languageSchema, subjectSchema, type Language, type Subject } from "./topic-package";
import { docKindSchema, type DocKind } from "./documents";

// История: что учитель сделал и когда.
// Уроки и QR-игры уже хранятся сами по себе, а для того, что больше
// нигде не остаётся (скачанный PPTX, игра на экране, документ), ведём журнал событий.

export const gameIdSchema = z.enum(["test", "quiz", "jeopardy", "true-false", "race"]);

export const activitySchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("pptx"), at: z.string(), lessonId: z.string(), templateId: z.string() }),
  /** Игра в режиме «Экранда» (QR-игры видны по своим комнатам) */
  z.object({ type: z.literal("game"), at: z.string(), lessonId: z.string(), game: gameIdSchema }),
  /** Документ (ҚМЖ, тест, БЖБ): сам текст лежит в общем кэше AI, здесь — по чему его найти */
  z.object({
    type: z.literal("document"),
    at: z.string(),
    docKind: docKindSchema,
    subject: subjectSchema,
    topic: z.string(),
    grade: z.number(),
    language: languageSchema,
    count: z.number(),
  }),
]);
export type Activity = z.infer<typeof activitySchema>;

/** Что присылает браузер: время ставит сервер */
export const activityRequestSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("pptx"), lessonId: z.string(), templateId: z.string().max(40) }),
  z.object({ type: z.literal("game"), lessonId: z.string(), game: gameIdSchema }),
]);

/**
 * Что удалить из истории (галочки): уроки (вместе с их QR-играми и событиями),
 * QR-игры по коду и события журнала по номеру. Проверка формата не даёт
 * подставить в запрос к базе чужие условия.
 */
export const historySelectionSchema = z.object({
  lessons: z.array(z.string().regex(/^[a-f0-9]{12}$/)).max(2000).default([]),
  rooms: z.array(z.string().regex(/^\d{6}$/)).max(2000).default([]),
  activity: z.array(z.number().int().positive()).max(2000).default([]),
});
export type HistorySelection = z.infer<typeof historySelectionSchema>;

/** Ссылки строк вида «lesson:id», «room:код», «activity:номер» → что удалить */
export function toSelection(refs: Iterable<string>): HistorySelection {
  const sel: HistorySelection = { lessons: [], rooms: [], activity: [] };
  for (const ref of refs) {
    const [kind, id] = ref.split(":");
    if (kind === "lesson") sel.lessons.push(id);
    else if (kind === "room") sel.rooms.push(id);
    else if (kind === "activity") sel.activity.push(Number(id));
  }
  return sel;
}

interface Base {
  at: string;
  topic: string;
  grade: number;
  /** Что удалить, если отметить галочкой: «lesson:id», «room:код», «activity:номер» */
  ref: string;
}

export type HistoryEntry =
  | (Base & { kind: "lesson"; lessonId: string; subject: Subject; language: Language; demo: boolean })
  | (Base & { kind: "pptx"; lessonId: string; templateId: string })
  | (Base & { kind: "game"; lessonId: string; game: z.infer<typeof gameIdSchema>; mode: "screen" })
  | (Base & {
      kind: "game";
      lessonId: string;
      game: z.infer<typeof gameIdSchema>;
      mode: "qr";
      roomCode: string;
      players: number;
      total: number;
      /** Средний процент правильных ответов */
      averagePercent: number;
    })
  | (Base & { kind: "document"; docKind: DocKind; subject: Subject; language: Language; count: number });
