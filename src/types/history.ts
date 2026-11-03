import { z } from "zod";
import type { Language, Subject } from "./topic-package";

// История: что учитель сделал и когда.
// Уроки и QR-игры уже хранятся сами по себе, а для того, что больше
// нигде не остаётся (скачанный PPTX, игра на экране), ведём журнал событий.

export const gameIdSchema = z.enum(["test", "quiz", "jeopardy", "true-false", "race"]);

export const activitySchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("pptx"), at: z.string(), lessonId: z.string(), templateId: z.string() }),
  /** Игра в режиме «Экранда» (QR-игры видны по своим комнатам) */
  z.object({ type: z.literal("game"), at: z.string(), lessonId: z.string(), game: gameIdSchema }),
]);
export type Activity = z.infer<typeof activitySchema>;

/** Что присылает браузер: время ставит сервер */
export const activityRequestSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("pptx"), lessonId: z.string(), templateId: z.string().max(40) }),
  z.object({ type: z.literal("game"), lessonId: z.string(), game: gameIdSchema }),
]);

interface Base {
  at: string;
  lessonId: string;
  topic: string;
  grade: number;
}

export type HistoryEntry =
  | (Base & { kind: "lesson"; subject: Subject; language: Language; demo: boolean })
  | (Base & { kind: "pptx"; templateId: string })
  | (Base & { kind: "game"; game: z.infer<typeof gameIdSchema>; mode: "screen" })
  | (Base & {
      kind: "game";
      game: z.infer<typeof gameIdSchema>;
      mode: "qr";
      roomCode: string;
      players: number;
      total: number;
      /** Средний процент правильных ответов */
      averagePercent: number;
    });
