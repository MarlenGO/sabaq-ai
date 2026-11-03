import { apiError } from "@/lib/api-errors";
import { answerRequestSchema, RACE_SECONDS } from "@/types/room";
import { resolveAnswer, scoreAnswer } from "@/lib/rooms";
import { getPlayer, getRoom, saveAnswer } from "@/lib/storage/rooms";

// Небольшой запас к таймеру «Жарыса»: ответ мог быть отправлен в последнюю секунду
const RACE_GRACE_MS = 2000;

// POST /api/rooms/:code/answers — ученик ответил на вопрос.
// Правильность проверяет сервер: правильные ответы на телефон заранее не отправляются.
export async function POST(request: Request, ctx: RouteContext<"/api/rooms/[code]/answers">) {
  const { code } = await ctx.params;
  const room = await getRoom(code);
  if (!room) return apiError("roomNotFound", 404);
  if (room.status === "finished") return apiError("teacherFinished", 409);

  const parsed = answerRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError("badAnswer", 400);
  const player = await getPlayer(code, parsed.data.playerId);
  if (!player) return apiError("badAnswer", 400);

  // «Жарыс»: отвечать можно только на вопрос, который сейчас на экране, и пока идёт время
  if (room.live) {
    const { phase, index, startedAt } = room.live;
    if (phase !== "question" || parsed.data.index !== index || !startedAt) return apiError("badAnswer", 409);
    const question = room.questions[index];
    const { choice } = parsed.data;
    if (choice < 0 || choice >= question.options.length) return apiError("badAnswer", 400);
    const ms = Date.now() - Date.parse(startedAt);
    if (ms > RACE_SECONDS * 1000 + RACE_GRACE_MS) return apiError("timeUp", 409);
    const correct = choice === question.correctIndex;
    const saved = await saveAnswer(code, player.id, { index, choice, correct, points: scoreAnswer("race", correct, ms) });
    if (!saved) return apiError("alreadyAnswered", 409);
    // Верно или нет — ученик узнает вместе со всеми, когда учитель покажет ответ
    return Response.json({ received: true });
  }

  // Остальные игры: номер вопроса и кнопки — как у ученика на экране, переводим в исходные
  const answer = resolveAnswer(room, player, parsed.data.index, parsed.data.choice);
  if (!answer) return apiError("badAnswer", 400);

  const correct = answer.choice === answer.question.correctIndex;
  const points = scoreAnswer(room.game, correct, parsed.data.ms);
  const saved = await saveAnswer(code, player.id, { index: answer.index, choice: answer.choice, correct, points });
  if (!saved) return apiError("alreadyAnswered", 409);

  return Response.json({ correct, correctIndex: answer.correctShown, explanation: answer.question.explanation, points });
}
