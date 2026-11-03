import { randomInt } from "node:crypto";
import type { TopicPackage } from "@/types/topic-package";
import {
  QUIZ_SECONDS,
  RACE_SECONDS,
  type Player,
  type PlayerResult,
  type PublicQuestion,
  type PublicRoom,
  type QuestionStat,
  type RaceStudentView,
  type RaceTeacherView,
  type Room,
  type RoomGame,
  type RoomQuestion,
} from "@/types/room";

// Правила игры через QR: из чего собрать вопросы, как перемешать их
// для каждого ученика и как считать очки.

export function roomQuestions(lesson: TopicPackage, game: RoomGame): RoomQuestion[] {
  if (game === "true-false") {
    const [yes, no] = lesson.language === "kk" ? ["Шын", "Жалған"] : ["Правда", "Ложь"];
    return lesson.trueFalse.map((s) => ({
      prompt: s.statement,
      options: [yes, no],
      correctIndex: s.isTrue ? 0 : 1,
      explanation: s.explanation || undefined,
    }));
  }
  return lesson.quiz.map((q) => ({
    prompt: q.question,
    options: q.options,
    correctIndex: q.correctIndex,
    explanation: q.explanation || undefined,
    image: q.image,
  }));
}

/** Очки за ответ: в викторине быстрый правильный ответ даёт до 1000, в остальных — 1 за верный */
export function scoreAnswer(game: RoomGame, correct: boolean, ms: number) {
  if (!correct) return 0;
  if (game !== "quiz" && game !== "race") return 1;
  const total = (game === "race" ? RACE_SECONDS : QUIZ_SECONDS) * 1000;
  const left = Math.max(0, total - ms);
  return 500 + Math.round((500 * left) / total);
}

// ——— Перемешивание: у каждого ученика свой порядок ———

/** Случайная перестановка 0…n-1 (тасование Фишера — Йетса) */
function permutation(n: number) {
  const list = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

/** Порядок для нового ученика. «Шын / Жалған» не переставляем — меняется только порядок вопросов */
export function shuffleFor(room: Room): Pick<Player, "order" | "optionOrders"> {
  if (!room.shuffle) return {};
  return {
    order: permutation(room.questions.length),
    optionOrders: room.questions.map((q) =>
      room.game === "true-false" ? q.options.map((_, i) => i) : permutation(q.options.length),
    ),
  };
}

const identity = (n: number) => Array.from({ length: n }, (_, i) => i);
const orderOf = (room: Room, player?: Player | null) => player?.order ?? identity(room.questions.length);
const optionsOf = (room: Room, player: Player | null | undefined, index: number) =>
  player?.optionOrders?.[index] ?? identity(room.questions[index].options.length);

/** Вопросы так, как их видит ученик: без правильных ответов, в его порядке */
export function toPublicRoom(room: Room, player?: Player | null): PublicRoom {
  return {
    code: room.code,
    game: room.game,
    title: room.title,
    language: room.language,
    status: room.status,
    questions: room.game === "race" ? [] : orderOf(room, player).map((i) => publicQuestion(room, i, player)),
  };
}

export function publicQuestion(room: Room, index: number, player?: Player | null): PublicQuestion {
  const { prompt, options, image } = room.questions[index];
  return { prompt, image, options: optionsOf(room, player, index).map((o) => options[o]) };
}

/**
 * Ответ ученика (номер вопроса у него на экране и номер кнопки) → исходный вопрос и вариант.
 * correctShown — где правильный ответ у этого ученика на экране.
 */
export function resolveAnswer(room: Room, player: Player, position: number, shownChoice: number) {
  const index = orderOf(room, player)[position];
  if (index === undefined) return null;
  const options = optionsOf(room, player, index);
  const question = room.questions[index];
  if (shownChoice >= options.length) return null;
  return {
    index,
    question,
    choice: shownChoice < 0 ? -1 : options[shownChoice],
    correctShown: options.indexOf(question.correctIndex),
  };
}

// ——— Итоги ———

export function toResult(player: Player): PlayerResult {
  return {
    id: player.id,
    name: player.name,
    answered: player.answers.length,
    correct: player.answers.filter((a) => a.correct).length,
    points: player.answers.reduce((sum, a) => sum + a.points, 0),
  };
}

export function sortResults(results: PlayerResult[]) {
  return [...results].sort((a, b) => b.points - a.points || b.correct - a.correct || a.name.localeCompare(b.name));
}

/** Сколько учеников ответили на каждый вопрос верно и какой неверный ответ выбирали чаще */
export function questionStats(room: Room, players: Player[]): QuestionStat[] {
  return room.questions.map((question, index) => {
    const answers = players.flatMap((p) => p.answers.filter((a) => a.index === index));
    const wrong = new Map<number, number>();
    for (const a of answers) if (!a.correct && a.choice >= 0) wrong.set(a.choice, (wrong.get(a.choice) ?? 0) + 1);
    const [commonWrong] = [...wrong.entries()].sort((a, b) => b[1] - a[1]);
    return {
      index,
      prompt: question.prompt,
      answered: answers.length,
      correct: answers.filter((a) => a.correct).length,
      commonWrong: commonWrong && question.options[commonWrong[0]],
    };
  });
}

// ——— «Жарыс» ———

function remainingMs(room: Room) {
  const startedAt = room.live?.startedAt;
  if (room.live?.phase !== "question" || !startedAt) return 0;
  return Math.max(0, RACE_SECONDS * 1000 - (Date.now() - Date.parse(startedAt)));
}

const pointsOf = (player: Player) => player.answers.reduce((sum, a) => sum + a.points, 0);

/** Экран учителя: вопрос, сколько ответили, а после «показать ответ» — правильный и распределение */
export function raceForTeacher(room: Room, players: Player[]): RaceTeacherView | undefined {
  const live = room.live;
  if (!live) return undefined;
  const question = room.questions[live.index];
  const shown = live.phase === "reveal" || live.phase === "finished";
  const answers = players.flatMap((p) => p.answers.filter((a) => a.index === live.index));
  return {
    phase: live.phase,
    index: live.index,
    total: room.questions.length,
    remainingMs: remainingMs(room),
    players: players.map((p) => p.name),
    question: live.phase === "lobby" ? undefined : publicQuestion(room, live.index),
    answered: answers.length,
    correctIndex: shown ? question.correctIndex : undefined,
    counts: shown ? question.options.map((_, i) => answers.filter((a) => a.choice === i).length) : undefined,
  };
}

/** Телефон ученика: текущий вопрос, его ответ, а после показа — верно ли и место в рейтинге */
export function raceForStudent(room: Room, player: Player | null, players: Player[]): RaceStudentView | undefined {
  const live = room.live;
  if (!live) return undefined;
  const shown = live.phase === "reveal" || live.phase === "finished";
  const mine = player?.answers.find((a) => a.index === live.index);
  const ranking = [...players].sort((a, b) => pointsOf(b) - pointsOf(a));
  const rank = player ? ranking.findIndex((p) => p.id === player.id) + 1 : 0;
  return {
    phase: live.phase,
    index: live.index,
    total: room.questions.length,
    remainingMs: remainingMs(room),
    question: live.phase === "question" || live.phase === "reveal" ? publicQuestion(room, live.index) : undefined,
    answered: Boolean(mine),
    correctIndex: shown ? room.questions[live.index].correctIndex : undefined,
    lastPoints: shown && mine ? mine.points : undefined,
    lastCorrect: shown && mine ? mine.correct : undefined,
    points: player ? pointsOf(player) : 0,
    rank: rank > 0 ? rank : undefined,
    players: players.length || undefined,
  };
}
