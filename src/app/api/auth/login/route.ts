import { z } from "zod";
import { apiError } from "@/lib/api-errors";
import { login } from "@/lib/auth";

const schema = z.object({ login: z.string().trim().min(1).max(100), password: z.string().min(1).max(200) });

// POST /api/auth/login — вход по логину (или email) и паролю; браузер помнит год
export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError("loginWrong", 400);
  const result = await login(parsed.data.login, parsed.data.password);
  if (result.ok) return Response.json({ ok: true });
  const codes = { wrong: "loginWrong", pending: "loginPending", blocked: "loginBlocked" } as const;
  return apiError(codes[result.reason], result.reason === "wrong" ? 401 : 403);
}
