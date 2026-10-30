import { AiError } from "@/lib/ai/gemini";

// Понятные учителю сообщения вместо технических ошибок
export function errorResponse(error: unknown) {
  if (error instanceof AiError) {
    const messages: Record<AiError["code"], [string, number]> = {
      no_key: ["AI кілті қосылмаған.", 503],
      rate_limit: ["Тегін сұраныстар уақытша бітті. Бір минуттан кейін қайталап көріңіз.", 429],
      bad_response: ["AI дұрыс жауап бермеді. Қайталап көріңіз.", 502],
      unavailable: ["AI қазір қолжетімсіз. Біраздан кейін қайталап көріңіз.", 503],
    };
    const [message, status] = messages[error.code];
    return Response.json({ error: message }, { status });
  }
  console.error(error);
  return Response.json({ error: "Белгісіз қате шықты. Қайталап көріңіз." }, { status: 500 });
}
