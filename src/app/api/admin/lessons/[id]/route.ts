import { z } from "zod";
import { apiError } from "@/lib/api-errors";
import { setFeatured } from "@/lib/storage/lessons";
import { adminOrError } from "@/lib/admin";

// PATCH /api/admin/lessons/:id — добавить урок в библиотеку (видна всем учителям) или убрать
export async function PATCH(request: Request, ctx: RouteContext<"/api/admin/lessons/[id]">) {
  const { error } = await adminOrError();
  if (error) return error;
  const { id } = await ctx.params;
  const parsed = z.object({ featured: z.boolean() }).safeParse(await request.json().catch(() => null));
  if (!parsed.success || !/^[a-f0-9]{12}$/.test(id)) return apiError("badRequest", 400);
  await setFeatured(id, parsed.data.featured);
  return Response.json({ ok: true });
}
