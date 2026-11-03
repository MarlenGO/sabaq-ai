import { lessonRequestSchema, type TopicPackage } from "@/types/topic-package";
import { generateDeck, generatePackageContent } from "@/lib/ai/generate";
import { hasAiKey } from "@/lib/ai/gemini";
import { apiError, errorResponse } from "@/lib/api-errors";
import { emptyContent } from "@/lib/demo";
import { getLesson, lessonId, newLessonId, saveLesson } from "@/lib/storage/lessons";

// POST /api/lessons — создать урок по теме (или вернуть уже готовый из кэша)
export async function POST(request: Request) {
  const parsed = lessonRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return apiError("badRequest", 400);
  }

  // mode — только для выбора, в уроке его не храним
  const { mode, ...fields } = parsed.data;
  const now = new Date().toISOString();

  // Пустой проект: без AI и без кэша — у каждого свой id
  if (mode === "empty") {
    const id = newLessonId();
    await saveLesson({
      ...emptyContent(fields.language),
      ...fields,
      schemaVersion: 2,
      id,
      source: "empty",
      createdAt: now,
      updatedAt: now,
    });
    return Response.json({ id, cached: false });
  }

  const id = lessonId(parsed.data);
  const cached = await getLesson(id);
  // Демо-урок (создан, когда ключа AI ещё не было) не держим в кэше: с ключом делаем настоящий
  if (cached && !(cached.source === "demo" && hasAiKey())) return Response.json({ id, cached: true });

  try {
    // Содержание темы и тексты слайдов-заготовок пишутся параллельно: так не дольше.
    // Заготовки — не главное: если AI с ними не справился, остаются подсказки.
    const draft: TopicPackage = { ...emptyContent(fields.language), ...fields, schemaVersion: 2, id, source: "ai", createdAt: now, updatedAt: now };
    const [{ content, source }, deck] = await Promise.all([
      generatePackageContent(parsed.data),
      hasAiKey()
        ? generateDeck(draft).catch((error) => {
            console.warn("Deck generation failed", error);
            return undefined;
          })
        : undefined,
    ]);
    const lesson: TopicPackage = { ...draft, ...content, source, deck };
    await saveLesson(lesson);
    return Response.json({ id, cached: false });
  } catch (error) {
    return await errorResponse(error);
  }
}
