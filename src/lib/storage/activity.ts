import { activitySchema, type Activity } from "@/types/history";
import { insert, q, select } from "@/lib/db";

// Журнал событий учителя (таблица activity): скачанный PPTX, игра на экране.
// Строки только добавляются — одновременные записи не мешают друг другу.

export async function appendActivity(userId: string, entry: Activity) {
  await insert("activity", { user_id: userId, data: entry, at: entry.at });
}

export async function listActivity(userId: string): Promise<Activity[]> {
  const rows = await select<{ data: unknown }>("activity", `user_id=eq.${q(userId)}&select=data&order=at.desc&limit=500`);
  return rows.flatMap((row) => {
    const parsed = activitySchema.safeParse(row.data);
    return parsed.success ? [parsed.data] : [];
  });
}
