import type { HistoryEntry } from "@/types/history";
import { toResult } from "@/lib/rooms";
import { listActivity } from "@/lib/storage/activity";
import { listLessons } from "@/lib/storage/lessons";
import { listPlayers, listRooms } from "@/lib/storage/rooms";

// История собирается из трёх источников: уроки (когда созданы),
// комнаты QR-игр (кто играл и как) и журнал (PPTX, игры на экране).
// Новые события — сверху.
export async function buildHistory(): Promise<HistoryEntry[]> {
  const [lessons, rooms, activity] = await Promise.all([listLessons(), listRooms(), listActivity()]);
  const byId = new Map(lessons.map((l) => [l.id, l]));
  const entries: HistoryEntry[] = [];

  for (const l of lessons) {
    entries.push({
      kind: "lesson",
      at: l.createdAt,
      lessonId: l.id,
      topic: l.topic,
      grade: l.grade,
      subject: l.subject,
      language: l.language,
      demo: l.source === "demo",
    });
  }

  for (const a of activity) {
    const lesson = byId.get(a.lessonId);
    if (!lesson) continue; // урок удалён — событие не показываем
    const base = { at: a.at, lessonId: a.lessonId, topic: lesson.topic, grade: lesson.grade };
    if (a.type === "pptx") {
      entries.push({ ...base, kind: "pptx", templateId: a.templateId });
    } else {
      entries.push({ ...base, kind: "game", game: a.game, mode: "screen" });
    }
  }

  await Promise.all(
    rooms.map(async (room) => {
      const lesson = byId.get(room.lessonId);
      if (!lesson) return;
      const results = (await listPlayers(room.code)).map(toResult);
      const total = room.questions.length;
      const averagePercent = results.length
        ? Math.round((results.reduce((sum, r) => sum + r.correct, 0) / (results.length * total)) * 100)
        : 0;
      entries.push({
        kind: "game",
        mode: "qr",
        at: room.createdAt,
        lessonId: room.lessonId,
        topic: lesson.topic,
        grade: lesson.grade,
        game: room.game,
        roomCode: room.code,
        players: results.length,
        total,
        averagePercent,
      });
    }),
  );

  return entries.sort((a, b) => b.at.localeCompare(a.at));
}
