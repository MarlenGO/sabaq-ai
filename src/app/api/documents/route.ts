import { documentRequestSchema } from "@/types/documents";
import { generateDocument } from "@/lib/ai/generate";
import { hasAiKey } from "@/lib/ai/gemini";
import { apiError, errorResponse } from "@/lib/api-errors";
import { currentUser } from "@/lib/auth";
import { emptyDocument } from "@/documents/empty";
import { documentKey, getCachedDocument, putCachedDocument } from "@/lib/storage/documents";
import { hasQuota, tracked } from "@/lib/storage/usage";

// POST /api/documents — написать документ (ҚМЖ, тест, БЖБ) по теме.
// Документ не сохраняем у учителя: страница показывает его и даёт скачать в Word.
// Ответ AI кладём в общий кэш, чтобы та же тема у другого учителя была мгновенной.
export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return apiError("unauthorized", 401);

  const parsed = documentRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError("badRequest", 400);
  const req = parsed.data;

  // Без ключа AI — пустой бланк, чтобы страница работала и в демо-режиме
  if (!hasAiKey()) return Response.json({ data: emptyDocument(req.kind, req.language, req.count), source: "demo" });

  try {
    const key = documentKey(req);
    const cached = await getCachedDocument(req.kind, key);
    if (cached) return Response.json({ data: cached, source: "ai", cached: true });

    if (!(await hasQuota(user))) return apiError("dailyLimit", 429);
    const data = await tracked(user.id, "document", () => generateDocument(req));
    await putCachedDocument(key, data);
    return Response.json({ data, source: "ai", cached: false });
  } catch (error) {
    return await errorResponse(error);
  }
}
