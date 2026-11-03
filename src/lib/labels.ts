import type { Subject } from "@/types/topic-package";

// Названия предметов, игр и т.п. — в словарях src/i18n (kk.ts, ru.ts).

/** Порядок кнопок предметов на главной */
export const subjectOrder: Subject[] = [
  "physics",
  "math",
  "informatics",
  "chemistry",
  "biology",
  "geography",
  "history",
  "kazakh",
  "russian",
  "literature",
  "english",
  "other",
];

// Перевод доли правильных ответов в привычную пятибалльную оценку
export function schoolGrade(correct: number, total: number) {
  const share = total === 0 ? 0 : correct / total;
  if (share >= 0.85) return 5;
  if (share >= 0.65) return 4;
  if (share >= 0.4) return 3;
  return 2;
}
