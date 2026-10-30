import { lessonRequestSchema, type TopicPackage } from "@/types/topic-package";
import { generatePackageContent } from "@/lib/ai/generate";
import { errorResponse } from "@/lib/api-errors";
import { getLesson, lessonId, saveLesson } from "@/lib/storage/lessons";

// POST /api/lessons — создать урок по теме (или вернуть уже готовый из кэша)
export async function POST(request: Request) {
  const parsed = lessonRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Тақырып пен сыныпты тексеріңіз." }, { status: 400 });
  }

  const id = lessonId(parsed.data);
  const cached = await getLesson(id);
  if (cached) return Response.json({ id, cached: true });

  try {
    const { content, source } = await generatePackageContent(parsed.data);
    const now = new Date().toISOString();
    const lesson: TopicPackage = {
      ...content,
      ...parsed.data,
      schemaVersion: 2,
      id,
      source,
      createdAt: now,
      updatedAt: now,
    };
    await saveLesson(lesson);
    return Response.json({ id, cached: false });
  } catch (error) {
    return errorResponse(error);
  }
}
