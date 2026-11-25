import type { HistorySelection } from "@/types/history";
import { count, q, remove } from "@/lib/db";

const inList = (ids: (string | number)[]) => `in.(${ids.map(q).join(",")})`;

/**
 * Удалить отмеченное в истории. Урок удаляется вместе с его QR-играми и событиями
 * журнала. ownerId — учитель удаляет только своё; без него (админка) — у любого.
 * Возвращает, сколько записей удалено.
 */
export async function deleteSelection(sel: HistorySelection, ownerId?: string) {
  const owner = ownerId ? `&owner_id=eq.${q(ownerId)}` : "";
  const user = ownerId ? `&user_id=eq.${q(ownerId)}` : "";
  const plan: { table: string; query: string }[] = [];
  if (sel.lessons.length) {
    const ids = inList(sel.lessons);
    plan.push(
      { table: "rooms", query: `lesson_id=${ids}${owner}` },
      { table: "activity", query: `data->>lessonId=${ids}${user}` },
      { table: "lessons", query: `id=${ids}${owner}` },
    );
  }
  if (sel.rooms.length) plan.push({ table: "rooms", query: `code=${inList(sel.rooms)}${owner}` });
  if (sel.activity.length) plan.push({ table: "activity", query: `id=${inList(sel.activity)}${user}` });

  let removed = 0;
  for (const { table, query } of plan) {
    removed += await count(table, query);
    await remove(table, query);
  }
  return removed;
}
