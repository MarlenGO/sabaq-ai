import type { Language } from "@/types/topic-package";
import { kmzhStages, type DocData, type DocKind, type KmzhStage } from "@/types/documents";
import { boldCell, cell, p, textParas, type Block, type Doc } from "./model";

// Документы собираются в модель (model.ts): абзацы и таблицы. Из неё — и лист
// на сайте (html.ts), и файл Word (docx.ts). Подписи — на языке документа.

export interface DocMeta {
  topic: string;
  grade: number;
  language: Language;
  subjectName: string;
  teacher: string;
  school: string;
  date: string;
}

/** Строки ҚМЖ: подпись этапа (каждая строка — отдельно, первая жирная) */
const stageLabels: Record<Language, Record<KmzhStage, string[]>> = {
  kk: {
    org: ["Ұйымдастыру кезеңі", "3 минут"],
    start: ["Сабақтың басы", "7 минут", "Функционалдық сауаттылық"],
    newKnowledge: ["Сабақтың ортасы", "Жаңа білім", "7 минут"],
    task1: ["1-тапсырма", "ЖИ сауаттылығы", "8 минут"],
    task2: ["2-тапсырма", "Құндылыққа негізделген", "7 минут"],
    task3: ["3-тапсырма", "Жеке жұмыс", "8 минут"],
    special: ["ЕБҚ оқушысына арналған"],
    end: ["Сабақтың соңы", "5 минут", "Бағалау. Рефлексия"],
  },
  ru: {
    org: ["Организационный момент", "3 минуты"],
    start: ["Начало урока", "7 минут", "Функциональная грамотность"],
    newKnowledge: ["Середина урока", "Новые знания", "7 минут"],
    task1: ["Задание 1", "ИИ-грамотность", "8 минут"],
    task2: ["Задание 2", "На основе ценностей", "7 минут"],
    task3: ["Задание 3", "Индивидуальная работа", "8 минут"],
    special: ["Для учащихся с ООП"],
    end: ["Конец урока", "5 минут", "Оценивание. Рефлексия"],
  },
};

const copy = {
  kk: {
    kmzh: "Қысқа мерзімді жоспар",
    test: "Тест",
    bzhb: "Бөлім бойынша жиынтық бағалау",
    teacher: "Педагогтің аты-жөні:",
    date: "Күні:",
    grade: "Сынып:",
    present: "Қатысқандар саны:",
    absent: "Қатыспағандар саны:",
    section: "Бөлім:",
    topic: "Сабақтың тақырыбы:",
    learning: "Оқу бағдарламасына сәйкес оқу мақсаты:",
    goal: "Сабақтың мақсаты:",
    columns: ["Сабақ кезеңі (уақыты)", "Педагогтің іс-әрекеті", "Оқушының іс-әрекеті", "Бағалау", "Ресурстар"],
    subject: "Пән:",
    gradeWord: "сынып",
    student: "Оқушының аты-жөні:",
    key: "Жауап кілті",
    criteria: "Бағалау критерийі",
    criteriaLabel: "Бағалау критерийі:",
    levels: "Ойлау дағдыларының деңгейі:",
    duration: "Орындау уақыты:",
    tasks: "Тапсырмалар",
    taskNo: "Тапсырма №",
    descriptor: "Дескриптор",
    points: "Балл",
    total: "Барлығы",
    pointsShort: (n: number) => `${n} балл`,
  },
  ru: {
    kmzh: "Краткосрочный план",
    test: "Тест",
    bzhb: "Суммативное оценивание за раздел",
    teacher: "ФИО педагога:",
    date: "Дата:",
    grade: "Класс:",
    present: "Количество присутствующих:",
    absent: "Количество отсутствующих:",
    section: "Раздел:",
    topic: "Тема урока:",
    learning: "Цель обучения в соответствии с учебной программой:",
    goal: "Цель урока:",
    columns: ["Этап урока (время)", "Действия педагога", "Действия ученика", "Оценивание", "Ресурсы"],
    subject: "Предмет:",
    gradeWord: "класс",
    student: "ФИО ученика:",
    key: "Ключ ответов",
    criteria: "Критерий оценивания",
    criteriaLabel: "Критерий оценивания:",
    levels: "Уровень мыслительных навыков:",
    duration: "Время выполнения:",
    tasks: "Задания",
    taskNo: "№ задания",
    descriptor: "Дескриптор",
    points: "Балл",
    total: "Итого",
    pointsShort: (n: number) => `${n} б.`,
  },
} satisfies Record<Language, unknown>;

export const docTitle = (kind: DocKind, language: Language) => copy[language][kind];

const school = (m: DocMeta): Block[] => (m.school.trim() ? [p(m.school.trim(), { align: "right", size: 11, after: 4 })] : []);

