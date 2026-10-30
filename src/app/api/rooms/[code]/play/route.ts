import { toPublicRoom } from "@/lib/rooms";
import { getPlayer, getRoom } from "@/lib/storage/rooms";

// GET /api/rooms/:code/play?player=… — для телефона ученика:
// вопросы без правильных ответов и, если ученик уже играл, его прогресс
// (чтобы после случайного обновления страницы продолжить с того же места).
export async function GET(request: Request, ctx: RouteContext<"/api/rooms/[code]/play">) {
  const { code } = await ctx.params;
  const room = await getRoom(code);
  if (!room) return Response.json({ error: "Ойын табылмады. Кодты тексеріңіз." }, { status: 404 });

  const playerId = new URL(request.url).searchParams.get("player");
  const player = playerId ? await getPlayer(code, playerId) : null;

  return Response.json({
    room: toPublicRoom(room),
    player: player && { id: player.id, name: player.name, answers: player.answers },
  });
}
