import { createHash, randomBytes } from "node:crypto";
import { topicPackageSchema, type LessonRequest, type PackageContent, type TopicPackage } from "@/types/topic-package";
import { insert, q, select, selectOne, update, upsert, remove } from "@/lib/db";
import type { User } from "@/lib/auth";

// Уроки в базе Supabase (таблица lessons): весь пакет темы — в колонке data,
// рядом копии полей для списков. Остальной код пользуется только функциями ниже.
//
// У каждого учителя свои уроки. А то, что написал AI, лежит в общем кэше
// (ai_cache): если другой учитель попросит ту же тему, AI не вызываем,
// а копируем готовое — экономим бесплатные запросы.

/**
 * Ключ кэша — короткий хэш от «тема + класс + язык + предмет + вид презентации».
 * Добавки — только не по умолчанию: так ключи совпадают с id уроков из старой версии.
 */
export function cacheKey({ topic, grade, language, subject, deckType }: LessonRequest) {
  const base = `${topic.trim().toLowerCase().replace(/\s+/g, " ")}|${grade}|${language}`;
  const withSubject = subject === "physics" ? base : `${base}|${subject}`;
  const key = deckType === "lesson" ? withSubject : `${withSubject}|${deckType}`;
  return createHash("sha1").update(key).digest("hex").slice(0, 12);
}

/** id урока — случайный: у двух учителей с одной темой разные уроки */
export const newLessonId = () => randomBytes(6).toString("hex");

// Проверка формата id защищает от подстановки чужих условий в запрос
const isValidId = (id: string) => /^[a-f0-9]{12}$/.test(id);

interface LessonRow {
  id: string;
  owner_id: string;
  featured: boolean;
  data: unknown;
}

export interface LessonRecord {
  lesson: TopicPackage;
  ownerId: string;
  featured: boolean;
}

export async function getLessonRecord(id: string): Promise<LessonRecord | null> {
  if (!isValidId(id)) return null;
  const row = await selectOne<LessonRow>("lessons", `id=eq.${q(id)}&select=id,owner_id,featured,data`);
  if (!row) return null;
  const parsed = topicPackageSchema.safeParse(row.data);
  return parsed.success ? { lesson: parsed.data, ownerId: row.owner_id, featured: row.featured } : null;
}

/** Смотреть урок: свой, любой для админа или из библиотеки */
export const canRead = (user: User, record: LessonRecord) =>
  record.ownerId === user.id || user.role === "admin" || record.featured;

/** Менять урок: свой или любой для админа */
export const canWrite = (user: User, record: LessonRecord) => record.ownerId === user.id || user.role === "admin";

/** Урок, который этот учитель может смотреть (или null — «не найден», не раскрываем чужое) */
export async function getLessonFor(user: User, id: string) {
  const record = await getLessonRecord(id);
  return record && canRead(user, record) ? record : null;
}

const columns = (lesson: TopicPackage) => ({
  topic: lesson.topic,
  grade: lesson.grade,
  language: lesson.language,
  subject: lesson.subject,
  source: lesson.source,
  deck_type: lesson.deckType ?? "lesson",
  data: lesson,
  created_at: lesson.createdAt,
  updated_at: lesson.updatedAt,
});

export async function createLesson(lesson: TopicPackage, ownerId: string, key?: string) {
  if (!isValidId(lesson.id)) throw new Error(`Bad lesson id: ${lesson.id}`);
  await insert("lessons", { id: lesson.id, owner_id: ownerId, cache_key: key ?? null, ...columns(lesson) });
}

export async function saveLesson(lesson: TopicPackage) {
  if (!isValidId(lesson.id)) throw new Error(`Bad lesson id: ${lesson.id}`);
  await update("lessons", `id=eq.${q(lesson.id)}`, columns(lesson));
}

export const deleteLesson = (id: string) => remove("lessons", `id=eq.${q(id)}`);

/** Урок этого учителя по той же теме — чтобы повторное нажатие не плодило копии */
export async function findOwnLesson(ownerId: string, key: string) {
  const row = await selectOne<{ id: string; source: string }>(
    "lessons",
    `owner_id=eq.${q(ownerId)}&cache_key=eq.${q(key)}&select=id,source&order=updated_at.desc`,
  );
  return row;
}

export type LessonSummary = Pick<
  TopicPackage,
  "id" | "topic" | "grade" | "language" | "subject" | "source" | "createdAt" | "updatedAt"
> & { deckType?: string; featured?: boolean; ownerName?: string };

interface SummaryRow {
  id: string;
  topic: string;
  grade: number;
  language: TopicPackage["language"];
  subject: TopicPackage["subject"];
  source: TopicPackage["source"];
  deck_type: string | null;
  featured: boolean;
  created_at: string;
  updated_at: string;
  users?: { name: string } | null;
}

const SUMMARY = "id,topic,grade,language,subject,source,deck_type,featured,created_at,updated_at";
const toSummary = (r: SummaryRow): LessonSummary => ({
  id: r.id,
  topic: r.topic,
  grade: r.grade,
  language: r.language,
  subject: r.subject,
  source: r.source,
  deckType: r.deck_type ?? "lesson",
  featured: r.featured,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
  ownerName: r.users?.name,
});

/** Уроки учителя, недавно изменённые — первыми */
export async function listLessons(ownerId: string, limit?: number): Promise<LessonSummary[]> {
  const rows = await select<SummaryRow>(
    "lessons",
    `owner_id=eq.${q(ownerId)}&select=${SUMMARY}&order=updated_at.desc${limit ? `&limit=${limit}` : ""}`,
  );
  return rows.map(toSummary);
}

/** Библиотека: уроки, которые админ отметил как образцовые — видны всем учителям */
export async function listFeatured(): Promise<LessonSummary[]> {
  const rows = await select<SummaryRow>("lessons", `featured=is.true&select=${SUMMARY},users(name)&order=updated_at.desc`);
  return rows.map(toSummary);
}

/** Все уроки (для админки) с именем учителя */
export async function listAllLessons(limit = 200): Promise<LessonSummary[]> {
  const rows = await select<SummaryRow>("lessons", `select=${SUMMARY},users(name)&order=updated_at.desc&limit=${limit}`);
  return rows.map(toSummary);
}

export const setFeatured = (id: string, featured: boolean) => update("lessons", `id=eq.${q(id)}`, { featured });

// ——— Кэш AI ———

export interface CachedContent {
  content: PackageContent;
  deck?: TopicPackage["deck"];
}

export async function getCached(key: string) {
  const row = await selectOne<{ content: CachedContent }>("ai_cache", `key=eq.${q(key)}`);
  return row?.content ?? null;
}

export const putCached = (key: string, content: CachedContent) => upsert("ai_cache", { key, content });
