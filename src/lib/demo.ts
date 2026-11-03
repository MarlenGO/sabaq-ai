import type { Jeopardy, Language, PackageContent, TopicPackage } from "@/types/topic-package";
import { newtonFirstLaw7 } from "@/data/mock-packages/newton-first-law-7";

// Демо-режим: пока нет ключа Gemini, вместо генерации подставляем содержание
// мокового пакета. Тема в заголовке будет та, что ввёл учитель, а содержание —
// пример про закон Ньютона. Страница урока честно предупреждает об этом.
export function demoContent(): PackageContent {
  const { definition, formula, keyFacts, examples, terms, quiz, trueFalse } = newtonFirstLaw7;
  return { definition, formula, keyFacts, examples, terms, quiz, trueFalse };
}

// «Своя игра» из того, что уже есть в пакете. Используется в демо-режиме
// и как запасной вариант, если AI недоступен.
export function jeopardyFromPackage(pkg: TopicPackage): Jeopardy {
  const take = <T>(items: T[]) => items.slice(0, 5);
  const categories: Jeopardy["categories"] = [];

  const terms = take(pkg.terms);
  if (terms.length === 5) {
    categories.push({
      title: pkg.language === "kk" ? "Бұл не?" : "Что это?",
      questions: terms.map((t) => ({ question: t.explanation, answer: t.term })),
    });
  }

  const quiz = take(pkg.quiz);
  if (quiz.length === 5) {
    categories.push({
      title: pkg.language === "kk" ? "Сұрақтар" : "Вопросы",
      questions: quiz.map((q) => ({ question: q.question, answer: q.options[q.correctIndex] })),
    });
  }

  const statements = take(pkg.trueFalse);
  if (statements.length === 5) {
    const [yes, no] = pkg.language === "kk" ? ["Шын", "Жалған"] : ["Правда", "Ложь"];
    categories.push({
      title: pkg.language === "kk" ? "Шын ба?" : "Правда ли?",
      questions: statements.map((s) => ({ question: s.statement, answer: s.isTrue ? yes : no })),
    });
  }

  return { categories };
}

// Пустой проект: заготовка с подсказками на языке урока. Поля не пустые,
// потому что схема требует текст, — учитель заменит их сам или кнопкой «AI».
const blank = {
  kk: {
    definition: "Анықтаманы осында жазыңыз",
    fact: (n: number) => `${n}-фактіні жазыңыз`,
    example: (n: number) => `${n}-мысалды жазыңыз`,
    term: (n: number) => `${n}-термин`,
    explanation: "Түсіндірмесін жазыңыз",
    question: (n: number) => `${n}-сұрақты жазыңыз`,
    option: (letter: string) => `${letter} нұсқасы`,
    statement: (n: number) => `${n}-тұжырымды жазыңыз`,
    category: (n: number) => `${n}-тақырып`,
    jeopardyQuestion: (points: number) => `${points} ұпайлық сұрақ`,
    answer: "Жауабы",
  },
  ru: {
    definition: "Впишите определение",
    fact: (n: number) => `Впишите факт ${n}`,
    example: (n: number) => `Впишите пример ${n}`,
    term: (n: number) => `Термин ${n}`,
    explanation: "Впишите пояснение",
    question: (n: number) => `Впишите вопрос ${n}`,
    option: (letter: string) => `Вариант ${letter}`,
    statement: (n: number) => `Впишите утверждение ${n}`,
    category: (n: number) => `Тема ${n}`,
    jeopardyQuestion: (points: number) => `Вопрос на ${points}`,
    answer: "Ответ",
  },
} satisfies Record<Language, unknown>;

const range = (n: number) => Array.from({ length: n }, (_, i) => i + 1);

export function emptyContent(language: Language): PackageContent {
  const b = blank[language];
  return {
    definition: b.definition,
    keyFacts: range(3).map(b.fact),
    examples: range(2).map((n) => ({ text: b.example(n), imageQuery: "lesson" })),
    terms: range(4).map((n) => ({ term: b.term(n), explanation: b.explanation })),
    quiz: range(5).map((n) => ({ question: b.question(n), options: ["A", "B", "C", "D"].map(b.option), correctIndex: 0 })),
    trueFalse: range(4).map((n) => ({ statement: b.statement(n), isTrue: true })),
  };
}

export function emptyJeopardy(language: Language): Jeopardy {
  const b = blank[language];
  return {
    categories: range(3).map((n) => ({
      title: b.category(n),
      questions: range(5).map((q) => ({ question: b.jeopardyQuestion(q * 100), answer: b.answer })),
    })),
  };
}
