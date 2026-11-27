import { z } from "zod";
import { docFieldsSchema, docSchemas, documentRequestSchema, type DocData, type DocKind } from "@/types/documents";
import { generateDocument } from "@/lib/ai/generate";
import { hasAiKey } from "@/lib/ai/gemini";
import { apiError, errorResponse } from "@/lib/api-errors";
import { currentUser } from "@/lib/auth";
import { emptyDocument } from "@/documents/empty";
import { documentKey, getCachedDocument, putCachedDocument } from "@/lib/storage/documents";
import { hasQuota, tracked } from "@/lib/storage/usage";
import { appendActivity } from "@/lib/storage/activity";
import { createDocument, listDocuments } from "@/lib/storage/my-documents";
import { emptyKmzh, kmzhAiSchema, kmzhDocSchema } from "@/lib/kmzh/schema";
import { generateKmzh } from "@/lib/kmzh/generate";
import { fillKmzh } from "@/lib/kmzh/fill";

// Работает в Node.js (по умолчанию): шаблон Word читаем с диска
export const maxDuration = 60; // ҚМЖ пишется 10–30 секунд

// GET /api/documents — список «Менің құжаттарым» (страница перечитывает его при каждом показе)
export async function GET() {
  const user = await currentUser();
  if (!user) return apiError("unauthorized", 401);
  try {
    return Response.json({ documents: await listDocuments(user.id) });
  } catch (error) {
    return await errorResponse(error);
  }
}

// POST /api/documents — написать документ (ҚМЖ, тест, БЖБ) по теме.
// В «Тарих» пишем, по чему его найти в кэше, а копию с полями формы — в «Менің құжаттарым»
// (таблица documents, дальше автосохранение PUT /api/documents/[id]).
// Ответ AI кладём в общий кэш, чтобы та же тема у другого учителя была мгновенной.
// { word: ҚМЖ } — собрать готовый ҚМЖ в Word по шаблону (без AI): тот же JSON, что на листе.
export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return apiError("unauthorized", 401);
  const body = await request.json().catch(() => null);

  if (body?.word) {
    const parsed = kmzhDocSchema.safeParse(body.word);
    if (!parsed.success) return apiError("badRequest", 400);
    return new Response(new Uint8Array(fillKmzh(parsed.data)), {
      headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document" },
    });
  }

  const parsed = documentRequestSchema.safeParse(body);
  if (!parsed.success) return apiError("badRequest", 400);
  // Жұмыс парағы — только на казахском, даже если в запросе другой язык
  const req = parsed.data.kind === "worksheet" ? { ...parsed.data, language: "kk" as const } : parsed.data;
  const isKmzh = req.kind === "kmzh";

  // Без ключа AI — пустой бланк, чтобы страница работала и в демо-режиме
  if (!hasAiKey()) {
    return Response.json({ data: isKmzh ? emptyKmzh() : emptyDocument(req.kind, req.language, req.count), source: "demo" });
  }

  try {
    const key = documentKey(req);
    const schema = isKmzh ? kmzhAiSchema : (docSchemas[req.kind] as z.ZodType<DocData[DocKind]>);
    const cached = await getCachedDocument<unknown>(schema, key);
    const generate = (): Promise<unknown> => (isKmzh ? generateKmzh(req) : generateDocument(req));
    const data = cached ?? (await hasQuota(user) ? await tracked(user.id, "document", generate) : null);
    if (!data) return apiError("dailyLimit", 429);
    if (!cached) await putCachedDocument(key, data);
    let docId: string | null = null;
    if (!req.again) {
      // Своя копия учителя. Если таблицы ещё нет (SQL не запущен) — документ всё равно отдаём
      const fields = docFieldsSchema.safeParse({ ...body, ...req });
      if (fields.success) docId = await createDocument(user.id, req.kind, fields.data, data).catch(() => null);
      const { kind: docKind, subject, topic, grade, language, count, section, objective, textbook, value, planType, lessonType, taskCount } = req;
      await appendActivity(user.id, {
        type: "document",
        at: new Date().toISOString(),
        docKind,
        subject,
        topic,
        grade,
        language,
        count,
        // ҚМЖ по шаблону: v2 и что учитель вписал сам — чтобы открыть из «Тарих» тот же план
        ...(isKmzh ? { v: 2, section, objective, textbook, value, planType, lessonType, taskCount } : {}),
      });
    }
    return Response.json({ data, source: "ai", cached: Boolean(cached), docId });
  } catch (error) {
    return await errorResponse(error);
  }
}
