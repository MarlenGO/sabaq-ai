import { count, q, remove, rpc, select } from "@/lib/db";
import { documentKey } from "@/lib/storage/documents";
import { documentRequestSchema } from "@/types/documents";

// Вкладка «БД» в админке: сколько строк и места у каждой таблицы и чистка мусора —
// того, что сайту уже не нужно и само не удаляется.

/** Таблицы в порядке показа (подписи — в словаре t.admin.db.tables) */
export const dbTables = [
  "ai_cache",
  "lessons",
  "plans",
  "activity",
  "ai_usage",
  "rooms",
  "players",
  "answers",
  "sessions",
  "login_links",
  "users",
  "invites",
] as const;
export type DbTable = (typeof dbTables)[number];

/** Бесплатная база Supabase — 500 МБ */
export const DB_LIMIT = 500 * 1024 * 1024;

/** Кэш AI младше этого не трогаем: им ещё пользуются при повторных темах */
const CACHE_DAYS = 30;
const DAY = 86_400_000;

export interface DbStats {
  tables: { name: DbTable; rows: number; bytes: number | null }[];
  /** Размер всей базы; null — в Supabase ещё нет функции db_sizes (schema.sql) */
  total: number | null;
  junk: Record<DbJunk, number>;
}

export const dbJunk = ["sessions", "cache"] as const;
export type DbJunk = (typeof dbJunk)[number];

const now = () => q(new Date().toISOString());
const expiredLogins = () => [
  { table: "sessions", query: `expires_at=lt.${now()}` },
  { table: "login_links", query: `or=(expires_at.lt.${now()},used_at.not.is.null)` },
];

export async function loadDbStats(): Promise<DbStats> {
  // Все запросы к базе — одновременно: каждый идёт ~130 мс, друг за другом вышло бы больше секунды
  const [sizes, rows, sessions, cache] = await Promise.all([
    rpc<{ name: string; bytes: number; total: number }[]>("db_sizes").catch(() => null),
    Promise.all(dbTables.map((name) => count(name).catch(() => 0))),
    Promise.all(expiredLogins().map(({ table, query }) => count(table, query))),
    staleCacheKeys(),
  ]);
  const bytes = new Map(sizes?.map((s) => [s.name, Number(s.bytes)]));
  return {
    tables: dbTables.map((name, i) => ({ name, rows: rows[i], bytes: bytes.get(name) ?? null })),
    total: sizes?.[0] ? Number(sizes[0].total) : null,
    junk: { sessions: sessions[0] + sessions[1], cache: cache.length },
  };
}

/**
 * Ключи кэша AI, которые можно удалить: старше 30 дней и не нужны «Тарих».
 * Уроки хранят свою копию в lessons — их кэш нужен только для повторной темы.
 * Документы (ҚМЖ, тест…) живут ТОЛЬКО в кэше: из «Тарих» их открывают по ключу,
 * поэтому документы, которые ещё есть в чьей-то истории, оставляем.
 */
async function staleCacheKeys() {
  const before = q(new Date(Date.now() - CACHE_DAYS * DAY).toISOString());
  const [old, docs] = await Promise.all([
    select<{ key: string }>("ai_cache", `select=key&created_at=lt.${before}`),
    select<{ data: Record<string, unknown> }>("activity", "select=data&data->>type=eq.document"),
  ]);
  const used = new Set<string>();
  for (const { data } of docs) {
    const req = documentRequestSchema.safeParse({ ...data, kind: data.docKind });
    if (req.success) used.add(documentKey(req.data));
  }
  return old.map((row) => row.key).filter((key) => !used.has(key));
}

/** Удалить мусор; возвращает, сколько записей удалено */
export async function dbCleanup(target: DbJunk) {
  let removed = 0;
  if (target === "sessions") {
    for (const { table, query } of expiredLogins()) {
      removed += await count(table, query);
      await remove(table, query);
    }
    return removed;
  }
  const keys = await staleCacheKeys();
  // Пачками: длинный список не влезет в адрес запроса
  for (let i = 0; i < keys.length; i += 100) {
    const part = keys.slice(i, i + 100);
    await remove("ai_cache", `key=in.(${part.map((key) => `"${q(key)}"`).join(",")})`);
    removed += part.length;
  }
  return removed;
}
