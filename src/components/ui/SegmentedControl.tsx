"use client";

import type { ReactNode } from "react";

// Переключатель-сегменты из iOS: серая подложка, выбранный пункт — белая «таблетка».
interface SegmentedControlProps<T extends string> {
  options: { value: T; label: ReactNode; icon?: ReactNode; ariaLabel?: string }[];
  /** null — пока не известно (например, до загрузки настроек в браузере) */
  value: T | null;
  onChange: (value: T) => void;
  size?: "md" | "lg";
  ariaLabel?: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  size = "md",
  ariaLabel,
}: SegmentedControlProps<T>) {
  const item = size === "lg" ? "px-5 py-2 text-callout" : "px-3.5 py-1 text-footnote";

  return (
    <div role="radiogroup" aria-label={ariaLabel} className="inline-flex rounded-[0.6rem] bg-fill p-0.5">
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={option.ariaLabel}
            onClick={() => onChange(option.value)}
            className={`flex items-center justify-center gap-1.5 rounded-[0.45rem] font-medium transition ${item} ${
              selected ? "bg-surface text-label shadow-sm" : "text-label-2 hover:text-label"
            }`}
          >
            {option.icon}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
