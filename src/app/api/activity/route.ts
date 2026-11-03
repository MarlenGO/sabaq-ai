import { activityRequestSchema } from "@/types/history";
import { apiError } from "@/lib/api-errors";
import { currentUser } from "@/lib/auth";
import { appendActivity } from "@/lib/storage/activity";
import { getLessonFor } from "@/lib/storage/lessons";

// POST /api/activity — записать в историю учителя скачанный PPTX или игру на экране
export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return apiError("unauthorized", 401);
  const parsed = activityRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError("badRequest", 400);
  if (!(await getLessonFor(user, parsed.data.lessonId))) return apiError("lessonNotFound", 404);

  await appendActivity(user.id, { ...parsed.data, at: new Date().toISOString() });
  return Response.json({ ok: true });
}
