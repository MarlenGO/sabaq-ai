import { apiError, errorResponse } from "@/lib/api-errors";
import { currentUser } from "@/lib/auth";
import { markKmzh } from "@/lib/storage/plans";

// POST /api/plans/[id]/kmzh { lesson } — по уроку плана сделан ҚМЖ: в «Жоспар» у него галочка
export async function POST(request: Request, { params }: RouteContext<"/api/plans/[id]/kmzh">) {
  const user = await currentUser();
  if (!user) return apiError("unauthorized", 401);
  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (typeof body?.lesson !== "string") return apiError("badRequest", 400);
  try {
    if (!(await markKmzh(user.id, id, body.lesson))) return apiError("planNotFound", 404);
    return Response.json({ ok: true });
  } catch (error) {
    return await errorResponse(error);
  }
}
