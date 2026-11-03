import { count, insert, q, select } from "@/lib/db";
import type { User } from "@/lib/auth";

// Учёт запросов к AI (таблица ai_usage): для дневного лимита учителя,
// расхода в админке и списка ошибок. Бесплатный ключ Gemini общий на всех,
// поэтому один учитель не должен за день потратить его целиком.

/** Сколько генераций в день у учителя, если админ не задал своё число */
export const DEFAULT_DAILY_LIMIT = 40;

export type UsageKind = "lesson" | "deck" | "part" | "jeopardy";

/** Начало сегодняшнего дня по времени Казахстана (UTC+5) */
export function startOfToday() {
  const now = Date.now() + 5 * 3600_000;
  return new Date(now - (now % 86_400_000) - 5 * 3600_000).toISOString();
}

export const limitFor = (user: User) => (user.role === "admin" ? Infinity : (user.daily_limit ?? DEFAULT_DAILY_LIMIT));

export const usedToday = (userId: string) =>
  count("ai_usage", `user_id=eq.${q(userId)}&at=gte.${q(startOfToday())}&ok=is.true`);

export async function hasQuota(user: User) {
  const limit = limitFor(user);
  return limit === Infinity || (await usedToday(user.id)) < limit;
}

export function logUsage(userId: string, kind: UsageKind, ok: boolean, error?: unknown) {
  const message = error instanceof Error ? error.message : error ? String(error) : null;
  // Журнал не должен ломать генерацию: ошибку записи просто пропускаем
  return insert("ai_usage", { user_id: userId, kind, ok, error: message?.slice(0, 500) ?? null }).catch(() => {});
}

/** Выполнить запрос к AI с учётом: удачный — в расход, неудачный — в список ошибок */
export async function tracked<T>(userId: string, kind: UsageKind, run: () => Promise<T>): Promise<T> {
  try {
    const result = await run();
    await logUsage(userId, kind, true);
    return result;
  } catch (error) {
    await logUsage(userId, kind, false, error);
    throw error;
  }
}

export interface UsageRow {
  user_id: string | null;
  kind: UsageKind;
  ok: boolean;
  error: string | null;
  at: string;
}

export const listUsageSince = (since: string) =>
  select<UsageRow>("ai_usage", `at=gte.${q(since)}&select=user_id,kind,ok,error,at&order=at.desc&limit=5000`);

export const listErrors = (limit = 50) =>
  select<UsageRow>("ai_usage", `ok=is.false&select=user_id,kind,ok,error,at&order=at.desc&limit=${limit}`);
