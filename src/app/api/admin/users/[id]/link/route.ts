import { createLoginLink } from "@/lib/auth";
import { adminOrError } from "@/lib/admin";

// POST /api/admin/users/:id/link — одноразовая ссылка для входа без пароля (на 7 дней)
export async function POST(request: Request, ctx: RouteContext<"/api/admin/users/[id]/link">) {
  const { error } = await adminOrError();
  if (error) return error;
  const { id } = await ctx.params;
  const { token, expiresAt } = await createLoginLink(id);
  return Response.json({ url: new URL(`/login/link/${token}`, request.url).toString(), expiresAt });
}
