import type { Language } from "@/types/topic-package";
import { kmzhStages, type DocData, type DocKind } from "@/types/documents";

// Пустые бланки: та же форма документа, но вместо содержания — «…» и подсказки.
// Их показывает режим «Бос үлгі» и предпросмотр до нажатия «Құжатты жасау».

const dots = "…";

export function emptyDocument<K extends DocKind>(kind: K, language: Language, count = 5): DocData[K] {
  const kk = language === "kk";
  const docs: DocData = {
    kmzh: {
      section: dots,
      learningObjective: dots,
      lessonGoal: dots,
      stages: Object.fromEntries(
        kmzhStages.map((id) => [id, { teacher: dots, students: dots, assessment: dots, resources: dots }]),
      ) as DocData["kmzh"]["stages"],
    },
    test: {
      instructions: kk ? "Әр сұраққа бір дұрыс жауапты белгілеңіз." : "Отметьте один правильный ответ на каждый вопрос.",
      questions: Array.from({ length: count }, () => ({ question: dots, options: [dots, dots, dots, dots], correct: 0 })),
    },
    bzhb: {
      section: dots,
      learningObjectives: [dots],
      criteria: [dots],
      thinkingLevels: [kk ? "Білу және түсіну" : "Знание и понимание", kk ? "Қолдану" : "Применение"],
      duration: kk ? "20 минут" : "20 минут",
      tasks: [
        { text: dots, points: 2 },
        { text: dots, points: 3 },
      ],
      descriptors: [
        { task: "1", descriptor: dots, points: 2 },
        { task: "2", descriptor: dots, points: 3 },
      ],
    },
  };
  return docs[kind];
}
