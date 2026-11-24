import { z } from "zod";
import { apiError } from "@/lib/api-errors";
import { adminOrError, cleanup, cleanupTargets } from "@/lib/admin";

const schema = z.object({ target: z.enum(cleanupTargets) });

// POST /api/admin/cleanup — «Тарихты тазалау» на вкладке админки
export async function POST(request: Request) {
  const { admin, error } = await adminOrError();
  if (!admin) return error;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError("badRequest", 400);
  const removed = await cleanup(parsed.data.target);
  return Response.json({ removed });
}
