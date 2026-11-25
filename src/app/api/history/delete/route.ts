import { historySelectionSchema } from "@/types/history";
import { apiError } from "@/lib/api-errors";
import { currentUser } from "@/lib/auth";
import { deleteSelection } from "@/lib/storage/history-delete";

// POST /api/history/delete — учитель удаляет отмеченное в своей истории
export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return apiError("unauthorized", 401);
  const parsed = historySelectionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError("badRequest", 400);
  const removed = await deleteSelection(parsed.data, user.id);
  return Response.json({ removed });
}
