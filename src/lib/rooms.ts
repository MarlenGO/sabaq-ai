import type { TopicPackage } from "@/types/topic-package";
import { QUIZ_SECONDS, type Player, type PlayerResult, type PublicRoom, type Room, type RoomGame, type RoomQuestion } from "@/types/room";

// Правила игры через QR: из чего собрать вопросы и как считать очки.

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
  if (game !== "quiz") return 1;
  const left = Math.max(0, QUIZ_SECONDS * 1000 - ms);
  return 500 + Math.round((500 * left) / (QUIZ_SECONDS * 1000));
}

export function toPublicRoom(room: Room): PublicRoom {
  return {
    code: room.code,
    game: room.game,
    title: room.title,
    language: room.language,
    status: room.status,
    questions: room.questions.map(({ prompt, options, image }) => ({ prompt, options, image })),
  };
}

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
