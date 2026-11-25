import { apiError, errorResponse } from "@/lib/api-errors";
import { currentUser } from "@/lib/auth";
import { hasQuota, tracked } from "@/lib/storage/usage";
import { fileTypeOf, readPlanFile } from "@/lib/plans/read-file";
import { parsePlan } from "@/lib/plans/parse";

export const maxDuration = 60; // Gemini читает годовой КТП 10–40 секунд

const MAX_BYTES = 5 * 1024 * 1024;

// POST /api/plans/parse — файл КТП (форма с полем file) → черновик плана.
// Ничего не сохраняет: учитель сначала проверяет уроки и жмёт «Сақтау» (POST /api/plans).
export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return apiError("unauthorized", 401);
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return apiError("badRequest", 400);
  const type = fileTypeOf(file.name);
  if (!type) return apiError("planFileType", 400);
  if (file.size > MAX_BYTES) return apiError("planFileBig", 400);

  let text: string;
  try {
    text = readPlanFile(type, await file.arrayBuffer());
  } catch {
    // Не ZIP или испорченный файл (например, .doc, переименованный в .docx)
    return apiError("planFileType", 400);
  }
  if (text.length < 20) return apiError("planFileEmpty", 400);
  if (!(await hasQuota(user))) return apiError("dailyLimit", 429);

  try {
    const plan = await tracked(user.id, "plan", () => parsePlan(text, file.name));
    if (plan.lessons.length === 0) return apiError("planNoLessons", 422);
    return Response.json({ plan });
  } catch (error) {
    return await errorResponse(error);
  }
}
