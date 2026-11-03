import { lessonRequestSchema, type TopicPackage } from "@/types/topic-package";
import { generateDeck, generatePackageContent } from "@/lib/ai/generate";
import { hasAiKey } from "@/lib/ai/gemini";
import { apiError, errorResponse } from "@/lib/api-errors";
import { currentUser } from "@/lib/auth";
import { emptyContent } from "@/lib/demo";
import { fillSlideImages } from "@/lib/slide-images";
import { cacheKey, createLesson, findOwnLesson, getCached, newLessonId, putCached } from "@/lib/storage/lessons";
import { hasQuota, tracked } from "@/lib/storage/usage";

// POST /api/lessons — создать урок по теме. Если этот учитель уже делал эту тему —
// открываем его урок. Если тему делал кто-то другой — копируем готовое из кэша AI.
export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return apiError("unauthorized", 401);

  const parsed = lessonRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError("badRequest", 400);

  // mode — только для выбора, в уроке его не храним
  const { mode, ...fields } = parsed.data;
  const now = new Date().toISOString();
  const id = newLessonId();
  const draft: TopicPackage = {
    ...emptyContent(fields.language),
    ...fields,
    schemaVersion: 2,
    id,
    source: "empty",
    createdAt: now,
    updatedAt: now,
  };

  // Пустой проект: без AI и без кэша
  if (mode === "empty") {
    await createLesson(draft, user.id);
    return Response.json({ id, cached: false });
  }

  const key = cacheKey(parsed.data);
  const own = await findOwnLesson(user.id, key);
  // Демо-урок (создан, когда ключа AI ещё не было) не открываем: с ключом делаем настоящий
  if (own && !(own.source === "demo" && hasAiKey())) return Response.json({ id: own.id, cached: true });

  try {
    const cached = await getCached(key);
    let lesson: TopicPackage;
    if (cached) {
      lesson = { ...draft, ...cached.content, deck: cached.deck, source: "ai" };
    } else {
      if (hasAiKey() && !(await hasQuota(user))) return apiError("dailyLimit", 429);
      // Содержание темы и тексты слайдов-заготовок пишутся параллельно: так не дольше.
      // Заготовки — не главное: если AI с ними не справился, остаются подсказки.
      const [{ content, source }, deck] = await Promise.all([
        hasAiKey() ? tracked(user.id, "lesson", () => generatePackageContent(parsed.data)) : generatePackageContent(parsed.data),
        hasAiKey() ? tracked(user.id, "deck", () => generateDeck(draft)).catch(() => undefined) : undefined,
      ]);
      lesson = { ...draft, ...content, source, deck };
      // Картинки на слайды «текст + рисунок» и «большой рисунок» — из Wikimedia
      lesson = await fillSlideImages(lesson);
      if (source === "ai") await putCached(key, { content, deck: lesson.deck });
    }
    await createLesson(lesson, user.id, key);
    return Response.json({ id, cached: Boolean(cached) });
  } catch (error) {
    return await errorResponse(error);
  }
}
