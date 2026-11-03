import { logout } from "@/lib/auth";

// POST /api/auth/logout — выйти на этом устройстве
export async function POST(request: Request) {
  await logout();
  return Response.redirect(new URL("/login", request.url), 303);
}
