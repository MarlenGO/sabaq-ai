import { apiError, errorResponse } from "@/lib/api-errors";
import { currentUser } from "@/lib/auth";
import { deletePlan, savePlan } from "@/lib/storage/plans";
import { planInputSchema } from "@/types/plan";

// PUT /api/plans/[id] — автосохранение правок (тема, дата, новый или удалённый урок)
export async function PUT(request: Request, { params }: RouteContext<"/api/plans/[id]">) {
  const user = await currentUser();
  if (!user) return apiError("unauthorized", 401);
  const { id } = await params;
  const parsed = planInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError("incomplete", 400);
  try {
    if (!(await savePlan(user.id, id, parsed.data))) return apiError("planNotFound", 404);
    return Response.json({ ok: true });
  } catch (error) {
    return await errorResponse(error);
  }
}

// DELETE /api/plans/[id] — удалить план целиком (страница спрашивает подтверждение)
export async function DELETE(_request: Request, { params }: RouteContext<"/api/plans/[id]">) {
  const user = await currentUser();
  if (!user) return apiError("unauthorized", 401);
  const { id } = await params;
  try {
    await deletePlan(user.id, id);
    return Response.json({ ok: true });
  } catch (error) {
    return await errorResponse(error);
  }
}
