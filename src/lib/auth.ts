import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { count, insert, remove, select, selectOne, update, q } from "@/lib/db";

// Вход на сайт: свой простой вход по логину и паролю, без писем на почту.
// Логин — email или простое слово (у мамы — «mama»). После входа браузер
// помнит учителя год: в cookie лежит случайный токен, в базе — только его хэш,
// поэтому даже утечка базы не даст войти чужим токеном.
//
// Роли: admin (Марлен и мама) — всё и админка; teacher — свои уроки.
// Статусы: pending — ждёт одобрения, active — работает, blocked — вход закрыт.

export const SESSION_COOKIE = "sabaq-session";
const SESSION_DAYS = 365;
const LOGIN_LINK_DAYS = 7;

export type Role = "admin" | "teacher";
export type UserStatus = "pending" | "active" | "blocked";

export interface User {
  id: string;
  login: string;
  name: string;
  role: Role;
  status: UserStatus;
  daily_limit: number | null;
  created_at: string;
  last_seen_at: string | null;
}

const USER_FIELDS = "id,login,name,role,status,daily_limit,created_at,last_seen_at";

const scrypt = promisify(scryptCallback) as (password: string, salt: Buffer, keylen: number) => Promise<Buffer>;
const sha256 = (text: string) => createHash("sha256").update(text).digest("hex");
const newToken = () => randomBytes(32).toString("base64url");

/** Логин без лишних пробелов и заглавных: «Mama » и «mama» — один человек */
export const normalizeLogin = (login: string) => login.trim().toLowerCase();

// ——— Пароли ———

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const hash = await scrypt(password, salt, 64);
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}

async function verifyPassword(password: string, stored: string) {
  const [kind, saltHex, hashHex] = stored.split("$");
  if (kind !== "scrypt" || !saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  const actual = await scrypt(password, Buffer.from(saltHex, "hex"), expected.length);
  return timingSafeEqual(actual, expected);
}

// ——— Сессии ———

async function startSession(userId: string) {
  const token = newToken();
  const expires = new Date(Date.now() + SESSION_DAYS * 24 * 3600 * 1000);
  await insert("sessions", { token_hash: sha256(token), user_id: userId, expires_at: expires.toISOString() });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires,
  });
}

export async function logout() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) await remove("sessions", `token_hash=eq.${q(sha256(token))}`).catch(() => {});
  store.delete(SESSION_COOKIE);
}

/**
 * Кто сейчас на сайте (или null). cache — внутри одной отрисовки страницы
 * запрос к базе делается один раз, сколько бы компонентов ни спросили.
 */
export const currentUser = cache(async (): Promise<User | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await selectOne<{ expires_at: string; users: User & { password_hash?: never } }>(
    "sessions",
    `token_hash=eq.${q(sha256(token))}&select=expires_at,users(${USER_FIELDS})`,
  ).catch(() => null);
  const user = session?.users;
  if (!session || !user || Date.parse(session.expires_at) < Date.now() || user.status !== "active") return null;

  // «Последний вход» для админки — не чаще раза в час, чтобы не писать в базу на каждый клик
  if (!user.last_seen_at || Date.now() - Date.parse(user.last_seen_at) > 3600_000) {
    update("users", `id=eq.${q(user.id)}`, { last_seen_at: new Date().toISOString() }).catch(() => {});
  }
  return user;
});

/** Для страниц: без входа — на страницу входа */
export async function requireUser() {
  const user = await currentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "admin") redirect("/");
  return user;
}

// ——— Вход и регистрация ———

export type LoginResult = { ok: true } | { ok: false; reason: "wrong" | "pending" | "blocked" };

export async function login(loginName: string, password: string): Promise<LoginResult> {
  const row = await selectOne<User & { password_hash: string }>("users", `login=eq.${q(normalizeLogin(loginName))}`);
  if (!row || !(await verifyPassword(password, row.password_hash))) return { ok: false, reason: "wrong" };
  if (row.status === "pending") return { ok: false, reason: "pending" };
  if (row.status === "blocked") return { ok: false, reason: "blocked" };
  await startSession(row.id);
  return { ok: true };
}

