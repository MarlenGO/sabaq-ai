import { apiError } from "@/lib/api-errors";
import { joinSchema } from "@/types/room";
import { shuffleFor } from "@/lib/rooms";
import { addPlayer, getRoom } from "@/lib/storage/rooms";

// POST /api/rooms/:code/players — ученик вводит имя и входит в игру
export async function POST(request: Request, ctx: RouteContext<"/api/rooms/[code]/players">) {
  const { code } = await ctx.params;
  const room = await getRoom(code);
  if (!room) return apiError("roomNotFound", 404);
  if (room.status === "finished") return apiError("roomFinished", 409);

  const parsed = joinSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError("nameRequired", 400);

  const player = await addPlayer(code, parsed.data.name, shuffleFor(room));
  return Response.json({ playerId: player.id });
}
