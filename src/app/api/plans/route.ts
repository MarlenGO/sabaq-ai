import { apiError, errorResponse } from "@/lib/api-errors";
import { currentUser } from "@/lib/auth";
import { createPlan, listPlans } from "@/lib/storage/plans";
import { planInputSchema } from "@/types/plan";

// GET /api/plans — планы учителя заново: «Жоспар» перечитывает их, когда к нему возвращаются
// (галочка ҚМЖ ставится на другой странице)
export async function GET() {
  const user = await currentUser();
  if (!user) return apiError("unauthorized", 401);
  try {
    return Response.json({ plans: await listPlans(user.id) });
  } catch (error) {
    return await errorResponse(error);
  }
}

// POST /api/plans — сохранить проверенный учителем план (после разбора файла)
export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return apiError("unauthorized", 401);
  const parsed = planInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError("incomplete", 400);
  try {
    return Response.json({ id: await createPlan(user.id, parsed.data) });
  } catch (error) {
    return await errorResponse(error);
  }
}
