import { historySelectionSchema } from "@/types/history";
import { apiError } from "@/lib/api-errors";
import { adminOrError } from "@/lib/admin";
import { deleteSelection } from "@/lib/storage/history-delete";

// POST /api/admin/history — админ удаляет отмеченные уроки и QR-игры любых учителей
export async function POST(request: Request) {
  const { admin, error } = await adminOrError();
  if (!admin) return error;
  const parsed = historySelectionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError("badRequest", 400);
  const removed = await deleteSelection(parsed.data);
  return Response.json({ removed });
}