export type RegisterResult = { ok: true; status: UserStatus } | { ok: false; reason: "taken" };

/**
 * Регистрация. Самый первый пользователь становится админом — так сайт
 * настраивается без отдельной установки. С кодом приглашения учитель сразу
 * активен, без кода — ждёт одобрения в админке.
 */
export async function register(data: { name: string; login: string; password: string; invite?: string }): Promise<RegisterResult> {
  const loginName = normalizeLogin(data.login);
  if (await selectOne("users", `login=eq.${q(loginName)}&select=id`)) return { ok: false, reason: "taken" };

  const first = (await count("users")) === 0;
  const invite = !first && data.invite?.trim() ? await redeemInvite(data.invite.trim()) : false;
  const status: UserStatus = first || invite ? "active" : "pending";
  const [user] = await insert<User>("users", {
    login: loginName,
    name: data.name.trim(),
    password_hash: await hashPassword(data.password),
    role: first ? "admin" : "teacher",
    status,
  });
  if (status === "active") await startSession(user.id);
  return { ok: true, status };
}

/** Код приглашения: true, если подошёл (и засчитываем использование) */
async function redeemInvite(code: string) {
  const invite = await selectOne<{ code: string; uses: number; max_uses: number | null }>("invites", `code=eq.${q(code.toUpperCase())}`);
  if (!invite || (invite.max_uses !== null && invite.uses >= invite.max_uses)) return false;
  await update("invites", `code=eq.${q(invite.code)}`, { uses: invite.uses + 1 });
  return true;
}

// ——— Ссылка для входа без пароля ———

/** Одноразовая ссылка на неделю: админ открывает её на компьютере мамы, и мама уже внутри */
export async function createLoginLink(userId: string) {
  const token = newToken();
  const expires = new Date(Date.now() + LOGIN_LINK_DAYS * 24 * 3600 * 1000);
  await insert("login_links", { token_hash: sha256(token), user_id: userId, expires_at: expires.toISOString() });
  return { token, expiresAt: expires.toISOString() };
}

export async function redeemLoginLink(token: string) {
  const link = await selectOne<{ token_hash: string; user_id: string; expires_at: string; used_at: string | null }>(
    "login_links",
    `token_hash=eq.${q(sha256(token))}`,
  );
  if (!link || link.used_at || Date.parse(link.expires_at) < Date.now()) return false;
  const user = await selectOne<User>("users", `id=eq.${q(link.user_id)}&select=${USER_FIELDS}`);
  if (!user || user.status !== "active") return false;
  await update("login_links", `token_hash=eq.${q(link.token_hash)}`, { used_at: new Date().toISOString() });
  await startSession(user.id);
  return true;
}

// ——— Для админки ———

export const listUsers = () => select<User>("users", `select=${USER_FIELDS}&order=created_at.desc`);

export async function updateUser(id: string, patch: Partial<Pick<User, "name" | "role" | "status" | "daily_limit">> & { password?: string }) {
  const { password, ...rest } = patch;
  const row: Record<string, unknown> = { ...rest };
  if (password) row.password_hash = await hashPassword(password);
  await update("users", `id=eq.${q(id)}`, row);
  // Заблокировали или сменили пароль — выходим со всех устройств
  if (patch.status === "blocked" || password) await remove("sessions", `user_id=eq.${q(id)}`);
}

export async function createUser(data: { name: string; login: string; password: string; role: Role }) {
  const loginName = normalizeLogin(data.login);
  if (await selectOne("users", `login=eq.${q(loginName)}&select=id`)) return null;
  const [user] = await insert<User>("users", {
    login: loginName,
    name: data.name.trim(),
    password_hash: await hashPassword(data.password),
    role: data.role,
    status: "active",
  });
  return user;
}
