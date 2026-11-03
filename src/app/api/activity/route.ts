import { activityRequestSchema } from "@/types/history";
import { appendActivity } from "@/lib/storage/activity";
import { getLesson } from "@/lib/storage/lessons";

// POST /api/activity — записать в историю скачанный PPTX или игру на экране
export async function POST(request: Request) {
  const parsed = activityRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Bad event" }, { status: 400 });
  if (!(await getLesson(parsed.data.lessonId))) return Response.json({ error: "No lesson" }, { status: 404 });

  await appendActivity({ ...parsed.data, at: new Date().toISOString() });
  return Response.json({ ok: true });
}
