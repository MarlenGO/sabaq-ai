import { apiError } from "@/lib/api-errors";
import { currentUser } from "@/lib/auth";
import { questionStats, raceForTeacher, sortResults, toResult } from "@/lib/rooms";
import { finishRoom, getRoomWithOwner, listPlayers } from "@/lib/storage/rooms";

// Экран учителя: смотреть результаты и завершать игру может только её учитель (или админ)
async function ownRoom(code: string) {
  const user = await currentUser();
  if (!user) return { error: await apiError("unauthorized", 401) };
  const found = await getRoomWithOwner(code);
  if (!found) return { error: await apiError("roomNotFound", 404) };
  if (found.ownerId !== user.id && user.role !== "admin") return { error: await apiError("forbidden", 403) };
  return { room: found.room };
}

// GET /api/rooms/:code — таблица результатов для экрана учителя
export async function GET(_request: Request, ctx: RouteContext<"/api/rooms/[code]">) {
  const { code } = await ctx.params;
  const { room, error } = await ownRoom(code);
  if (!room) return error;

  const players = await listPlayers(code);
  return Response.json({
    code: room.code,
    game: room.game,
    title: room.title,
    status: room.status,
    total: room.questions.length,
    results: sortResults(players.map(toResult)),
    stats: questionStats(room, players),
    race: room.live && raceForTeacher(room, players),
  });
}

// PATCH /api/rooms/:code — учитель завершает игру
export async function PATCH(_request: Request, ctx: RouteContext<"/api/rooms/[code]">) {
  const { code } = await ctx.params;
  const { room, error } = await ownRoom(code);
  if (!room) return error;
  const finished = await finishRoom(code);
  return Response.json({ status: finished?.status ?? "finished" });
}
