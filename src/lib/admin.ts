import { count, q, select } from "@/lib/db";
import { currentUser, listUsers, type User } from "@/lib/auth";
import { apiError } from "@/lib/api-errors";
import { listAllLessons } from "@/lib/storage/lessons";
import { DEFAULT_DAILY_LIMIT, limitFor, listErrors, listUsageSince, startOfToday, type UsageRow } from "@/lib/storage/usage";

// Данные для админки (/admin). Сайт небольшой, поэтому считаем прямо по строкам
// таблиц, без отдельных отчётов в базе.

/** Для API админки: вошёл ли админ (иначе — ответ с ошибкой) */
export async function adminOrError() {
  const user = await currentUser();
  if (!user) return { error: await apiError("unauthorized", 401) };
  if (user.role !== "admin") return { error: await apiError("forbidden", 403) };
  return { admin: user };
}

const DAY = 86_400_000;
const daysAgo = (n: number) => new Date(Date.parse(startOfToday()) - n * DAY).toISOString();

const countBy = <T,>(rows: T[], key: (row: T) => string | null | undefined) => {
  const map = new Map<string, number>();
  for (const row of rows) {
    const k = key(row);
    if (k) map.set(k, (map.get(k) ?? 0) + 1);
  }
  return map;
};

export interface AdminUser extends User {
  lessons: number;
  aiToday: number;
  limit: number | null;
}

export interface Invite {
  code: string;
  uses: number;
  max_uses: number | null;
  created_at: string;
}

export async function loadUsers() {
  const [users, lessons, usage, invites] = await Promise.all([
    listUsers(),
    select<{ owner_id: string }>("lessons", "select=owner_id&limit=20000"),
    listUsageSince(startOfToday()),
    select<Invite>("invites", "order=created_at.desc"),
  ]);
  const lessonsBy = countBy(lessons, (l) => l.owner_id);
  const aiBy = countBy(
    usage.filter((u) => u.ok),
    (u) => u.user_id,
  );
  const rows: AdminUser[] = users.map((u) => ({
    ...u,
    lessons: lessonsBy.get(u.id) ?? 0,
    aiToday: aiBy.get(u.id) ?? 0,
    limit: limitFor(u) === Infinity ? null : limitFor(u),
  }));
  // Ждущие одобрения — наверху
  rows.sort((a, b) => Number(b.status === "pending") - Number(a.status === "pending"));
  return { users: rows, invites, defaultLimit: DEFAULT_DAILY_LIMIT };
}

export interface UsageDay {
  day: string;
  ok: number;
  failed: number;
}

export async function loadUsage() {
  const [usage, users] = await Promise.all([listUsageSince(daysAgo(6)), listUsers()]);
  const names = new Map(users.map((u) => [u.id, u.name]));
  const today = startOfToday();

  const days: UsageDay[] = Array.from({ length: 7 }, (_, i) => {
    const from = daysAgo(6 - i);
    const to = new Date(Date.parse(from) + DAY).toISOString();
    const rows = usage.filter((u) => u.at >= from && u.at < to);
    return { day: from, ok: rows.filter((r) => r.ok).length, failed: rows.filter((r) => !r.ok).length };
  });

  const byUser = users
    .map((u) => {
      const mine = usage.filter((r) => r.user_id === u.id && r.ok);
      return {
        id: u.id,
        name: names.get(u.id) ?? "—",
        today: mine.filter((r) => r.at >= today).length,
        week: mine.length,
        limit: limitFor(u) === Infinity ? null : limitFor(u),
      };
    })
    .filter((u) => u.week > 0)
    .sort((a, b) => b.week - a.week);

  const byKind = [...countBy(usage.filter((u) => u.ok), (u) => u.kind)].map(([kind, n]) => ({ kind, n }));
  return {
    days,
    byUser,
    byKind,
    today: days[6].ok,
    week: days.reduce((sum, d) => sum + d.ok, 0),
    failedWeek: days.reduce((sum, d) => sum + d.failed, 0),
  };
}

export async function loadErrors(): Promise<(UsageRow & { name: string })[]> {
  const [errors, users] = await Promise.all([listErrors(60), listUsers()]);
  const names = new Map(users.map((u) => [u.id, u.name]));
  return errors.map((e) => ({ ...e, name: (e.user_id && names.get(e.user_id)) || "—" }));
}

export async function loadStats() {
  const [users, lessons, rooms, players, activity] = await Promise.all([
    listUsers(),
    select<{ deck_type: string | null; subject: string; source: string; created_at: string }>(
      "lessons",
      "select=deck_type,subject,source,created_at&limit=20000",
    ),
    select<{ game: string }>("rooms", "select=game:data->>game&limit=20000"),
    count("players"),
    select<{ type: string; game: string | null }>("activity", "select=type:data->>type,game:data->>game&limit=20000"),
  ]);
  const week = daysAgo(6);
  const sorted = (map: Map<string, number>) => [...map].sort((a, b) => b[1] - a[1]).map(([key, n]) => ({ key, n }));
  return {
    users: users.length,
    activeTeachers: users.filter((u) => u.status === "active").length,
    pending: users.filter((u) => u.status === "pending").length,
    lessons: lessons.length,
    lessonsWeek: lessons.filter((l) => l.created_at >= week).length,
    byType: sorted(countBy(lessons, (l) => l.deck_type ?? "lesson")),
    bySubject: sorted(countBy(lessons, (l) => l.subject)),
    qrGames: rooms.length,
    byGame: sorted(countBy([...rooms, ...activity.filter((a) => a.type === "game")], (r) => r.game)),
    players,
    pptx: activity.filter((a) => a.type === "pptx").length,
  };
}

export const loadLibrary = () => listAllLessons(300);

/** Ученики одного учителя (для проверки «нельзя заблокировать себя») */
export const isSelf = (admin: User, id: string) => admin.id === id;

export const userQuery = (id: string) => `id=eq.${q(id)}`;
