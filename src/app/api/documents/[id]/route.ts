import { apiError, errorResponse } from "@/lib/api-errors";
import { currentUser } from "@/lib/auth";
import { deleteDocument, getDocument, saveDocument } from "@/lib/storage/my-documents";
import { docFieldsSchema } from "@/types/documents";

// «Менің құжаттарым»: один документ учителя (только свой)

// GET /api/documents/[id] — открыть документ из списка: поля формы и ответ AI
export async function GET(_request: Request, { params }: RouteContext<"/api/documents/[id]">) {
  const user = await currentUser();
  if (!user) return apiError("unauthorized", 401);
  const { id } = await params;
  try {
    const doc = await getDocument(user.id, id);
    if (!doc) return apiError("documentNotFound", 404);
    return Response.json(doc);
  } catch (error) {
    return await errorResponse(error);
  }
}

// PUT /api/documents/[id] — автосохранение полей формы (ФИО, мектеп, күні, бөлім…)
export async function PUT(request: Request, { params }: RouteContext<"/api/documents/[id]">) {
  const user = await currentUser();
  if (!user) return apiError("unauthorized", 401);
  const { id } = await params;
  const parsed = docFieldsSchema.safeParse((await request.json().catch(() => null))?.fields);
  if (!parsed.success) return apiError("incomplete", 400);
  try {
    if (!(await saveDocument(user.id, id, parsed.data))) return apiError("documentNotFound", 404);
    return Response.json({ ok: true });
  } catch (error) {
    return await errorResponse(error);
  }
}

// DELETE /api/documents/[id] — удалить (страница сначала спрашивает подтверждение)
export async function DELETE(_request: Request, { params }: RouteContext<"/api/documents/[id]">) {
  const user = await currentUser();
  if (!user) return apiError("unauthorized", 401);
  const { id } = await params;
  try {
    await deleteDocument(user.id, id);
    return Response.json({ ok: true });
  } catch (error) {
    return await errorResponse(error);
  }
}
