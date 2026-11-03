import type { z } from "zod";
import type { aiRequestSchema } from "@/types/ai";
import type { DeckType, Language, LayoutKind, LessonRequest, Subject, TopicPackage } from "@/types/topic-package";
import { defaultData, findSlide, isDataSlide, type DataSlide } from "@/slides/structures";

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

// Вид презентации — для AI, чтобы он понимал, для кого слайды
const deckTypePrompt: Record<DeckType, string> = {
  lesson: "презентация к уроку",
  "open-lesson": "открытый урок или конкурс педагогического мастерства",
  report: "отчёт учителя о проделанной работе для комиссии",
  talk: "доклад на семинаре, педсовете или конференции",
  "class-hour": "классный час (воспитательное мероприятие)",
  parents: "родительское собрание",
  attestation: "портфолио педагога для аттестации",
};

// Что писать в каждой раскладке. О чём именно слайд — видно из образца (подсказки по умолчанию).
const layoutTask: Record<Exclude<LayoutKind, "title">, string> = {
  goals: "Три карточки: title — заголовок слайда; items — ровно 3: title — 1–3 слова, body — одно предложение.",
  plan: "Линия из ровно 4 шагов: title — заголовок; steps: name — коротко, time — время или срок.",
  bullets: "title — заголовок; lines — 3–5 коротких пунктов.",
  "text-image": "title — подзаголовок; bullets — 3–4 коротких тезиса.",
  "big-image": "caption — подпись к главной иллюстрации, одно предложение.",
  compare: "Сравнение двух понятий: title — заголовок; left и right — их названия; leftLines и rightLines — по 3 коротких признака.",
  numbers: "title — заголовок; items — ровно 3: value — число с единицей (коротко), caption — что оно значит.",
  table: "title — заголовок; columns — 2–4 коротких заголовка столбцов; rows — 3–5 строк, в каждой столько ячеек, сколько столбцов.",
  chart: "Столбчатая диаграмма: title — что показано и в каких единицах; items — 3–6 столбиков: label — короткая подпись, value — число ≥ 0.",
  think: "title — заголовок; question — главный вопрос или цитата; hint — короткая подпись внизу.",
  task: "Задание: title — заголовок; name — название; lines — 2–4 шага условия; criteriaTitle — заголовок блока оценивания; criteria — ровно 3 дескриптора.",
  reflection: "title — заголовок; items — ровно 3 коротких начала фраз.",
  homework: "Последний слайд: title — заголовок; lines — 1–3 пункта; thanks — короткая заключительная фраза.",
};

// Слайды с содержанием темы, вопросы игр
const contentTask = {
  definition: "Главное определение темы (definition), 1–2 предложения, и формула (formula), только если она у темы есть.",
  facts: "keyFacts: 5 ключевых фактов по теме, каждый — одно предложение.",
  examples: "examples: 4 примера из жизни, у каждого imageQuery — запрос для фото на английском.",
  terms: "terms: 6–8 терминов темы с коротким пояснением.",
  quiz: "Один вопрос теста: question и ровно 4 варианта в options; correctIndex — индекс правильного, в случайной позиции; explanation — коротко, почему так.",
  trueFalse: "Одно утверждение (statement): правдивое или ложное — на твой выбор; isTrue; у ложного — explanation.",
  jeopardy: "Один вопрос для «Своей игры»: question и короткий answer (1–5 слов).",
};

// Личные данные (проценты класса, годы, ФИО) AI знать не может — пусть оставит место учителю
const noInventedData =
  "Не выдумывай личные данные учителя, класса и школы (ФИО, проценты успеваемости, награды): там, где они нужны, оставь «…». В диаграммах ставь примерные значения — учитель их заменит.";

const lessonLine = (pkg: TopicPackage) =>
  `Тема: «${pkg.topic}», ${pkg.grade} класс, предмет: ${subjectPromptNames[pkg.subject]}. Вид: ${deckTypePrompt[pkg.deckType ?? "lesson"]}.`;

/** Как должен выглядеть слайд: образец по умолчанию, который AI заменит содержанием по теме */
const sample = (pkg: TopicPackage, spec: DataSlide) => JSON.stringify(defaultData(pkg, spec));

export function partPrompt(pkg: TopicPackage, request: z.output<typeof aiRequestSchema>) {
  const lines = [lessonLine(pkg)];
  const spec = request.slide ? findSlide(pkg, request.slide) : undefined;
  if (spec && isDataSlide(spec) && spec.kind !== "title") {
    lines.push(layoutTask[spec.kind], `Образец слайда (замени содержанием по теме, сохрани смысл слайда): ${sample(pkg, spec)}`);
    if (pkg.deckType && pkg.deckType !== "lesson") lines.push(noInventedData);
  } else if (request.part in contentTask) {
    lines.push(contentTask[request.part as keyof typeof contentTask]);
  }
  if (request.part === "jeopardy" && request.points) {
    lines.push(`Рубрика «${request.category ?? pkg.topic}», вопрос на ${request.points} очков: сложность ${request.points / 100} из 5.`);
  }
  if (request.avoid.length > 0) lines.push(`Не повторяй уже имеющееся:\n- ${request.avoid.join("\n- ")}`);
  return lines.join("\n");
}

/** Все слайды-заготовки вида презентации одним запросом: id слайда → его данные */
export function deckPrompt(pkg: TopicPackage, slides: DataSlide[]) {
  return [
    lessonLine(pkg),
    "Заполни слайды презентации содержанием по теме. Для каждого слайда — объект под его id.",
    ...slides.map((s) => `- ${s.id}: ${layoutTask[s.kind as Exclude<LayoutKind, "title">]} Образец: ${sample(pkg, s)}`),
    pkg.deckType && pkg.deckType !== "lesson" ? noInventedData : "",
  ]
    .filter(Boolean)
    .join("\n");
}
