import { apiError } from "@/lib/api-errors";
import { currentUser } from "@/lib/auth";
import { searchImages } from "@/lib/images";

export type { ImageResult } from "@/lib/images";

// GET /api/images?q=… — поиск картинок для вопросов и слайдов (см. lib/images.ts)
export async function GET(request: Request) {
  if (!(await currentUser())) return apiError("unauthorized", 401);
  const query = new URL(request.url).searchParams.get("q")?.trim().slice(0, 100);
  if (!query) return Response.json({ results: [] });
  const results = await searchImages(query);
  if (!results) return apiError("imagesFailed", 502);
  return Response.json({ results });
}
