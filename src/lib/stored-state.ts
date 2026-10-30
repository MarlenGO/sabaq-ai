import { useMemo, useSyncExternalStore } from "react";

// useState, который помнит значение в localStorage: черновик формы
// не пропадёт, если учитель случайно закроет вкладку.
// Если localStorage недоступен, значение живёт в памяти до перезагрузки.

const cache = new Map<string, string | null>();
const listeners = new Set<() => void>();

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  return () => listeners.delete(onChange);
}

function read(key: string): string | null {
  if (!cache.has(key)) {
    let value: string | null = null;
    try {
      value = localStorage.getItem(key);
    } catch {}
    cache.set(key, value);
  }
  return cache.get(key) ?? null;
}

function write(key: string, value: string) {
  cache.set(key, value);
  try {
    localStorage.setItem(key, value);
  } catch {}
  listeners.forEach((listener) => listener());
}

/** fallback должен быть константой вне компонента */
export function useStoredState<T>(key: string, fallback: T) {
  const raw = useSyncExternalStore(subscribe, () => read(key), () => null);

  const value = useMemo<T>(() => {
    if (raw === null) return fallback;
    try {
      return { ...fallback, ...JSON.parse(raw) };
    } catch {
      return fallback;
    }
  }, [raw, fallback]);

  const setValue = (next: T) => write(key, JSON.stringify(next));
  return [value, setValue] as const;
}
