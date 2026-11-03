import { remove, q } from "@/lib/db";
import { adminOrError } from "@/lib/admin";

// DELETE /api/admin/invites/:code — код больше не действует
export async function DELETE(_request: Request, ctx: RouteContext<"/api/admin/invites/[code]">) {
  const { error } = await adminOrError();
  if (error) return error;
  const { code } = await ctx.params;
  await remove("invites", `code=eq.${q(decodeURIComponent(code))}`);
  return Response.json({ ok: true });
}
