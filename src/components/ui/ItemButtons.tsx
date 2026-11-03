"use client";

import { ChevronDownIcon, ChevronUpIcon, TrashIcon } from "@/components/ui/Icons";
import { useT } from "@/i18n/client";

// Кнопки у элемента списка в конструкторах: удалить и переставить вверх/вниз.
// Стрелки вместо перетаскивания: учителю проще нажать, чем тянуть мышью.

const square = "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition";

export function DeleteButton({ label, onClick }: { label: string; onClick: () => void }) {
  const t = useT();
  return (
    <button type="button" onClick={onClick} aria-label={label} title={t.common.delete} className={`${square} text-red hover:bg-red/10`}>
      <TrashIcon />
    </button>
  );
}

interface MoveButtonsProps {
  index: number;
  count: number;
  onMove: (to: number) => void;
  /** Что двигаем — для подсказки экранного диктора, например «2-сұрақ» */
  what: string;
}

export function MoveButtons({ index, count, onMove, what }: MoveButtonsProps) {
  const t = useT();
  const button = `${square} text-label-2 hover:bg-fill disabled:opacity-30 disabled:hover:bg-transparent`;
  return (
    <span className="flex shrink-0">
      <button
        type="button"
        disabled={index === 0}
        onClick={() => onMove(index - 1)}
        aria-label={`${what}: ${t.editor.moveUp}`}
        title={t.editor.moveUp}
        className={button}
      >
        <ChevronUpIcon />
      </button>
      <button
        type="button"
        disabled={index === count - 1}
        onClick={() => onMove(index + 1)}
        aria-label={`${what}: ${t.editor.moveDown}`}
        title={t.editor.moveDown}
        className={button}
      >
        <ChevronDownIcon />
      </button>
    </span>
  );
}
