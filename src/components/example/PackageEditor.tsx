"use client";

import type { Term, TopicPackage } from "@/types/topic-package";
import { Button } from "@/components/ui/Button";
import { PlusIcon, TrashIcon } from "@/components/ui/Icons";

// Конструктор: учитель правит пакет темы, а предпросмотр строится из него же,
// поэтому правка сразу видна и в слайдах (и позже — в играх).

const field =
  "w-full rounded-xl bg-fill px-4 py-3 text-body outline-none placeholder:text-label-3 focus:ring-4 focus:ring-accent/25";

export function PackageEditor({ pkg, onChange }: { pkg: TopicPackage; onChange: (pkg: TopicPackage) => void }) {
  const setTerm = (index: number, patch: Partial<Term>) =>
    onChange({ ...pkg, terms: pkg.terms.map((t, i) => (i === index ? { ...t, ...patch } : t)) });

  const removeTerm = (index: number) => {
    const term = pkg.terms[index];
    // Подтверждение, чтобы случайное нажатие ничего не удалило
    if (!window.confirm(`«${term.term}» терминін өшіреміз бе?`)) return;
    onChange({ ...pkg, terms: pkg.terms.filter((_, i) => i !== index) });
  };

  return (
    <div className="flex flex-col gap-6">
      <label className="flex flex-col gap-2">
        <span className="text-subhead font-semibold">Тақырып</span>
        <input className={field} value={pkg.topic} onChange={(e) => onChange({ ...pkg, topic: e.target.value })} />
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-subhead font-semibold">Анықтама</span>
        <textarea
          className={`${field} min-h-28 resize-y`}
          value={pkg.definition}
          onChange={(e) => onChange({ ...pkg, definition: e.target.value })}
        />
      </label>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-2 text-subhead font-semibold">Терминдер</legend>
        {pkg.terms.map((term, i) => (
          <div key={i} className="flex items-start gap-2 rounded-2xl bg-fill/60 p-3">
            <div className="grid flex-1 gap-2 sm:grid-cols-[1fr_2fr]">
              <input
                className={`${field} bg-surface font-semibold`}
                value={term.term}
                aria-label={`${i + 1}-термин`}
                onChange={(e) => setTerm(i, { term: e.target.value })}
              />
              <input
                className={`${field} bg-surface`}
                value={term.explanation}
                aria-label={`${i + 1}-терминнің түсіндірмесі`}
                onChange={(e) => setTerm(i, { explanation: e.target.value })}
              />
            </div>
            <button
              type="button"
              onClick={() => removeTerm(i)}
              aria-label={`«${term.term}» терминін өшіру`}
              title="Өшіру"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-red transition hover:bg-red/10"
            >
              <TrashIcon />
            </button>
          </div>
        ))}
        <Button
          variant="tinted"
          className="self-start"
          onClick={() => onChange({ ...pkg, terms: [...pkg.terms, { term: "", explanation: "" }] })}
        >
          <PlusIcon />
          Термин қосу
        </Button>
      </fieldset>
    </div>
  );
}
