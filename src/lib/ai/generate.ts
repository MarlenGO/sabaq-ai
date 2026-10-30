import {
  jeopardySchema,
  packageContentSchema,
  type Jeopardy,
  type LessonRequest,
  type PackageContent,
  type TopicPackage,
} from "@/types/topic-package";
import { demoContent, jeopardyFromPackage } from "@/lib/demo";
import { generateJson, hasAiKey } from "./gemini";
import { jeopardyPrompt, packagePrompt, systemPrompt } from "./prompts";

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
  if (!hasAiKey() || pkg.source === "demo") return jeopardyFromPackage(pkg);
  return generateJson(jeopardySchema, systemPrompt(pkg.language, pkg.grade), jeopardyPrompt(pkg));
}
