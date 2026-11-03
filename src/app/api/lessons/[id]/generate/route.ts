import { aiRequestSchema } from "@/types/ai";
import { generatePart } from "@/lib/ai/generate";
import { hasAiKey } from "@/lib/ai/gemini";
import { apiError, errorResponse } from "@/lib/api-errors";
import { currentUser } from "@/lib/auth";
import { canWrite, getLessonFor } from "@/lib/storage/lessons";
import { hasQuota, tracked } from "@/lib/storage/usage";

// POST /api/lessons/:id/generate — кнопка «AI» в конструкторе: одна часть урока
// (слайд, вопрос теста, утверждение, вопрос «Өз ойын») или все слайды сразу.
// Сервер только пишет текст, а сохраняет его страница урока, как любую правку
// учителя: так работает «Болдырмау».
export async function POST(request: Request, ctx: RouteContext<"/api/lessons/[id]/generate">) {
  const user = await currentUser();
  if (!user) return apiError("unauthorized", 401);
  const { id } = await ctx.params;
  const record = await getLessonFor(user, id);
  if (!record) return apiError("lessonNotFound", 404);
  if (!canWrite(user, record)) return apiError("forbidden", 403);
  if (!hasAiKey()) return apiError("noKey", 503);
  if (!(await hasQuota(user))) return apiError("dailyLimit", 429);

  const parsed = aiRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError("badRequest", 400);

  try {
    const value = await tracked(user.id, parsed.data.part === "deck" ? "deck" : "part", () =>
      generatePart(record.lesson, parsed.data),
    );
    return Response.json({ value });
  } catch (error) {
    return await errorResponse(error);
  }
}
