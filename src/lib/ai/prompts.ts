import type { Language, LessonRequest, Subject, TopicPackage } from "@/types/topic-package";

// Промпты короткие: структуру ответа задаёт JSON-схема, а не примеры в тексте.
// Это экономит токены, особенно на казахском, где текст «дороже».

const languageName: Record<Language, string> = {
  kk: "казахском языке (кириллица, грамотно, без русских слов)",
  ru: "русском языке",
};

const subjectPromptNames: Record<Subject, string> = {
  physics: "физика",
  chemistry: "химия",
  biology: "биология",
  history: "история",
  geography: "география",
  math: "математика",
  informatics: "информатика",
  kazakh: "казахский язык",
  russian: "русский язык",
  literature: "литература",
  english: "английский язык",
  other: "общий урок (предмет определи по теме)",
};

export function systemPrompt(language: Language, grade: number) {
  return [
    "Ты — опытный методист школ Казахстана. Готовишь материалы к уроку по программе МОН РК.",
    `Пиши на ${languageName[language]}. Короткие ясные предложения, понятные ученику ${grade} класса.`,
    "Только научно верные факты. Без markdown и эмодзи. Отвечай только JSON по заданной схеме.",
  ].join("\n");
}

export function packagePrompt({ topic, grade, subject }: LessonRequest) {
  return [
    `Предмет: ${subjectPromptNames[subject]}. Тема урока: «${topic}», ${grade} класс.`,
    "Раскрывай тему именно с точки зрения этого предмета.",
    "Составь пакет темы:",
    "- definition: главное определение, 1–2 предложения;",
    "- formula: только если у темы есть формула, иначе не указывай;",
    "- keyFacts: 5 ключевых фактов;",
    "- examples: 4 примера из жизни, у каждого imageQuery — запрос для фото на английском;",
    "- terms: 6–8 терминов с коротким пояснением;",
    "- quiz: 10 вопросов, у каждого 4 варианта; правильный ответ в разных позициях;",
    "- trueFalse: 8 утверждений, правдивых и ложных примерно поровну, у ложных — explanation.",
  ].join("\n");
}

export function jeopardyPrompt(pkg: TopicPackage) {
  return [
    `Игра «Своя игра» по теме «${pkg.topic}», ${pkg.grade} класс.`,
    "Составь 5 рубрик по 5 вопросов. Внутри рубрики вопросы идут от самого лёгкого к самому трудному.",
    "Ответ — 1–5 слов. Рубрики разные, например: термины, факты, учёные и история открытия, задачи, примеры из жизни.",
    `Опирайся на определение: ${pkg.definition}`,
  ].join("\n");
}
