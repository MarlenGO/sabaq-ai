import { z } from "zod";
import { apiError } from "@/lib/api-errors";
import { register } from "@/lib/auth";

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  login: z.string().trim().min(3).max(100),
  password: z.string().min(6).max(200),
  invite: z.string().trim().max(40).optional(),
});

// POST /api/auth/register — регистрация учителя. С кодом приглашения — сразу внутри,
// без кода — ждёт, пока админ одобрит. Самый первый пользователь — админ.
export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError("registerInvalid", 400);
  const result = await register(parsed.data);
  if (!result.ok) return apiError("loginTaken", 409);
  return Response.json({ status: result.status });
}
