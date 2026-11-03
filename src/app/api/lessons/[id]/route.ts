import { apiError } from "@/lib/api-errors";
import { topicPackageSchema } from "@/types/topic-package";
import { getLesson, saveLesson } from "@/lib/storage/lessons";

export async function GET(_request: Request, ctx: RouteContext<"/api/lessons/[id]">) {
  const { id } = await ctx.params;
  const lesson = await getLesson(id);
  if (!lesson) return apiError("lessonNotFound", 404);
  return Response.json(lesson);
}

// PUT /api/lessons/:id — сохранить правки из конструктора
export async function PUT(request: Request, ctx: RouteContext<"/api/lessons/[id]">) {
  const { id } = await ctx.params;
  const existing = await getLesson(id);
  if (!existing) return apiError("lessonNotFound", 404);

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
