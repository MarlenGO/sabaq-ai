import { apiError } from "@/lib/api-errors";
import { answerRequestSchema } from "@/types/room";
import { scoreAnswer } from "@/lib/rooms";
import { getRoom, saveAnswer } from "@/lib/storage/rooms";

// POST /api/rooms/:code/answers — ученик ответил на вопрос.
// Правильность проверяет сервер: правильные ответы на телефон заранее не отправляются.
export async function POST(request: Request, ctx: RouteContext<"/api/rooms/[code]/answers">) {
  const { code } = await ctx.params;
  const room = await getRoom(code);
  if (!room) return apiError("roomNotFound", 404);
  if (room.status === "finished") return apiError("teacherFinished", 409);

  const parsed = answerRequestSchema.safeParse(await request.json().catch(() => null));
  const question = parsed.success ? room.questions[parsed.data.index] : undefined;
  if (!parsed.success || !question || parsed.data.choice >= question.options.length) {
    return apiError("badAnswer", 400);
  }

  const { playerId, index, choice, ms } = parsed.data;
  const correct = choice === question.correctIndex;
  const points = scoreAnswer(room.game, correct, ms);
  const saved = await saveAnswer(code, playerId, { index, choice, correct, points });
  if (!saved) return apiError("alreadyAnswered", 409);

  return Response.json({ correct, correctIndex: question.correctIndex, explanation: question.explanation, points });
}
