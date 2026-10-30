import type { Jeopardy, PackageContent, TopicPackage } from "@/types/topic-package";
import { newtonFirstLaw7 } from "@/data/mock-packages/newton-first-law-7";

// Демо-режим: пока нет ключа Gemini, вместо генерации подставляем содержание
// мокового пакета. Тема в заголовке будет та, что ввёл учитель, а содержание —
// пример про закон Ньютона. Страница урока честно предупреждает об этом.
export function demoContent(): PackageContent {
  const { subject, definition, formula, keyFacts, examples, terms, quiz, trueFalse } = newtonFirstLaw7;
  return { subject, definition, formula, keyFacts, examples, terms, quiz, trueFalse };
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
