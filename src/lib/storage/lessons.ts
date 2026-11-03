import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { topicPackageSchema, type LessonRequest, type TopicPackage } from "@/types/topic-package";

// Хранилище уроков в JSON-файлах: data/lessons/<id>.json (папка в .gitignore).
// Остальной код пользуется только функциями ниже, поэтому переход на
// PostgreSQL — это замена одного этого файла.
//
// Важно: на Vercel файловая система не сохраняется между запросами,
// так что перед публикацией сайта этот файл заменим на базу данных.

const DIR = path.join(process.cwd(), "data", "lessons");

// id — короткий хэш от «тема + класс + язык + предмет». Одинаковый запрос даёт
// тот же id, поэтому повторная генерация не нужна: это и есть кэш тем.
// Физика — без добавки, чтобы уроки, созданные до выбора предмета, находились по-прежнему.
export function lessonId({ topic, grade, language, subject }: LessonRequest) {
  const base = `${topic.trim().toLowerCase().replace(/\s+/g, " ")}|${grade}|${language}`;
  const key = subject === "physics" ? base : `${base}|${subject}`;
  return createHash("sha1").update(key).digest("hex").slice(0, 12);
}

// Проверка формата id защищает от путей вроде "../../secret"
const isValidId = (id: string) => /^[a-f0-9]{12}$/.test(id);
const fileOf = (id: string) => path.join(DIR, `${id}.json`);

export async function getLesson(id: string): Promise<TopicPackage | null> {
  if (!isValidId(id)) return null;
  try {
    const parsed = topicPackageSchema.safeParse(JSON.parse(await readFile(fileOf(id), "utf8")));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export async function saveLesson(lesson: TopicPackage) {
  if (!isValidId(lesson.id)) throw new Error(`Bad lesson id: ${lesson.id}`);
  await mkdir(DIR, { recursive: true });
  await writeFile(fileOf(lesson.id), JSON.stringify(lesson, null, 2), "utf8");
}

export type LessonSummary = Pick<
  TopicPackage,
  "id" | "topic" | "grade" | "language" | "subject" | "source" | "createdAt" | "updatedAt"
>;

/** Уроки, недавно изменённые — первыми. Без limit — все. */
export async function listLessons(limit = Infinity): Promise<LessonSummary[]> {
  const files = await readdir(DIR).catch(() => [] as string[]);
  const lessons = await Promise.all(files.filter((f) => f.endsWith(".json")).map((f) => getLesson(f.slice(0, -5))));
  return lessons
    .filter((l): l is TopicPackage => l !== null)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, limit)
    .map(({ id, topic, grade, language, subject, source, createdAt, updatedAt }) => ({
      id,
      topic,
      grade,
      language,
      subject,
      source,
      createdAt,
      updatedAt,
    }));
}
