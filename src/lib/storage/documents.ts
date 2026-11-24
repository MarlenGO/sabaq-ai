import { createHash } from "node:crypto";
import { selectOne, upsert, q } from "@/lib/db";
import { docSchemas, type DocKind, type DocumentRequest } from "@/types/documents";

// Готовые документы AI лежат в том же общем кэше ai_cache, что и уроки:
// если другой учитель попросит тот же ҚМЖ по той же теме — AI не вызываем.
// Ключ начинается с «doc-», чтобы не пересечься с ключами уроков.

export function documentKey({ kind, topic, grade, language, subject, count }: DocumentRequest) {
  // Количество вопросов важно только тесту: у ҚМЖ и БЖБ ключ от него не зависит
  const base = `${kind}|${topic.trim().toLowerCase().replace(/\s+/g, " ")}|${grade}|${language}|${subject}${kind === "test" ? `|${count}` : ""}`;
  return `doc-${createHash("sha1").update(base).digest("hex").slice(0, 12)}`;
}

/** Документ из кэша, если он подходит под текущую схему (схемы могли поменяться) */
export async function getCachedDocument(kind: DocKind, key: string) {
  const row = await selectOne<{ content: unknown }>("ai_cache", `key=eq.${q(key)}`);
  const parsed = docSchemas[kind].safeParse(row?.content);
  return parsed.success ? parsed.data : null;
}

export const putCachedDocument = (key: string, content: unknown) => upsert("ai_cache", { key, content });
