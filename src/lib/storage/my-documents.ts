import { randomBytes } from "node:crypto";
import { insert, q, remove, select, selectOne, update } from "@/lib/db";
import { docFieldsSchema, docKindSchema, type DocFields, type DocKind, type MyDocument, type MyDocumentItem } from "@/types/documents";

// «Менің құжаттарым» (таблица documents): у каждого учителя своя копия документа —
// поля формы и ответ AI в data jsonb. В каждом запросе owner_id: чужие документы не видны.
// Общий кэш AI (ai_cache, lib/storage/documents.ts) — отдельно, его чистка сюда не доходит.

interface DocumentRow {
  id: string;
  kind: string;
  subject: string;
  topic: string;
  grade: number;
  language: string;
  data?: { fields?: unknown; content?: unknown };
  created_at: string;
  updated_at: string;
}

const LIST_COLUMNS = "select=id,kind,subject,topic,grade,language,created_at,updated_at";
const mine = (ownerId: string, id: string) => `id=eq.${q(id)}&owner_id=eq.${q(ownerId)}`;

/** Колонки для списка и поиска — из полей формы */
const columns = (fields: DocFields) => ({
  subject: fields.subject,
  topic: fields.topic,
  grade: fields.grade,
  language: fields.language,
});

export async function listDocuments(ownerId: string): Promise<MyDocumentItem[]> {
  const rows = await select<DocumentRow>("documents", `owner_id=eq.${q(ownerId)}&${LIST_COLUMNS}&order=updated_at.desc`);
  return rows.flatMap((row) => {
    const kind = docKindSchema.safeParse(row.kind);
    const fields = docFieldsSchema.pick({ subject: true, language: true }).safeParse(row);
    if (!kind.success || !fields.success) return [];
    const { id, topic, grade, created_at, updated_at } = row;
    return [{ id, kind: kind.data, ...fields.data, topic, grade, createdAt: created_at, updatedAt: updated_at }];
  });
}

/** Документ целиком или null (нет, чужой или испорченный) */
export async function getDocument(ownerId: string, id: string): Promise<MyDocument | null> {
  const row = await selectOne<DocumentRow>("documents", `${mine(ownerId, id)}&select=*`);
  if (!row) return null;
  const kind = docKindSchema.safeParse(row.kind);
  const fields = docFieldsSchema.safeParse(row.data?.fields);
  if (!kind.success || !fields.success) return null;
  return { id: row.id, kind: kind.data, fields: fields.data, content: row.data?.content, createdAt: row.created_at, updatedAt: row.updated_at };
}

export async function createDocument(ownerId: string, kind: DocKind, fields: DocFields, content: unknown): Promise<string> {
  const id = randomBytes(6).toString("hex");
  await insert("documents", { id, owner_id: ownerId, kind, ...columns(fields), data: { fields, content } });
  return id;
}

/** Автосохранение: новые поля формы, ответ AI прежний. false — документа нет или он чужой */
export async function saveDocument(ownerId: string, id: string, fields: DocFields): Promise<boolean> {
  const current = await getDocument(ownerId, id);
  if (!current) return false;
  const rows = await update("documents", mine(ownerId, id), {
    ...columns(fields),
    data: { fields, content: current.content },
    updated_at: new Date().toISOString(),
  });
  return rows.length > 0;
}

export const deleteDocument = (ownerId: string, id: string) => remove("documents", mine(ownerId, id));
