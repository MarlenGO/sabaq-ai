"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { AiRequest } from "@/types/ai";
import { SparkleIcon } from "@/components/ui/Icons";
import { useT } from "@/i18n/client";

// Кнопка «AI» в конструкторе: пишет заново одну часть урока (слайд, вопрос…).
// Результат сразу встаёт на место и сохраняется как обычная правка, а рядом
// появляется «Болдырмау» — вернуть то, что было до нажатия.

interface AiSettings {
  lessonId: string;
  /** false — нет ключа AI или это пример на главной: кнопки не показываем */
  enabled: boolean;
}

const AiContext = createContext<AiSettings>({ lessonId: "", enabled: false });

export function AiProvider({ children, ...settings }: AiSettings & { children: ReactNode }) {
  return <AiContext.Provider value={settings}>{children}</AiContext.Provider>;
}

interface AiButtonProps<T> {
  request: AiRequest;
  /** Что сейчас на этом месте — для «Болдырмау» */
  current: T;
  apply: (value: T) => void;
  /** Подсказка при наведении и для экранного диктора */
  hint: string;
  /** Полная подпись «AI-мен жазу» (у слайда) или короткая «AI» (у вопроса) */
  wide?: boolean;
  /** Своя подпись вместо «AI-мен жазу» */
  label?: string;
}

export function AiButton<T>({ request, current, apply, hint, wide, label }: AiButtonProps<T>) {
  const { lessonId, enabled } = useContext(AiContext);
  const t = useT();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previous, setPrevious] = useState<{ value: T } | null>(null);
  // Ответ AI приходит через несколько секунд: применяем его к актуальному уроку, а не к тому,
  // что был в момент нажатия (учитель мог успеть что-то поправить)
  const latest = useRef({ current, apply });
  useEffect(() => {
    latest.current = { current, apply };
  });

  if (!enabled) return null;

  const run = async () => {
    setBusy(true);
    setError(null);
    const response = await fetch(`/api/lessons/${lessonId}/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    }).catch(() => null);
    const data = await response?.json().catch(() => null);
    setBusy(false);
    if (!response?.ok || data?.value === undefined) return setError(data?.error ?? t.common.netError);
    setPrevious({ value: latest.current.current });
    latest.current.apply(data.value as T);
  };

  const undo = () => {
    if (!previous) return;
    latest.current.apply(previous.value);
    setPrevious(null);
  };

  return (
    <span className="flex flex-wrap items-center gap-1">
      <button
        type="button"
        onClick={run}
        disabled={busy}
        title={hint}
        aria-label={`${hint}${busy ? ` — ${t.ai.working}` : ""}`}
        className="inline-flex h-11 items-center gap-1.5 rounded-xl bg-purple/12 px-3 text-subhead font-semibold text-purple transition hover:bg-purple/20 disabled:opacity-60"
      >
        <SparkleIcon className={busy ? "animate-spin" : ""} />
        {busy ? t.ai.working : (label ?? (wide ? t.ai.generate : t.ai.short))}
      </button>
      {previous && !busy && (
        <button
          type="button"
          onClick={undo}
          className="inline-flex h-11 items-center rounded-xl px-3 text-subhead font-semibold text-accent hover:bg-accent/10"
        >
          {t.ai.undo}
        </button>
      )}
      {error && (
        <span role="alert" className="w-full text-footnote text-red">
          {error}
        </span>
      )}
    </span>
  );
}
