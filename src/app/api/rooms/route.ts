import { apiError } from "@/lib/api-errors";
import { z } from "zod";
import { roomGameSchema } from "@/types/room";
import { roomQuestions } from "@/lib/rooms";
import { currentUser } from "@/lib/auth";
import { getLessonFor } from "@/lib/storage/lessons";
import { createRoom } from "@/lib/storage/rooms";

const createSchema = z.object({ lessonId: z.string(), game: roomGameSchema, shuffle: z.boolean().default(false) });

// POST /api/rooms — учитель запускает игру через QR
export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return apiError("unauthorized", 401);
  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError("badGame", 400);

  const lesson = (await getLessonFor(user, parsed.data.lessonId))?.lesson;
  if (!lesson) return apiError("lessonNotFound", 404);

  const questions = roomQuestions(lesson, parsed.data.game);
  if (questions.length === 0) return apiError("noQuestions", 400);

  const room = await createRoom({
    lessonId: lesson.id,
    game: parsed.data.game,
    title: lesson.topic,
    language: lesson.language,
    questions,
    // В «Жарысе» все видят один вопрос на экране — перемешивать нечего
    shuffle: parsed.data.game !== "race" && parsed.data.shuffle,
    live: parsed.data.game === "race" ? { phase: "lobby", index: 0 } : undefined,
  }, user.id);
  return Response.json({ code: room.code });
}
