import { createHash } from "node:crypto";
import { selectOne, upsert, q } from "@/lib/db";
import type { z } from "zod";
import type { DocumentRequest } from "@/types/documents";

// Готовые документы AI лежат в том же общем кэше ai_cache, что и уроки:
// если другой учитель попросит тот же ҚМЖ по той же теме — AI не вызываем.
// Ключ начинается с «doc-», чтобы не пересечься с ключами уроков.

export function documentKey(req: DocumentRequest) {
  const { kind, grade, language, subject, count } = req;
  const norm = (text: string) => text.trim().toLowerCase().replace(/\s+/g, " ");
  // ҚМЖ по шаблону — «kmzh-v2»: старые ответы в прежнем формате сюда не попадут.
  // В ключ входит всё, что учитель написал сам (бөлім, оқу мақсаты, оқулық, апта құндылығы).
  // Вид плана и тип урока — только если не по умолчанию, чтобы прежние ҚМЖ из кэша открывались
  const kinds =
    (req.planType !== "full" || req.lessonType !== "new" ? `|${req.planType}|${req.lessonType}` : "") +
    (req.taskCount === 4 ? "|t4" : "");
  const extra = kind === "kmzh" ? `|v2|${[req.section, req.objective, req.textbook, req.value].map(norm).join("|")}${kinds}` : "";
  // Количество вопросов важно только тесту
  const base = `${kind}|${norm(req.topic)}|${grade}|${language}|${subject}${kind === "test" ? `|${count}` : ""}${extra}`;
  return `doc-${createHash("sha1").update(base).digest("hex").slice(0, 12)}`;
}

/** Документ из кэша, если он подходит под текущую схему (схемы могли поменяться) */
export async function getCachedDocument<T>(schema: z.ZodType<T>, key: string) {
  const row = await selectOne<{ content: unknown }>("ai_cache", `key=eq.${q(key)}`);
  const parsed = schema.safeParse(row?.content);
  return parsed.success ? parsed.data : null;
}

export const putCachedDocument = (key: string, content: unknown) => upsert("ai_cache", { key, content });
