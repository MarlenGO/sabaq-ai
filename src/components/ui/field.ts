// Общий стиль полей ввода в конструкторах: крупные, с заметным фокусом
export const fieldClass =
  "w-full rounded-xl bg-fill px-4 py-3 text-body outline-none placeholder:text-label-3 focus:ring-4 focus:ring-accent/25";

// Подтверждение перед удалением, чтобы случайное нажатие ничего не стёрло
export const confirmDelete = (question: string) => window.confirm(question);

/** Переставить элемент списка на соседнее место (кнопки ↑ ↓ в конструкторах) */
export function moveItem<T>(list: T[], from: number, to: number) {
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  [next[from], next[to]] = [next[to], next[from]];
  return next;
}

export function replaceAt<T>(list: T[], index: number, item: T) {
  return list.map((x, i) => (i === index ? item : x));
}
