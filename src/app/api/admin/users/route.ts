import { z } from "zod";
import { apiError } from "@/lib/api-errors";
import { createUser } from "@/lib/auth";
import { adminOrError } from "@/lib/admin";

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  login: z.string().trim().min(3).max(100),
  password: z.string().min(4).max(200),
  role: z.enum(["admin", "teacher"]),
});

// POST /api/admin/users — админ сам создаёт учителя (например, маме: логин «mama»)
export async function POST(request: Request) {
  const { error } = await adminOrError();
  if (error) return error;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError("registerInvalid", 400);
  const user = await createUser(parsed.data);
  if (!user) return apiError("loginTaken", 409);
  return Response.json({ id: user.id });
}
