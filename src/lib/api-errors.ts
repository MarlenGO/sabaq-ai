import { AiError } from "@/lib/ai/gemini";
import { getT } from "@/i18n/server";
import type { Messages } from "@/i18n/kk";

type ErrorKey = keyof Messages["errors"];

// Ответ с ошибкой на языке сайта (cookie). code — для кода в браузере,
// error — понятный текст, который показываем учителю или ученику.
export async function apiError(code: ErrorKey, status: number, extra?: Record<string, unknown>) {
  const t = await getT();
  return Response.json({ error: t.errors[code], code, ...extra }, { status });
}

// Понятные учителю сообщения вместо технических ошибок
export async function errorResponse(error: unknown) {
  if (error instanceof AiError) {
    const map: Record<AiError["code"], [ErrorKey, number]> = {
      no_key: ["noKey", 503],
      rate_limit: ["rateLimit", 429],
      bad_response: ["badResponse", 502],
      unavailable: ["unavailable", 503],
    };
    const [code, status] = map[error.code];
    return apiError(code, status);
  }
  console.error(error);
  return apiError("unknown", 500);
}
