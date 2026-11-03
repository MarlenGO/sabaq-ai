import { redeemLoginLink } from "@/lib/auth";

// GET /login/link/<токен> — одноразовая ссылка из админки: открыл — и уже внутри
export async function GET(request: Request, ctx: RouteContext<"/login/link/[token]">) {
  const { token } = await ctx.params;
  const ok = await redeemLoginLink(token).catch(() => false);
  return Response.redirect(new URL(ok ? "/" : "/login?link=expired", request.url), 303);
}
