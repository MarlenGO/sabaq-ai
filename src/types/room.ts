import { z } from "zod";
import { imageSchema, languageSchema } from "./topic-package";

// Игровая комната для режима «через QR». Учитель запускает игру —
// создаётся комната с кодом из 6 цифр и копией вопросов (чтобы правки
// в конструкторе не ломали идущую игру). Ученики заходят по коду
// и отвечают каждый в своём темпе, а учитель видит таблицу результатов.
// «Жарыс» (race) — как Kahoot: все отвечают на один вопрос одновременно,
// темп задаёт учитель (см. live).

export const roomGameSchema = z.enum(["test", "quiz", "true-false", "race"]);
export type RoomGame = z.infer<typeof roomGameSchema>;

export const roomQuestionSchema = z.object({
  prompt: z.string(),
  options: z.array(z.string()).min(2).max(4),
  correctIndex: z.number().int(),
  explanation: z.string().optional(),
  image: imageSchema.optional(),
});

/** Ход «Жарыса»: какой вопрос на экране и что сейчас происходит */
export const liveSchema = z.object({
  phase: z.enum(["lobby", "question", "reveal", "finished"]),
  index: z.number().int().min(0),
  /** Когда показан текущий вопрос — от этого считаются время и очки */
  startedAt: z.string().optional(),
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
  /** Каждому ученику свой порядок вопросов и вариантов, чтобы не списывали */
  shuffle: z.boolean().optional(),
  live: liveSchema.optional(),
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
  /** При перемешивании: на k-м месте у ученика вопрос order[k] */
  order: z.array(z.number().int()).optional(),
  /** optionOrders[вопрос][j] — какой исходный вариант ученик видит j-м */
  optionOrders: z.array(z.array(z.number().int())).optional(),
});

export type RoomQuestion = z.infer<typeof roomQuestionSchema>;
export type Room = z.infer<typeof roomSchema>;
export type Player = z.infer<typeof playerSchema>;
export type Live = z.infer<typeof liveSchema>;

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
/** Время на вопрос в «Жарысе» */
export const RACE_SECONDS = 20;

export interface RaceTeacherView {
  phase: Live["phase"];
  index: number;
  total: number;
  /** Сколько осталось времени на вопрос (считает сервер, чтобы часы у всех совпадали) */
  remainingMs: number;
  /** Имена вошедших — для экрана ожидания */
  players: string[];
  question?: PublicQuestion;
  answered: number;
  correctIndex?: number;
  /** Сколько учеников выбрали каждый вариант (после показа ответа) */
  counts?: number[];
}

export interface RaceStudentView {
  phase: Live["phase"];
  index: number;
  total: number;
  remainingMs: number;
  question?: PublicQuestion;
  /** Ответил ли ученик на текущий вопрос */
  answered: boolean;
  correctIndex?: number;
  lastPoints?: number;
  lastCorrect?: boolean;
  points: number;
  rank?: number;
  players?: number;
}

/** Статистика по одному вопросу: сколько ответили и что выбирали */
export interface QuestionStat {
  index: number;
  prompt: string;
  answered: number;
  correct: number;
  /** Самый частый неверный вариант (текст) — подсказка учителю, в чём путаница */
  commonWrong?: string;
}

export const joinSchema = z.object({ name: z.string().trim().min(1).max(30) });
export const answerRequestSchema = z.object({
  playerId: z.string(),
  index: z.number().int().min(0),
  /** -1 — не успел ответить (время в викторине вышло) */
  choice: z.number().int().min(-1),
  /** Сколько миллисекунд ученик думал — для очков в викторине */
  ms: z.number().int().min(0).max(10 * 60 * 1000),
});
