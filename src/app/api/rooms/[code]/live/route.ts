import { z } from "zod";
import { apiError } from "@/lib/api-errors";
import type { Room } from "@/types/room";
import { updateRoom } from "@/lib/storage/rooms";

const actionSchema = z.object({ action: z.enum(["start", "reveal", "next"]) });

// POST /api/rooms/:code/live — учитель ведёт «Жарыс»:
// start — первый вопрос, reveal — показать ответ, next — следующий вопрос (или итоги)
export async function POST(request: Request, ctx: RouteContext<"/api/rooms/[code]/live">) {
  const { code } = await ctx.params;
  const parsed = actionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError("badRequest", 400);
  const { action } = parsed.data;

  const room = await updateRoom(code, (room): Room | null => {
    const live = room.live;
    if (!live || room.status === "finished") return null;
    const now = new Date().toISOString();
    if (action === "start" && live.phase === "lobby") {
      return { ...room, live: { phase: "question", index: 0, startedAt: now } };
    }
    if (action === "reveal" && live.phase === "question") return { ...room, live: { ...live, phase: "reveal" } };
    if (action === "next" && live.phase === "reveal") {
      const index = live.index + 1;
      if (index >= room.questions.length) return { ...room, status: "finished", live: { ...live, phase: "finished" } };
      return { ...room, live: { phase: "question", index, startedAt: now } };
    }
    // Повторное нажатие (или два окна учителя) — ничего не меняем
    return room;
  });
  if (!room) return apiError("roomNotFound", 404);
  return Response.json({ live: room.live });
}
