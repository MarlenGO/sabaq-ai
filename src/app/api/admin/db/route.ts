import { z } from "zod";
import { apiError, errorResponse } from "@/lib/api-errors";
import { adminOrError } from "@/lib/admin";
import { dbCleanup, dbJunk } from "@/lib/admin-db";

const schema = z.object({ target: z.enum(dbJunk) });

// POST /api/admin/db { target } — очистка мусора на вкладке «БД»
export async function POST(request: Request) {
  const { admin, error } = await adminOrError();
  if (!admin) return error;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError("badRequest", 400);
  try {
    return Response.json({ removed: await dbCleanup(parsed.data.target) });
  } catch (err) {
    return await errorResponse(err);
  }
}
