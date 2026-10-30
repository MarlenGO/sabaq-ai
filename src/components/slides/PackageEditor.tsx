"use client";

import { limits, type Term, type TopicPackage } from "@/types/topic-package";
import { Button } from "@/components/ui/Button";
import { PlusIcon, TrashIcon } from "@/components/ui/Icons";
import { confirmDelete, fieldClass } from "@/components/ui/field";

// Конструктор слайдов: учитель правит пакет темы, а предпросмотр строится
// из него же, поэтому правка сразу видна и в слайдах, и в играх.

export function PackageEditor({ pkg, onChange }: { pkg: TopicPackage; onChange: (pkg: TopicPackage) => void }) {
  const setTerm = (index: number, patch: Partial<Term>) =>
    onChange({ ...pkg, terms: pkg.terms.map((t, i) => (i === index ? { ...t, ...patch } : t)) });

  const removeTerm = (index: number) => {
    if (!confirmDelete(`«${pkg.terms[index].term}» терминін`)) return;
    onChange({ ...pkg, terms: pkg.terms.filter((_, i) => i !== index) });
  };

  const canRemoveTerm = pkg.terms.length > limits.terms[0];
  const canAddTerm = pkg.terms.length < limits.terms[1];

  return (
    <div className="flex flex-col gap-6">
      <label className="flex flex-col gap-2">
        <span className="text-subhead font-semibold">Тақырып</span>
        <input className={fieldClass} value={pkg.topic} onChange={(e) => onChange({ ...pkg, topic: e.target.value })} />
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-subhead font-semibold">Анықтама</span>
        <textarea
          className={`${fieldClass} min-h-28 resize-y`}
          value={pkg.definition}
          onChange={(e) => onChange({ ...pkg, definition: e.target.value })}
        />
      </label>

      {pkg.formula && (
        <label className="flex flex-col gap-2">
          <span className="text-subhead font-semibold">Формула</span>
          <input
            className={`${fieldClass} font-mono`}
            value={pkg.formula.expression}
            onChange={(e) => pkg.formula && onChange({ ...pkg, formula: { ...pkg.formula, expression: e.target.value } })}
          />
        </label>
      )}

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-2 text-subhead font-semibold">Терминдер</legend>
        {pkg.terms.map((term, i) => (
          <div key={i} className="flex items-start gap-2 rounded-2xl bg-fill/60 p-3">
            <div className="grid flex-1 gap-2 sm:grid-cols-[1fr_2fr]">
              <input
                className={`${fieldClass} bg-surface font-semibold`}
                value={term.term}
                placeholder="Термин"
                aria-label={`${i + 1}-термин`}
                onChange={(e) => setTerm(i, { term: e.target.value })}
              />
              <input
                className={`${fieldClass} bg-surface`}
                value={term.explanation}
                placeholder="Түсіндірмесі"
                aria-label={`${i + 1}-терминнің түсіндірмесі`}
                onChange={(e) => setTerm(i, { explanation: e.target.value })}
              />
            </div>
            {canRemoveTerm && <DeleteButton label={`«${term.term}» терминін өшіру`} onClick={() => removeTerm(i)} />}
          </div>
        ))}
        {canAddTerm && (
          <Button
            variant="tinted"
            className="self-start"
            onClick={() => onChange({ ...pkg, terms: [...pkg.terms, { term: "", explanation: "" }] })}
          >
            <PlusIcon />
            Термин қосу
          </Button>
        )}
      </fieldset>
    </div>
  );
}

export function DeleteButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title="Өшіру"
      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-red transition hover:bg-red/10"
    >
      <TrashIcon />
    </button>
  );
}
