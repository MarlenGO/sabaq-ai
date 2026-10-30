import { z } from "zod";

// Единственное место, которое знает про Gemini. Если позже добавим запасной
// провайдер (Groq и т.п.), он получит такую же функцию generateJson.
//
// Используем generateContent: Google называет его legacy рядом с новым
// Interactions API, но он «fully supported» и формат ответа у него устоявшийся.

const DEFAULT_MODEL = "gemini-3.5-flash-lite";

export class AiError extends Error {
  constructor(
    public code: "no_key" | "rate_limit" | "bad_response" | "unavailable",
    message: string,
  ) {
    super(message);
  }
}

export function hasAiKey() {
  return Boolean(process.env.GEMINI_API_KEY);
}

// JSON Schema для Gemini строим из той же схемы zod, которой потом проверяем ответ
function toGeminiSchema(schema: z.ZodType) {
  const jsonSchema: Record<string, unknown> = z.toJSONSchema(schema, { io: "input" });
  delete jsonSchema.$schema;
  return jsonSchema;
}

interface GenerateContentResponse {
  candidates?: { content?: { parts?: { text?: string }[] } }[];
}

export async function generateJson<T>(schema: z.ZodType<T>, system: string, prompt: string): Promise<T> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new AiError("no_key", "GEMINI_API_KEY не задан в .env.local");
  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;

  // Одна повторная попытка: изредка модель отвечает не по схеме
  for (let attempt = 1; attempt <= 2; attempt++) {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            responseJsonSchema: toGeminiSchema(schema),
            temperature: 0.4,
          },
        }),
        signal: AbortSignal.timeout(60_000),
      },
    ).catch(() => null);

    if (!response) throw new AiError("unavailable", "Gemini не ответил");
    if (response.status === 429) throw new AiError("rate_limit", "Лимит бесплатных запросов Gemini");
    if (!response.ok) {
      console.error("Gemini error", response.status, await response.text().catch(() => ""));
      throw new AiError("unavailable", `Gemini вернул ошибку ${response.status}`);
    }

    const data = (await response.json()) as GenerateContentResponse;
    const raw = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";

    try {
      const result = schema.safeParse(JSON.parse(raw));
      if (result.success) return result.data;
      console.warn(`Gemini answer does not match schema (attempt ${attempt})`, result.error.issues.slice(0, 3));
    } catch {
      console.warn(`Gemini answer is not JSON (attempt ${attempt})`);
    }
  }

  throw new AiError("bad_response", "Gemini ответил не по схеме");
}
