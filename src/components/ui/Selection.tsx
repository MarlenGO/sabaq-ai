"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toSelection } from "@/types/history";
import { useT } from "@/i18n/client";
import { CheckIcon, TrashIcon } from "@/components/ui/Icons";

// Галочки в «Тарих» (у учителя и в админке): отметить строки или все сразу,
// кнопка «Өшіру» появляется, только когда что-то отмечено.

/** Отмеченные строки (ссылки «lesson:id», «room:код», «activity:номер») и удаление через API */
export function useHistorySelection(endpoint: string) {
  const t = useT();
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [result, setResult] = useState<string | null>(null);
  const [busy, startTransition] = useTransition();

  const toggle = (ref: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(ref)) next.delete(ref);
      else next.add(ref);
      return next;
    });

  /** Отметить все видимые строки или снять отметку, если они уже все отмечены */
  const toggleAll = (refs: string[]) =>
    setSelected((prev) => (refs.length > 0 && refs.every((r) => prev.has(r)) ? new Set() : new Set(refs)));

  const remove = () => {
    if (!window.confirm(t.history.confirmDelete(selected.size))) return;
    startTransition(async () => {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toSelection(selected)),
      }).catch(() => null);
      const data = await response?.json().catch(() => null);
      setResult(response?.ok ? t.history.deleted(data?.removed ?? 0) : (data?.error ?? t.common.netError));
      if (response?.ok) setSelected(new Set());
      router.refresh();
    });
  };

  return { selected, toggle, toggleAll, remove, busy, result };
}

/** Крупная галочка: кружок 24 px, нажимать можно по площадке 44 px */
export function Checkbox({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    // Круглая галочка в стиле сайта: настоящий checkbox спрятан (клавиатура и экранный диктор работают), виден кружок
    <label className="flex size-11 shrink-0 cursor-pointer items-center justify-center">
      <input type="checkbox" checked={checked} onChange={onChange} aria-label={label} className="peer sr-only" />
      <span
        className={`flex size-6 items-center justify-center rounded-full border-2 transition peer-focus-visible:ring-2 peer-focus-visible:ring-accent/40 ${
          checked ? "border-accent bg-accent text-white" : "border-label-3 bg-surface"
        }`}
      >
        {checked && <CheckIcon className="size-3.5" />}
      </span>
    </label>
  );
}

/** Строка над списком: «Барлығын таңдау» и, если отмечено, «Өшіру (n)» */
export function SelectionBar(props: {
  refs: string[];
  selection: ReturnType<typeof useHistorySelection>;
}) {
  const t = useT();
  const { selected, toggleAll, remove, busy, result } = props.selection;
  const all = props.refs.length > 0 && props.refs.every((r) => selected.has(r));
  return (
    <div className="flex min-h-12 flex-wrap items-center gap-3">
      {/* Такой же кружок, как у строк; подпись тоже нажимается */}
      <label className="flex cursor-pointer items-center gap-1 pr-2 text-callout font-semibold">
        <span className="flex size-11 items-center justify-center">
          <input
            type="checkbox"
            checked={all}
            onChange={() => toggleAll(props.refs)}
            disabled={props.refs.length === 0}
            className="peer sr-only"
          />
          <span
            className={`flex size-6 items-center justify-center rounded-full border-2 transition peer-focus-visible:ring-2 peer-focus-visible:ring-accent/40 peer-disabled:opacity-40 ${
              all ? "border-accent bg-accent text-white" : "border-label-3 bg-surface"
            }`}
          >
            {all && <CheckIcon className="size-3.5" />}
          </span>
        </span>
        {t.history.selectAll}
      </label>
      {selected.size > 0 && (
        <button
          type="button"
          onClick={remove}
          disabled={busy}
          className="inline-flex h-11 items-center gap-2 rounded-full bg-red px-5 text-callout font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
        >
          <TrashIcon />
          {t.history.deleteSelected(selected.size)}
        </button>
      )}
      {result && <span className="text-subhead text-label-2">{result}</span>}
    </div>
  );
}
