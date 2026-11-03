import { kk, type Messages } from "./kk";
import { ru } from "./ru";

// Язык интерфейса сайта (не путать с языком урока: урок может быть на русском,
// а кнопки — на казахском). Хранится в cookie, чтобы сервер сразу отдавал
// страницу на нужном языке, без «мигания».

export type Locale = "kk" | "ru";
export const LOCALE_COOKIE = "sabaq-lang";
export const DEFAULT_LOCALE: Locale = "kk";

export const messages: Record<Locale, Messages> = { kk, ru };

export const toLocale = (value: string | undefined): Locale => (value === "ru" ? "ru" : DEFAULT_LOCALE);
