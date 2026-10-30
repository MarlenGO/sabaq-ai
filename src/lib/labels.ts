import type { Language, Subject } from "@/types/topic-package";

export const subjectNames: Record<Subject, string> = {
  physics: "Физика",
  chemistry: "Химия",
  biology: "Биология",
  history: "Тарих",
  geography: "География",
  math: "Математика",
  other: "Пән",
};

export const languageNames: Record<Language, string> = {
  kk: "Қазақша",
  ru: "Русский",
};

// Перевод доли правильных ответов в привычную пятибалльную оценку
export function schoolGrade(correct: number, total: number) {
  const share = total === 0 ? 0 : correct / total;
  if (share >= 0.85) return 5;
  if (share >= 0.65) return 4;
  if (share >= 0.4) return 3;
  return 2;
}
