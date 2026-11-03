import { apiError } from "@/lib/api-errors";
import { currentUser } from "@/lib/auth";
import { topicPackageSchema } from "@/types/topic-package";
import { canWrite, getLessonFor, saveLesson } from "@/lib/storage/lessons";

export async function GET(_request: Request, ctx: RouteContext<"/api/lessons/[id]">) {
  const user = await currentUser();
  if (!user) return apiError("unauthorized", 401);
  const { id } = await ctx.params;
  const record = await getLessonFor(user, id);
  if (!record) return apiError("lessonNotFound", 404);
  return Response.json(record.lesson);
}

// PUT /api/lessons/:id — сохранить правки из конструктора
export async function PUT(request: Request, ctx: RouteContext<"/api/lessons/[id]">) {
  const user = await currentUser();
  if (!user) return apiError("unauthorized", 401);
  const { id } = await ctx.params;
  const record = await getLessonFor(user, id);
  if (!record) return apiError("lessonNotFound", 404);
  if (!canWrite(user, record)) return apiError("forbidden", 403);
  const existing = record.lesson;

  const parsed = topicPackageSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return apiError("incomplete", 400, { issues: parsed.error.issues.slice(0, 5) });
  }

  // id, источник и дату создания из браузера не принимаем.
  // «Өз ойын» могла сгенерироваться, пока в браузере шла правка, — не теряем её.
  const lesson = {
    ...parsed.data,
    jeopardy: parsed.data.jeopardy ?? existing.jeopardy,
    id,
    source: existing.source,
    createdAt: existing.createdAt,
    updatedAt: new Date().toISOString(),
  };
  await saveLesson(lesson);
  return Response.json({ updatedAt: lesson.updatedAt });
}
