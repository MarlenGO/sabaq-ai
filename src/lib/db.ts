// Связь с базой Supabase без библиотек: обычные fetch-запросы к её REST API
// (PostgREST). Работает только на сервере: секретный ключ даёт полный доступ,
// поэтому его нельзя отдавать в браузер.
//
// Как устроен адрес запроса: /rest/v1/<таблица>?<условия>. Условия пишутся так:
//   id=eq.abc — id равен abc;  at=gte.2026-01-01 — не раньше;  order=at.desc — сортировка.
// Подробно: https://postgrest.org/en/stable/references/api/tables_views.html

export class DbError extends Error {
  constructor(
    public status: number,
    message: string,
    /** Код ошибки Postgres, например 23505 — нарушена уникальность */
    public code?: string,
  ) {
    super(message);
  }
}

function config() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new DbError(500, "SUPABASE_URL и SUPABASE_SECRET_KEY не заданы в .env.local");
  // Адрес можно вставить и как Project URL, и как адрес Data API (…/rest/v1/) — приводим к одному
  return { url: url.trim().replace(/\/+$/, "").replace(/\/rest\/v1$/, ""), key };
}

export const hasDb = () => Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SECRET_KEY);

/** Значение для условия в адресе: экранируем, чтобы текст не сломал запрос */
export const q = (value: string | number | boolean) => encodeURIComponent(String(value));

type Method = "GET" | "POST" | "PATCH" | "DELETE";

async function request<T>(method: Method, path: string, body?: unknown, prefer?: string): Promise<T> {
  const { url, key } = config();
  const response = await fetch(`${url}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: key,
      "Content-Type": "application/json",
      ...(prefer ? { Prefer: prefer } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });
  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as { message?: string; code?: string } | null;
    throw new DbError(response.status, error?.message ?? `Supabase ${response.status}`, error?.code);
  }
  if (response.status === 204) return undefined as T;
  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

/** Строки таблицы: select("lessons", "owner_id=eq.…&order=updated_at.desc") */
export function select<T>(table: string, query = "") {
  return request<T[]>("GET", `${table}${query ? `?${query}` : ""}`);
}

/** Одна строка или null */
export async function selectOne<T>(table: string, query: string) {
  const rows = await select<T>(table, `${query}&limit=1`);
  return rows[0] ?? null;
}

/** Сколько строк подходит под условие (без загрузки самих строк) */
export async function count(table: string, query = "") {
  const { url, key } = config();
  const response = await fetch(`${url}/rest/v1/${table}?select=*${query ? `&${query}` : ""}`, {
    method: "HEAD",
    headers: { apikey: key, Prefer: "count=exact" },
    cache: "no-store",
  });
  if (!response.ok) throw new DbError(response.status, `Supabase ${response.status}`);
  return Number(response.headers.get("content-range")?.split("/")[1] ?? 0);
}

/** Добавить строку (или несколько) и получить их обратно */
export function insert<T>(table: string, rows: object | object[]) {
  return request<T[]>("POST", table, rows, "return=representation");
}

/** Добавить или заменить по первичному ключу */
export function upsert<T>(table: string, rows: object | object[]) {
  return request<T[]>("POST", table, rows, "return=representation,resolution=merge-duplicates");
}

/** Изменить строки под условием и получить их обратно */
export function update<T>(table: string, query: string, patch: object) {
  return request<T[]>("PATCH", `${table}?${query}`, patch, "return=representation");
}

export function remove(table: string, query: string) {
  return request<void>("DELETE", `${table}?${query}`);
}

/** Нарушена уникальность (например, ученик второй раз ответил на тот же вопрос) */
export const isDuplicate = (error: unknown) => error instanceof DbError && error.code === "23505";
