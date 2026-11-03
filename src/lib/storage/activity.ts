import { appendFile, mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { activitySchema, type Activity } from "@/types/history";

// Журнал событий в одном файле data/activity.jsonl: одна строка — одно событие.
// Строки только дописываются в конец, поэтому одновременные записи не мешают
// друг другу. В базе данных это станет таблицей activity.

const DIR = path.join(process.cwd(), "data");
const FILE = path.join(DIR, "activity.jsonl");

export async function appendActivity(entry: Activity) {
  await mkdir(DIR, { recursive: true });
  await appendFile(FILE, JSON.stringify(entry) + "\n", "utf8");
}

export async function listActivity(): Promise<Activity[]> {
  const text = await readFile(FILE, "utf8").catch(() => "");
  return text.split("\n").flatMap((line) => {
    if (!line.trim()) return [];
    try {
      const parsed = activitySchema.safeParse(JSON.parse(line));
      return parsed.success ? [parsed.data] : [];
    } catch {
      return [];
    }
  });
}
