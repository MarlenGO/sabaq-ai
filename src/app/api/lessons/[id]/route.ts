import { topicPackageSchema } from "@/types/topic-package";
import { getLesson, saveLesson } from "@/lib/storage/lessons";

export async function GET(_request: Request, ctx: RouteContext<"/api/lessons/[id]">) {
  const { id } = await ctx.params;
  const lesson = await getLesson(id);
  if (!lesson) return Response.json({ error: "Сабақ табылмады." }, { status: 404 });
  return Response.json(lesson);
}

// PUT /api/lessons/:id — сохранить правки из конструктора
export async function PUT(request: Request, ctx: RouteContext<"/api/lessons/[id]">) {
  const { id } = await ctx.params;
  const existing = await getLesson(id);
  if (!existing) return Response.json({ error: "Сабақ табылмады." }, { status: 404 });

  const parsed = topicPackageSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Деректер толық емес.", issues: parsed.error.issues.slice(0, 5) }, { status: 400 });
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
