"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { CheckIcon, ChevronDownIcon } from "@/components/ui/Icons";

// Выбор из списка во всплывающем окне (popover): кнопка показывает выбранное,
// по нажатию — список вариантов, выбранный отмечен галочкой.
// Закрывается после выбора, по нажатию мимо и клавишей Esc.

export interface PopoverOption<T extends string> {
  value: T;
  label: ReactNode;
  /** Подпись для экранного диктора, если label — не текст */
  ariaLabel?: string;
}

export function PopoverSelect<T extends string>(props: {
  value: T;
  onChange: (value: T) => void;
  options: PopoverOption<T>[];
  ariaLabel: string;
  /** Что написать на кнопке вместо выбранного варианта */
  trigger?: ReactNode;
  /** На всю ширину, как поле формы (иначе — небольшая «таблетка») */
  full?: boolean;
  /** Просто текст значения со стрелкой, без подложки — для строки списка настроек */
  inline?: boolean;
  /** Открывать вверх — для меню внизу экрана */
  up?: boolean;
  /** Прижать список к правому краю кнопки — для панели сверху справа */
  alignRight?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const current = props.options.find((option) => option.value === props.value);

  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (!box.current?.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);

  const button = props.inline
    ? "min-h-11 rounded-lg px-2 text-callout font-semibold text-accent hover:bg-accent/10"
    : props.full
      ? "min-h-11 w-full rounded-xl bg-fill px-4 py-2 text-callout font-semibold hover:bg-accent/15"
      : "h-9 rounded-full bg-fill pl-3 pr-2 text-footnote font-semibold hover:bg-accent/15";

  return (
    <div ref={box} className={`relative ${props.full ? "w-full" : ""}`}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={props.ariaLabel}
        title={props.ariaLabel}
        onClick={() => setOpen(!open)}
        className={`flex items-center justify-between gap-1.5 text-left transition ${props.inline ? "" : "text-label"} ${button}`}
      >
        <span className="truncate">{props.trigger ?? current?.label}</span>
        <ChevronDownIcon className={`size-4 shrink-0 transition ${props.inline ? "" : "text-label-2"} ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div
          role="listbox"
          aria-label={props.ariaLabel}
          className={`absolute z-50 max-h-[60vh] w-max min-w-full overflow-y-auto rounded-xl bg-surface p-1.5 shadow-card ring-1 ring-separator ${
            props.up ? "bottom-full mb-1.5" : "top-full mt-1.5"
          } ${props.alignRight ? "right-0" : "left-0"}`}
        >
          {props.options.map((option) => {
            const selected = option.value === props.value;
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={selected}
                aria-label={option.ariaLabel}
                onClick={() => {
                  setOpen(false);
                  if (!selected) props.onChange(option.value);
                }}
                className={`flex min-h-11 w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-callout transition hover:bg-fill ${
                  selected ? "font-semibold text-accent" : "text-label"
                }`}
              >
                {option.label}
                {selected ? <CheckIcon className="size-4 shrink-0" /> : <span className="size-4 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
