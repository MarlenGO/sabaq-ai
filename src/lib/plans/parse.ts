import { randomBytes } from "node:crypto";
import { generateJson } from "@/lib/ai/gemini";
import { subjectSchema } from "@/types/topic-package";
import { planAiSchema, type PlanInput, type PlanLesson } from "@/types/plan";

// КТП из текста файла → список уроков. Один запрос к Gemini: он понимает любую
// таблицу (колонки называются по-разному, бөлім записан один раз на несколько уроков,
// объединённые ячейки). Потом проверяем, что каждая тема есть в файле — иначе «тексеріңіз».

/** Больше этого в Gemini не отправляем: годовой КТП обычно 15–40 тысяч знаков */
const MAX_TEXT = 90_000;

const SYSTEM = `Сен — Қазақстан мектебі мұғалімінің көмекшісісің. Саған мұғалімнің күнтізбелік-тақырыптық жоспары (КТП) мәтін түрінде беріледі: Word немесе Excel кестесі «| ұяшық | ұяшық |» жолдарымен.
Міндетің — кестеден сабақтар тізімін шығару. Ештеңе ойдан қоспа, мәтінді өзгертпе.

Ережелер:
- Әр сабақ — бір жол. Тақырып (topic), бөлім (section), оқу мақсаты (objective) файлдағыдай сөзбе-сөз көшіріледі, аудармайсың, қысқартпайсың.
- Бөлім бірнеше сабаққа бір рет жазылған болса (біріктірілген ұяшық немесе бөлек жол) — сол бөлімді оның барлық сабақтарына қой.
- Оқу мақсатының коды болса (мысалы «8.3.2.17»), кодымен бірге көшір. Бірнеше мақсат болса — бәрін « ; » арқылы бір жолға жаз.
- Тоқсан (quarter): файлда «I тоқсан», «2-тоқсан», «3 четверть» сияқты белгі болса — 1–4. Белгісіз болса — 0.
- Күні (date): файлда қалай жазылса, солай. Жоқ болса — бос жол.
- Бір жолда бірнеше сабақ болса (№ ұяшығында «21-22» сияқты аралық немесе сағат саны 2, 3) — сол сабақты сонша рет қатарынан қайтала: әр сағатқа бөлек ҚМЖ жазылады. Ешбір жолды өткізіп жіберме.
- БЖБ (СОР, бөлім бойынша жиынтық бағалау) — kind "bzhb", ТЖБ (СОЧ, тоқсандық) — kind "tzhb", қалғаны — "lesson". БЖБ/ТЖБ жеке жол болса ғана бөлек сабақ ет; тақырыппен бірге жазылса — "lesson" және тақырыпты өзгертпе.
- Кесте тақырыптарын («Тақырып», «Тема урока», «№»), қолтаңбаларды, «Келісемін», «Бекітемін» сияқты жолдарды сабақ етпе.
- Пән (subject) — тізімнен: ${subjectSchema.options.join(", ")}. Табылмаса — "other".
- Сынып (grade) — файлда жазылса 1–11, жоқ болса 0.
- Тіл (language): сабақ тақырыптары қазақша болса "kk", орысша болса "ru".`;

/** Для сравнения: без регистра, знаков и лишних пробелов */
const plain = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();

/** Gemini не всегда отмечает БЖБ/ТЖБ — проверяем по словам в теме */
function kindOf(topic: string, kind: PlanLesson["kind"]): PlanLesson["kind"] {
  const text = topic.trim().toLowerCase();
  if (/тоқсандық\s+жиын[дт]?ық|^тжб|^соч|за\s+(\d\s*)?четверть/.test(text)) return "tzhb";
  if (/^(бжб|сор|бөлім\s+бойынша\s+жиын[дт]?ық|суммативное\s+оценивание\s+за\s+раздел)/.test(text)) return "bzhb";
  return kind;
}

export async function parsePlan(text: string, fileName: string): Promise<PlanInput> {
  const ai = await generateJson(planAiSchema, SYSTEM, `Файл: ${fileName}\n\n${text.slice(0, MAX_TEXT)}`);
  const source = plain(text);
  const lessons: PlanLesson[] = ai.lessons
    .filter((lesson) => lesson.topic.trim())
    .map((lesson) => ({
      id: randomBytes(4).toString("hex"),
      quarter: lesson.quarter,
      date: lesson.date.trim(),
      section: lesson.section.trim(),
      topic: lesson.topic.trim(),
      objective: lesson.objective.trim(),
      kind: kindOf(lesson.topic, lesson.kind),
      // Тема должна быть в файле — иначе AI мог её выдумать или исказить
      ...(source.includes(plain(lesson.topic)) ? {} : { unsure: true }),
    }));
  const name = fileName.replace(/\.(docx|xlsx)$/i, "").trim();
  return {
    title: name.slice(0, 120) || "КТП",
    subject: ai.subject,
    grade: ai.grade || 7,
    language: ai.language,
    lessons,
  };
}
