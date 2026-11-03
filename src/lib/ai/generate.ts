import { z } from "zod";
import type { AiPart, aiRequestSchema } from "@/types/ai";
import {
  jeopardySchema,
  layoutSchemas,
  packageContentSchema,
  quizQuestionSchema,
  trueFalseSchema,
  type Jeopardy,
  type LessonRequest,
  type PackageContent,
  type TopicPackage,
} from "@/types/topic-package";
import { demoContent, emptyJeopardy, jeopardyFromPackage } from "@/lib/demo";
import { generateJson, hasAiKey } from "./gemini";
import { deckPrompt, jeopardyPrompt, packagePrompt, partPrompt, systemPrompt } from "./prompts";
import { isDataSlide, structureOf, type DataSlide } from "@/slides/structures";

// Что умеет «мозг» сайта. Без ключа — демо-режим, чтобы сайт работал и без AI.

export async function generatePackageContent(
  request: LessonRequest,
): Promise<{ content: PackageContent; source: "ai" | "demo" }> {
  if (!hasAiKey()) return { content: demoContent(), source: "demo" };
  const content = await generateJson(
    packageContentSchema,
    systemPrompt(request.language, request.grade),
    packagePrompt(request),
  );
  return { content, source: "ai" };
}

export async function generateJeopardy(pkg: TopicPackage): Promise<Jeopardy> {
  if (pkg.source === "empty") return emptyJeopardy(pkg.language);
  if (!hasAiKey() || pkg.source === "demo") return jeopardyFromPackage(pkg);
  return generateJson(jeopardySchema, systemPrompt(pkg.language, pkg.grade), jeopardyPrompt(pkg));
}

// Схема ответа для каждой части. Слайды-заготовки берут схему своей раскладки,
// слайды с содержанием — нужные поля пакета темы.
const partSchemas: Record<Exclude<AiPart, "deck">, z.ZodType> = {
  definition: packageContentSchema.pick({ definition: true, formula: true }),
  facts: packageContentSchema.pick({ keyFacts: true }),
  examples: packageContentSchema.pick({ examples: true }),
  terms: packageContentSchema.pick({ terms: true }),
  ...layoutSchemas,
  quiz: quizQuestionSchema,
  trueFalse: trueFalseSchema,
  jeopardy: z.object({ question: z.string().trim().min(1), answer: z.string().trim().min(1) }),
};

/** Кнопка «AI» в конструкторе: написать заново одну часть урока */
export function generatePart(pkg: TopicPackage, request: z.output<typeof aiRequestSchema>): Promise<unknown> {
  if (request.part === "deck") return generateDeck(pkg);
  return generateJson(partSchemas[request.part], systemPrompt(pkg.language, pkg.grade), partPrompt(pkg, request));
}

// Слайды-заготовки вида презентации (кроме титульного) — их пишет generateDeck
const deckSlides = (pkg: TopicPackage) =>
  structureOf(pkg).filter((s): s is DataSlide => isDataSlide(s) && s.kind !== "title");

/** Все слайды-заготовки одним запросом: { id слайда: данные } → кладётся в pkg.deck */
export function generateDeck(pkg: TopicPackage): Promise<Record<string, Record<string, unknown>>> {
  const slides = deckSlides(pkg);
  const schema = z.object(Object.fromEntries(slides.map((s) => [s.id, layoutSchemas[s.kind]])));
  return generateJson(schema, systemPrompt(pkg.language, pkg.grade), deckPrompt(pkg, slides)) as Promise<
    Record<string, Record<string, unknown>>
  >;
}
