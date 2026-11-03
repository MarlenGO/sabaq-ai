// Даты в истории считаем в часовом поясе Казахстана — одинаково на сервере
// (в том числе на Vercel, где часы в UTC) и в браузере.
// С 1 марта 2024 года весь Казахстан живёт по UTC+5. Название «Asia/Almaty»
// не используем: в старых базах поясов (например, в Node.js 20.11) оно
// ещё равно UTC+6. «Etc/GMT-5» — это ровно UTC+5 (знак в этом формате обратный).
export const TIME_ZONE = "Etc/GMT-5";

// Числа собираем сами, а не через локаль «kk-KZ»: в Node.js нет полных данных
// казахской локали, и сервер писал «2026 M10 30». Так везде одинаково: 30.10.2026 17:08.
function parts(date: string | Date) {
  const values = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: TIME_ZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(new Date(date))
      .map((p) => [p.type, p.value]),
  );
  return values as Record<"year" | "month" | "day" | "hour" | "minute", string>;
}

/** Ключ дня вида 2026-11-02 — для группировки событий по дням */
export function dayKey(date: string | Date) {
  const { year, month, day } = parts(date);
  return `${year}-${month}-${day}`;
}

/** 30.10.2026 */
export function dateOf(date: string | Date) {
  const { year, month, day } = parts(date);
  return `${day}.${month}.${year}`;
}

/** 17:08 */
export function timeOf(date: string | Date) {
  const { hour, minute } = parts(date);
  return `${hour}:${minute}`;
}

/** 30.10.2026 17:08 */
export const dateTimeOf = (date: string | Date) => `${dateOf(date)} ${timeOf(date)}`;

/** Ключи «сегодня» и «вчера» на текущий момент */
export function todayKeys() {
  const now = Date.now();
  return { today: dayKey(new Date(now)), yesterday: dayKey(new Date(now - 86_400_000)) };
}

/** 2026-10-30 → 30.10.2026 («Сегодня/Вчера» подставляет список истории из словаря) */
export function dayLabel(key: string) {
  const [year, month, day] = key.split("-");
  return `${day}.${month}.${year}`;
}
