import { apiError } from "@/lib/api-errors";
import { raceForStudent, toPublicRoom } from "@/lib/rooms";
import { getPlayer, getRoom, listPlayers } from "@/lib/storage/rooms";

// GET /api/rooms/:code/play?player=… — для телефона ученика:
// вопросы без правильных ответов (в его порядке, если включено перемешивание)
// и, если ученик уже играл, его прогресс — чтобы после случайного обновления
// страницы продолжить с того же места. В «Жарысе» — текущий шаг игры.
export async function GET(request: Request, ctx: RouteContext<"/api/rooms/[code]/play">) {
  const { code } = await ctx.params;
  const room = await getRoom(code);
  if (!room) return apiError("roomNotFoundCode", 404);

  const playerId = new URL(request.url).searchParams.get("player");
  const player = playerId ? await getPlayer(code, playerId) : null;
  // Место в рейтинге нужно только после ответа, поэтому всех читаем только тогда
  const needRank = player && room.live && room.live.phase !== "question";
  const race = room.live && raceForStudent(room, player, needRank ? await listPlayers(code) : []);

  return Response.json({
    room: toPublicRoom(room, player),
    player: player && { id: player.id, name: player.name, answers: player.answers },
    race,
  });
}
