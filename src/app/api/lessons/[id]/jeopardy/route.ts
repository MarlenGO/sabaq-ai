import { generateJeopardy } from "@/lib/ai/generate";
import { hasAiKey } from "@/lib/ai/gemini";
import { apiError, errorResponse } from "@/lib/api-errors";
import { currentUser } from "@/lib/auth";
import { canWrite, getLessonFor, saveLesson } from "@/lib/storage/lessons";
import { hasQuota, tracked } from "@/lib/storage/usage";

// POST /api/lessons/:id/jeopardy — сгенерировать вопросы для «Своей игры».
// Отдельный запрос, потому что это ~25 вопросов, и нужны они не каждому уроку.
export async function POST(_request: Request, ctx: RouteContext<"/api/lessons/[id]/jeopardy">) {
  const user = await currentUser();
  if (!user) return apiError("unauthorized", 401);
  const { id } = await ctx.params;
  const record = await getLessonFor(user, id);
  if (!record) return apiError("lessonNotFound", 404);
  if (!canWrite(user, record)) return apiError("forbidden", 403);
  const lesson = record.lesson;

  // AI нужен только для настоящего урока; пустой проект и демо обходятся без него
  const usesAi = hasAiKey() && lesson.source === "ai";
  if (usesAi && !(await hasQuota(user))) return apiError("dailyLimit", 429);

  try {
    const jeopardy = usesAi ? await tracked(user.id, "jeopardy", () => generateJeopardy(lesson)) : await generateJeopardy(lesson);
    const updated = { ...lesson, jeopardy, updatedAt: new Date().toISOString() };
    await saveLesson(updated);
    return Response.json({ jeopardy, updatedAt: updated.updatedAt });
  } catch (error) {
    return await errorResponse(error);
  }
}
