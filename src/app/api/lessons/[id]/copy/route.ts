import { apiError } from "@/lib/api-errors";
import { currentUser } from "@/lib/auth";
import { createLesson, getLessonFor, newLessonId } from "@/lib/storage/lessons";

// POST /api/lessons/:id/copy — забрать урок из библиотеки себе: дальше это своя копия
export async function POST(_request: Request, ctx: RouteContext<"/api/lessons/[id]/copy">) {
  const user = await currentUser();
  if (!user) return apiError("unauthorized", 401);
  const { id } = await ctx.params;
  const record = await getLessonFor(user, id);
  if (!record) return apiError("lessonNotFound", 404);

  const now = new Date().toISOString();
  const copy = { ...record.lesson, id: newLessonId(), createdAt: now, updatedAt: now };
  await createLesson(copy, user.id);
  return Response.json({ id: copy.id });
}
