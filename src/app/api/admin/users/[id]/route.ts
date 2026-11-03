import { z } from "zod";
import { apiError } from "@/lib/api-errors";
import { updateUser } from "@/lib/auth";
import { adminOrError, isSelf } from "@/lib/admin";

const schema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  role: z.enum(["admin", "teacher"]).optional(),
  status: z.enum(["pending", "active", "blocked"]).optional(),
  daily_limit: z.number().int().min(0).max(10000).nullable().optional(),
  password: z.string().min(4).max(200).optional(),
});

// PATCH /api/admin/users/:id — одобрить, заблокировать, сменить роль, лимит или пароль
export async function PATCH(request: Request, ctx: RouteContext<"/api/admin/users/[id]">) {
  const { admin, error } = await adminOrError();
  if (!admin) return error;
  const { id } = await ctx.params;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError("badRequest", 400);
  // Себя не блокируем и не лишаем админа — иначе можно случайно закрыть себе админку
  if (isSelf(admin, id) && (parsed.data.status === "blocked" || parsed.data.role === "teacher")) {
    return apiError("forbidden", 403);
  }
  await updateUser(id, parsed.data);
  return Response.json({ ok: true });
}
