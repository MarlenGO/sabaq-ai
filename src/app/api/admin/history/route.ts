import { z } from "zod";
import { apiError } from "@/lib/api-errors";
import { adminOrError, deleteHistory } from "@/lib/admin";

// Проверка формата не даёт подставить в запрос к базе чужие условия
const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("lesson"), id: z.string().regex(/^[a-f0-9]{12}$/) }),
  z.object({ action: z.literal("room"), code: z.string().regex(/^\d{6}$/) }),
  z.object({ action: z.literal("teacher"), userId: z.uuid() }),
]);

// POST /api/admin/history — админ удаляет урок, QR-игру или всю историю учителя
export async function POST(request: Request) {
  const { admin, error } = await adminOrError();
  if (!admin) return error;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError("badRequest", 400);
  const removed = await deleteHistory(parsed.data);
  return Response.json({ removed });
}
