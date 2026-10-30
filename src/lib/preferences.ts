import { useSyncExternalStore } from "react";
import { TEXT_SIZE_KEY, THEME_KEY } from "./preferences-script";

// Настройки посетителя: тема и размер текста. Хранятся в localStorage
// и записываются атрибутами на <html>, а CSS в globals.css их подхватывает.
// Скрипт, который применяет их до загрузки страницы, — в preferences-script.ts.

export type Theme = "light" | "dark";
export type TextSize = "m" | "l" | "xl";

const darkQuery = "(prefers-color-scheme: dark)";

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme", "data-text-size"],
  });
  const media = window.matchMedia(darkQuery);
  media.addEventListener("change", onChange);
  return () => {
    observer.disconnect();
    media.removeEventListener("change", onChange);
  };
}

function save(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    // Приватный режим браузера: настройка просто не запомнится
  }
}

function readTheme(): Theme {
  const theme = document.documentElement.dataset.theme;
  if (theme === "light" || theme === "dark") return theme;
  return window.matchMedia(darkQuery).matches ? "dark" : "light";
}

function readTextSize(): TextSize {
  const size = document.documentElement.dataset.textSize;
  return size === "l" || size === "xl" ? size : "m";
}

// На сервере настроек не видно, поэтому до загрузки в браузере значение — null.
export function useTheme() {
  const theme = useSyncExternalStore(subscribe, readTheme, () => null);
  const setTheme = (next: Theme) => {
    document.documentElement.dataset.theme = next;
    save(THEME_KEY, next);
  };
  return [theme, setTheme] as const;
}

export function useTextSize() {
  const size = useSyncExternalStore(subscribe, readTextSize, () => null);
  const setSize = (next: TextSize) => {
    if (next === "m") delete document.documentElement.dataset.textSize;
    else document.documentElement.dataset.textSize = next;
    save(TEXT_SIZE_KEY, next === "m" ? null : next);
  };
  return [size, setSize] as const;
}