/** ҚМЖ — точно по шаблону учителя: альбомный лист, шапка 2 колонки, таблица 5 колонок */
function kmzh(d: DocData["kmzh"], m: DocMeta): Doc {
  const l = copy[m.language];
  const spaces = " ".repeat(10);
  const header = (label: string, value: string | ReturnType<typeof textParas>) => ({ cells: [boldCell(label), cell(value)] });
  return {
    title: `${l.kmzh} — ${m.topic}`,
    landscape: true,
    blocks: [
      ...school(m),
      {
        type: "table",
        // Ширины колонок — как в шаблоне Word (twips)
        columns: [3402, 12302],
        rows: [
          header(l.teacher, m.teacher.trim()),
          header(l.date, m.date.trim()),
          header(l.grade, `${m.grade}${spaces}${l.present}${spaces}${l.absent}`),
          header(l.section, d.section),
          header(l.topic, m.topic),
          header(l.learning, d.learningObjective),
          header(l.goal, d.lessonGoal),
        ],
      },
      {
        type: "table",
        columns: [1980, 7431, 2438, 2494, 1361],
        rows: [
          { header: true, cells: l.columns.map((name) => boldCell(name, { shade: true })) },
          ...kmzhStages.map((id) => {
            const stage = d.stages[id];
            const [first, ...rest] = stageLabels[m.language][id];
            return {
              cells: [
                cell([{ runs: [{ text: first, bold: true }] }, ...rest.map((text) => ({ runs: [{ text }] }))]),
                cell(stage.teacher),
                cell(stage.students),
                cell(stage.assessment),
                cell(stage.resources),
              ],
            };
          }),
        ],
      },
    ],
  };
}

function test(d: DocData["test"], m: DocMeta): Doc {
  const l = copy[m.language];
  const letters = ["A", "B", "C", "D"];
  // Ключ ответов — таблица по 10 вопросов в строке
  const keyRows = Array.from({ length: Math.ceil(d.questions.length / 10) }, (_, r) => d.questions.slice(r * 10, r * 10 + 10));
  return {
    title: `${l.test} — ${m.topic}`,
    landscape: false,
    blocks: [
      ...school(m),
      p(`${l.test}: ${m.topic}`, { bold: true, align: "center", size: 14, after: 6 }),
      p(`${m.subjectName}, ${m.grade}-${l.gradeWord}`, { after: 2 }),
      p(`${l.student} ______________________________   ${l.date} __________`, { after: 6 }),
      p(d.instructions, { italic: true, after: 8 }),
      ...d.questions.flatMap((q, i): Block[] => [
        { type: "p", runs: [{ text: `${i + 1}. `, bold: true }, { text: q.question, bold: true }], after: 2 },
        ...q.options.map((o, j): Block => p(`${letters[j]}) ${o}`, { indent: 18, after: j === 3 ? 8 : 0 })),
      ]),
      { type: "pageBreak" },
      p(l.key, { bold: true, after: 6 }),
      ...keyRows.map(
        (row, r): Block => ({
          type: "table",
          columns: Array(10).fill(960),
          rows: [
            { cells: Array.from({ length: 10 }, (_, i) => boldCell(row[i] ? String(r * 10 + i + 1) : "", { shade: true })) },
            { cells: Array.from({ length: 10 }, (_, i) => cell(row[i] ? letters[row[i].correct] : "")) },
          ],
        }),
      ),
    ],
  };
}

function bzhb(d: DocData["bzhb"], m: DocMeta): Doc {
  const l = copy[m.language];
  const total = d.tasks.reduce((sum, t) => sum + t.points, 0);
  const bullets = (items: string[]) => items.map((text) => ({ runs: [{ text: `• ${text}` }] }));
  const header = (label: string, value: string | ReturnType<typeof bullets>) => ({ cells: [boldCell(label), cell(value)] });
  return {
    title: `${l.bzhb} — ${m.topic}`,
    landscape: false,
    blocks: [
      ...school(m),
      p(l.bzhb, { bold: true, align: "center", size: 14, after: 8 }),
      {
        type: "table",
        columns: [3200, 6721],
        rows: [
          header(l.subject, `${m.subjectName}, ${m.grade}-${l.gradeWord}`),
          header(l.section, d.section),
          header(l.topic, m.topic),
          header(l.learning, bullets(d.learningObjectives)),
          header(l.criteriaLabel, bullets(d.criteria)),
          header(l.levels, bullets(d.thinkingLevels)),
          header(l.duration, d.duration),
        ],
      },
      p(`${l.student} ______________________________`, { after: 8 }),
      p(l.tasks, { bold: true, after: 4 }),
      ...d.tasks.flatMap((t, i): Block[] => {
        const [first, ...rest] = textParas(t.text);
        return [
          { type: "p", runs: [{ text: `${i + 1}. `, bold: true }, ...(first?.runs ?? []), { text: ` (${l.pointsShort(t.points)})`, italic: true }], after: rest.length ? 0 : 8 },
          ...rest.map((para, j): Block => ({ type: "p", ...para, after: j === rest.length - 1 ? 8 : 0 })),
        ];
      }),
      {
        type: "table",
        columns: [2600, 1300, 5021, 1000],
        rows: [
          { header: true, cells: [l.criteria, l.taskNo, l.descriptor, l.points].map((name) => boldCell(name, { shade: true })) },
          ...d.descriptors.map((row, i) => ({
            cells: [
              i === 0 ? cell(bullets(d.criteria), { vmerge: "restart" as const }) : cell([], { vmerge: "continue" as const }),
              cell([{ runs: [{ text: row.task }], align: "center" as const }]),
              cell(row.descriptor),
              cell([{ runs: [{ text: String(row.points) }], align: "center" as const }]),
            ],
          })),
          {
            cells: [
              boldCell(l.total, { span: 3 }),
              cell([{ runs: [{ text: String(total), bold: true }], align: "center" as const }]),
            ],
          },
        ],
      },
    ],
  };
}

/** Документ в виде модели — из неё делаются предпросмотр, печать и Word */
export function buildDocument<K extends DocKind>(kind: K, data: DocData[K], meta: DocMeta): Doc {
  if (kind === "kmzh") return kmzh(data as DocData["kmzh"], meta);
  if (kind === "test") return test(data as DocData["test"], meta);
  return bzhb(data as DocData["bzhb"], meta);
}
