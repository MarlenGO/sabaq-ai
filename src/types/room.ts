import { z } from "zod";
import { languageSchema } from "./topic-package";

// Игровая комната для режима «через QR». Учитель запускает игру —
// создаётся комната с кодом из 6 цифр и копией вопросов (чтобы правки
// в конструкторе не ломали идущую игру). Ученики заходят по коду
// и отвечают каждый в своём темпе, а учитель видит таблицу результатов.

export const roomGameSchema = z.enum(["test", "quiz", "true-false"]);
export type RoomGame = z.infer<typeof roomGameSchema>;

export const roomQuestionSchema = z.object({
  prompt: z.string(),
  options: z.array(z.string()).min(2).max(4),
  correctIndex: z.number().int(),
  explanation: z.string().optional(),
});

export const roomSchema = z.object({
  code: z.string().regex(/^\d{6}$/),
  lessonId: z.string(),
  game: roomGameSchema,
  title: z.string(),
  language: languageSchema,
  questions: z.array(roomQuestionSchema).min(1),
  status: z.enum(["open", "finished"]),
  createdAt: z.string(),
});

export const answerSchema = z.object({
  index: z.number().int(),
  choice: z.number().int(),
  correct: z.boolean(),
  points: z.number().int(),
});

export const playerSchema = z.object({
  id: z.string().regex(/^[a-f0-9]{16}$/),
  name: z.string(),
  joinedAt: z.string(),
  answers: z.array(answerSchema),
});

export type RoomQuestion = z.infer<typeof roomQuestionSchema>;
export type Room = z.infer<typeof roomSchema>;
export type Player = z.infer<typeof playerSchema>;

/** Что видит ученик: вопросы без правильных ответов */
export type PublicQuestion = Omit<RoomQuestion, "correctIndex" | "explanation">;
export interface PublicRoom {
  code: string;
  game: RoomGame;
  title: string;
  language: Room["language"];
  status: Room["status"];
  questions: PublicQuestion[];
}

/** Строка таблицы у учителя */
export interface PlayerResult {
  id: string;
  name: string;
  answered: number;
  correct: number;
  points: number;
}

export const QUIZ_SECONDS = 20;

export const joinSchema = z.object({ name: z.string().trim().min(1).max(30) });
export const answerRequestSchema = z.object({
  playerId: z.string(),
  index: z.number().int().min(0),
  /** -1 — не успел ответить (время в викторине вышло) */
  choice: z.number().int().min(-1),
  /** Сколько миллисекунд ученик думал — для очков в викторине */
  ms: z.number().int().min(0).max(10 * 60 * 1000),
});
