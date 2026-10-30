import { joinSchema } from "@/types/room";
import { addPlayer, getRoom } from "@/lib/storage/rooms";

// POST /api/rooms/:code/players — ученик вводит имя и входит в игру
export async function POST(request: Request, ctx: RouteContext<"/api/rooms/[code]/players">) {
  const { code } = await ctx.params;
  const room = await getRoom(code);
  if (!room) return Response.json({ error: "Ойын табылмады." }, { status: 404 });
  if (room.status === "finished") return Response.json({ error: "Ойын аяқталды." }, { status: 409 });

  const parsed = joinSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Атыңызды жазыңыз." }, { status: 400 });

  const player = await addPlayer(code, parsed.data.name);
  return Response.json({ playerId: player.id });
}
