import { sortResults, toResult } from "@/lib/rooms";
import { finishRoom, getRoom, listPlayers } from "@/lib/storage/rooms";

// GET /api/rooms/:code — таблица результатов для экрана учителя
export async function GET(_request: Request, ctx: RouteContext<"/api/rooms/[code]">) {
  const { code } = await ctx.params;
  const room = await getRoom(code);
  if (!room) return Response.json({ error: "Ойын табылмады." }, { status: 404 });

  const players = await listPlayers(code);
  return Response.json({
    code: room.code,
    game: room.game,
    title: room.title,
    status: room.status,
    total: room.questions.length,
    results: sortResults(players.map(toResult)),
  });
}

// PATCH /api/rooms/:code — учитель завершает игру
export async function PATCH(_request: Request, ctx: RouteContext<"/api/rooms/[code]">) {
  const { code } = await ctx.params;
  const room = await finishRoom(code);
  if (!room) return Response.json({ error: "Ойын табылмады." }, { status: 404 });
  return Response.json({ status: room.status });
}
