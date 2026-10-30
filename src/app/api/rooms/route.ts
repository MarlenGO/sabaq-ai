import { z } from "zod";
import { roomGameSchema } from "@/types/room";
import { roomQuestions } from "@/lib/rooms";
import { getLesson } from "@/lib/storage/lessons";
import { createRoom } from "@/lib/storage/rooms";

const createSchema = z.object({ lessonId: z.string(), game: roomGameSchema });

// POST /api/rooms — учитель запускает игру через QR
export async function POST(request: Request) {
  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Ойын түрі дұрыс емес." }, { status: 400 });

  const lesson = await getLesson(parsed.data.lessonId);
  if (!lesson) return Response.json({ error: "Сабақ табылмады." }, { status: 404 });

  const questions = roomQuestions(lesson, parsed.data.game);
  if (questions.length === 0) return Response.json({ error: "Сұрақтар жоқ." }, { status: 400 });

  const room = await createRoom({
    lessonId: lesson.id,
    game: parsed.data.game,
    title: lesson.topic,
    language: lesson.language,
    questions,
  });
  return Response.json({ code: room.code });
}
