"use client";

import { SearchIcon } from "@/components/ui/Icons";

// Поле поиска со значком лупы: фильтрует карточки на странице сразу, без кнопки «Найти».
export function SearchField(props: { value: string; onChange: (value: string) => void; placeholder: string; label: string }) {
  return (
    <label className="relative block w-full sm:w-72">
      <SearchIcon className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-label-2" />
      <input
        type="search"
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        placeholder={props.placeholder}
        aria-label={props.label}
        className="h-12 w-full rounded-full bg-surface pl-11 pr-4 text-body outline-none placeholder:text-label-3 focus:ring-4 focus:ring-accent/25"
      />
    </label>
  );
}
