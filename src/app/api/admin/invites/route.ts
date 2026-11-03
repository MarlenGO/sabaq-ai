import { randomBytes } from "node:crypto";
import { z } from "zod";
import { apiError } from "@/lib/api-errors";
import { insert, isDuplicate } from "@/lib/db";
import { adminOrError } from "@/lib/admin";

const schema = z.object({
  code: z.string().trim().max(30).optional(),
  maxUses: z.number().int().min(1).max(1000).nullable().optional(),
});

// POST /api/admin/invites — код приглашения: учитель с ним сразу активен
export async function POST(request: Request) {
  const { admin, error } = await adminOrError();
  if (!admin) return error;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError("badRequest", 400);
  const code = (parsed.data.code || `SABAQ-${randomBytes(3).toString("hex")}`).toUpperCase().replace(/\s+/g, "-");
  try {
    await insert("invites", { code, created_by: admin.id, max_uses: parsed.data.maxUses ?? null });
  } catch (e) {
    if (isDuplicate(e)) return apiError("loginTaken", 409);
    throw e;
  }
  return Response.json({ code });
}
