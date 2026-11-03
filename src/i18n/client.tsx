"use client";

import { createContext, useContext, type ReactNode } from "react";
import { DEFAULT_LOCALE, LOCALE_COOKIE, messages, type Locale } from "./locale";

// Для клиентских компонентов: язык приходит из layout (сервер прочитал cookie),
// а тексты берутся прямо из словаря — функции в них нельзя передать с сервера.

const LocaleContext = createContext<Locale>(DEFAULT_LOCALE);

export function LocaleProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  return <LocaleContext value={locale}>{children}</LocaleContext>;
}

export const useLocale = () => useContext(LocaleContext);
export const useT = () => messages[useContext(LocaleContext)];

/** Сменить язык сайта: запомнить в cookie на год и перезагрузить страницу */
export function setLocale(locale: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`;
  window.location.reload();
}
