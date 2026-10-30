// Общий стиль полей ввода в конструкторах: крупные, с заметным фокусом
export const fieldClass =
  "w-full rounded-xl bg-fill px-4 py-3 text-body outline-none placeholder:text-label-3 focus:ring-4 focus:ring-accent/25";

// Подтверждение перед удалением, чтобы случайное нажатие ничего не стёрло
export const confirmDelete = (what: string) => window.confirm(`${what} өшіреміз бе?`);
