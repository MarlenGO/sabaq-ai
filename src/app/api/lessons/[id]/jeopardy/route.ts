import { generateJeopardy } from "@/lib/ai/generate";
import { errorResponse } from "@/lib/api-errors";
import { getLesson, saveLesson } from "@/lib/storage/lessons";

// POST /api/lessons/:id/jeopardy — сгенерировать вопросы для «Своей игры».
// Отдельный запрос, потому что это ~25 вопросов, и нужны они не каждому уроку.
export async function POST(_request: Request, ctx: RouteContext<"/api/lessons/[id]/jeopardy">) {
  const { id } = await ctx.params;
  const lesson = await getLesson(id);
  if (!lesson) return Response.json({ error: "Сабақ табылмады." }, { status: 404 });

  try {
    const jeopardy = await generateJeopardy(lesson);
    const updated = { ...lesson, jeopardy, updatedAt: new Date().toISOString() };
    await saveLesson(updated);
    return Response.json({ jeopardy, updatedAt: updated.updatedAt });
  } catch (error) {
    return errorResponse(error);
  }
}
