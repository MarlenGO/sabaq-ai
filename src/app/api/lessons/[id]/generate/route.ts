import { aiRequestSchema } from "@/types/ai";
import { generatePart } from "@/lib/ai/generate";
import { hasAiKey } from "@/lib/ai/gemini";
import { apiError, errorResponse } from "@/lib/api-errors";
import { getLesson } from "@/lib/storage/lessons";

// POST /api/lessons/:id/generate — кнопка «AI» в конструкторе: одна часть урока
// (слайд, вопрос теста, утверждение, вопрос «Өз ойын»). Сервер только пишет текст,
// а сохраняет его страница урока, как любую правку учителя: так работает «Болдырмау».
export async function POST(request: Request, ctx: RouteContext<"/api/lessons/[id]/generate">) {
  const { id } = await ctx.params;
  const lesson = await getLesson(id);
  if (!lesson) return apiError("lessonNotFound", 404);
  if (!hasAiKey()) return apiError("noKey", 503);

  const parsed = aiRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError("badRequest", 400);

  try {
    return Response.json({ value: await generatePart(lesson, parsed.data) });
  } catch (error) {
    return await errorResponse(error);
  }
}
