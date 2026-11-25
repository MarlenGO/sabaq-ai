import type { Language } from "@/types/topic-package";
import { kmzhStages, type DocData, type DocKind, type KmzhStage } from "@/types/documents";
import { boldCell, cell, p, textParas, type Block, type Doc, type Row } from "./model";
import { buildCrossword } from "./crossword";

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
    pisa: "PISA үлгісіндегі тапсырма",
    worksheet: "Жұмыс парағы",
    guide: "Бағалау нұсқаулығы",
    question: "Сұрақ",
    answer: "Күтілетін жауап",
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
    pisa: "Задание в формате PISA",
    worksheet: "Рабочий лист",
    guide: "Руководство по оцениванию",
    question: "Вопрос",
    answer: "Ожидаемый ответ",
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

/** PISA: ситуация и 4 вопроса для ученика, на отдельной странице — руководство по оцениванию */
function pisa(d: DocData["pisa"], m: DocMeta): Doc {
  const l = copy[m.language];
  const total = d.questions.reduce((sum, q) => sum + q.points, 0);
  return {
    title: `${l.pisa} — ${m.topic}`,
    landscape: false,
    blocks: [
      ...school(m),
      p(l.pisa, { bold: true, align: "center", size: 14, after: 4 }),
      p(`${m.subjectName}, ${m.grade}-${l.gradeWord}. ${l.topic} ${m.topic}`, { align: "center", after: 6 }),
      p(`${l.student} ______________________________   ${l.date} __________`, { after: 8 }),
      p(d.title, { bold: true, size: 13, after: 4 }),
      ...textParas(d.situation).map((para): Block => ({ type: "p", ...para, after: 4 })),
      ...d.questions.flatMap((q, i): Block[] => [
        { type: "p", runs: [{ text: `${l.question} ${i + 1}. `, bold: true }, { text: `(${l.pointsShort(q.points)})`, italic: true }], after: 2 },
        ...textParas(q.question).map((para): Block => ({ type: "p", ...para })),
        p("_______________________________________________________________________________", { after: 2 }),
        p("_______________________________________________________________________________", { after: 8 }),
      ]),
      { type: "pageBreak" },
      p(l.guide, { bold: true, after: 6 }),
      {
        type: "table",
        columns: [700, 1900, 3600, 2921, 800],
        rows: [
          { header: true, cells: ["№", l.criteria, l.answer, l.descriptor, l.points].map((name) => boldCell(name, { shade: true })) },
          ...d.questions.map((q, i) => ({
            cells: [
              cell([{ runs: [{ text: String(i + 1) }], align: "center" as const }]),
              cell(q.skill),
              cell(q.answer),
              cell(q.scoring),
              cell([{ runs: [{ text: String(q.points) }], align: "center" as const }]),
            ],
          })),
          { cells: [boldCell(l.total, { span: 4 }), cell([{ runs: [{ text: String(total), bold: true }], align: "center" as const }])] },
        ],
      },
    ],
  };
}

// ——— Жұмыс парағы ———

/** Буквы вариантов в сәйкестендіру */
const LETTERS = ["А", "Б", "В", "Г", "Д", "Е", "Ж", "З"];

/** Перемешать одинаково при каждой сборке: «случайность» зависит только от текста */
function shuffled<T>(items: T[], seedText: string): T[] {
  let seed = [...seedText].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7);
  const random = () => ((seed = (Math.imul(seed, 1103515245) + 12345) >>> 0) % 1000) / 1000;
  const list = [...items];
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  // Ни один ответ не должен стоять на своём месте — иначе задание слишком лёгкое
  if (list.length < 2 || list.every((item, i) => item !== items[i])) return list;
  return items.map((_, i) => items[(i + 1) % items.length]);
}

/** Предложение с пропуском: если AI забыл «____», прячем ответ сами */
function withGap(sentence: string, answer: string) {
  if (/_{3,}/.test(sentence)) return sentence.replace(/_{3,}/, "__________");
  const at = sentence.toLowerCase().indexOf(answer.toLowerCase());
  return at >= 0 ? sentence.slice(0, at) + "__________" + sentence.slice(at + answer.length) : `${sentence} __________`;
}

/** Клетка кроссворда 20 пт: на листе ученика — номер в углу, в ответах — буква */
const CROSS_CELL = 400;

function crosswordGrid(grid: (string | null)[][], numbers: Map<string, number>, withLetters: boolean): Block {
  return {
    type: "table",
    grid: true,
    columns: Array(grid[0].length).fill(CROSS_CELL),
    rows: grid.map(
      (row, r): Row => ({
        height: CROSS_CELL / 20,
        cells: row.map((letter, c) => {
          if (!letter) return cell([], { blank: true });
          if (withLetters) return cell([{ runs: [{ text: letter, bold: true }], align: "center", size: 11 }]);
          const number = numbers.get(`${r},${c}`);
          return cell(number ? [{ runs: [{ text: String(number) }], size: 7 }] : []);
        }),
      }),
    ),
  };
}

const ANSWER_LINE = "_______________________________________________________________________________";

/** Рабочий лист ученика: до 5 заданий и рефлексия; на отдельной странице — ответы учителю */
function worksheet(d: DocData["worksheet"], m: DocMeta): Doc {
  const tasks: Block[][] = [];
  const answers: Block[] = [];
  const heading = (title: string, hint: string): Block => ({
    type: "p",
    // «Дұрыс па, бұрыс па?» уже с вопросом — точку после него не ставим
    runs: [{ text: `${tasks.length + 1}-тапсырма. ${title}${/[?!]$/.test(title) ? "" : "."} `, bold: true }, { text: hint, italic: true }],
    after: 4,
  });
  const answerTitle = (title: string): Block => p(`${tasks.length + 1}. ${title}`, { bold: true, after: 2 });

  // Сәйкестендіру: термины слева по номерам, анықтамалар справа под буквами вперемешку
  if (d.matching.length > 0) {
    const definitions = shuffled(d.matching, `${m.topic}match`);
    answers.push(
      answerTitle("Сәйкестендіру"),
      p(d.matching.map((item, i) => `${i + 1} – ${LETTERS[definitions.indexOf(item)]}`).join(";  "), { after: 8 }),
    );
    tasks.push([
      heading("Сәйкестендір", "Терминді оның анықтамасымен сәйкестендір, жауапты төмендегі кестеге жаз."),
      {
        type: "table",
        columns: [3000, 6921],
        rows: d.matching.map((item, i) => ({
          cells: [cell(`${i + 1}. ${item.term}`), cell(`${LETTERS[i]}) ${definitions[i].definition}`)],
        })),
      },
      {
        type: "table",
        columns: Array(d.matching.length).fill(Math.floor(9921 / d.matching.length)),
        rows: [
          { cells: d.matching.map((_, i) => boldCell(String(i + 1), { shade: true })) },
          { height: 20, cells: d.matching.map(() => cell([])) },
        ],
      },
    ]);
  }

  // Сөзжұмбақ: сетку и номера раскладывает код (crossword.ts)
  const cross = buildCrossword(d.crossword);
  if (cross) {
    const numbers = new Map(cross.words.map((w) => [`${w.row},${w.col}`, w.number]));
    const clues = (across: boolean) =>
      cross.words.filter((w) => w.across === across).map((w): Block => p(`${w.number}. ${w.clue}`, { indent: 12 }));
    answers.push(answerTitle("Сөзжұмбақ"), crosswordGrid(cross.grid, numbers, true));
    tasks.push([
      heading("Сөзжұмбақ", "Сұрақтарға жауап беріп, сөздерді торға жаз."),
      crosswordGrid(cross.grid, numbers, false),
      p("Көлденеңінен:", { bold: true, after: 2 }),
      ...clues(true),
      p("Тігінен:", { bold: true, after: 2 }),
      ...clues(false),
      p("", { after: 6 }),
    ]);
  }

  // Бос орынды толтыр: сөздер қоры вперемешку, предложения по номерам
  if (d.gaps.length > 0) {
    const bank = shuffled(
      d.gaps.map((g) => g.answer.trim()),
      `${m.topic}gaps`,
    );
    answers.push(answerTitle("Бос орынды толтыру"), p(d.gaps.map((g, i) => `${i + 1}) ${g.answer}`).join(";  "), { after: 8 }));
    tasks.push([
      heading("Бос орынды толтыр", "Сөздер қорынан керекті сөзді таңдап, сөйлемді толықтыр."),
      { type: "p", runs: [{ text: "Сөздер қоры: ", bold: true }, { text: bank.join("   •   ") }], after: 4 },
      ...d.gaps.map((g, i): Block => p(`${i + 1}. ${withGap(g.sentence, g.answer)}`, { after: 3 })),
      p("", { after: 6 }),
    ]);
  }

  // Дұрыс па, бұрыс па: отметить «+» в колонке
  if (d.trueFalse.length > 0) {
    answers.push(
      answerTitle("Дұрыс / бұрыс"),
      p(d.trueFalse.map((s, i) => `${i + 1}) ${s.correct ? "дұрыс" : "бұрыс"}`).join(";  "), { after: 8 }),
    );
    tasks.push([
      heading("Дұрыс па, бұрыс па?", "Тұжырым дұрыс болса «Дұрыс», қате болса «Бұрыс» бағанына + белгісін қой."),
      {
        type: "table",
        columns: [600, 7121, 1100, 1100],
        rows: [
          { header: true, cells: ["№", "Тұжырым", "Дұрыс", "Бұрыс"].map((name) => boldCell(name, { shade: true })) },
          ...d.trueFalse.map((s, i) => ({
            cells: [cell([{ runs: [{ text: String(i + 1) }], align: "center" as const }]), cell(s.statement), cell([]), cell([])],
          })),
        ],
      },
    ]);
  }

  // Ойлан да жауап бер: под каждым вопросом — строки для ответа
  if (d.questions.length > 0) {
    answers.push(
      answerTitle("Ойлан да жауап бер"),
      ...d.questions.flatMap((q, i): Block[] =>
        textParas(`${i + 1}) ${q.answer}`).map((para, j, all): Block => ({ type: "p", ...para, after: j === all.length - 1 ? 4 : 0 })),
      ),
    );
    tasks.push([
      heading("Ойлан да жауап бер", "Сұраққа толық жауап жаз."),
      ...d.questions.flatMap((q, i): Block[] => [
        ...textParas(`${i + 1}. ${q.question}`).map((para): Block => ({ type: "p", ...para, after: 2 })),
        p(ANSWER_LINE, { after: 2 }),
        p(ANSWER_LINE, { after: 8 }),
      ]),
    ]);
  }

  return {
    title: `Жұмыс парағы — ${m.topic}`,
    landscape: false,
    blocks: [
      ...school(m),
      p(`Жұмыс парағы: ${m.topic}`, { bold: true, align: "center", size: 14, after: 2 }),
      p(`${m.subjectName}, ${m.grade}-сынып`, { align: "center", after: 6 }),
      p("Оқушының аты-жөні: ______________________________   Күні: __________", { after: 10 }),
      ...tasks.flat(),
      p("Рефлексия", { bold: true, after: 2 }),
      p("Бүгін мен білдім: ______________________________________________________________", { after: 2 }),
      p("Маған қиын болды: _____________________________________________________________", { after: 2 }),
      { type: "pageBreak" },
      p(`Жауаптар (мұғалімге): ${m.topic}`, { bold: true, after: 6 }),
      ...answers,
    ],
  };
}

/** Документ в виде модели — из неё делаются предпросмотр, печать и Word */
export function buildDocument<K extends DocKind>(kind: K, data: DocData[K], meta: DocMeta): Doc {
  if (kind === "kmzh") return kmzh(data as DocData["kmzh"], meta);
  if (kind === "test") return test(data as DocData["test"], meta);
  if (kind === "pisa") return pisa(data as DocData["pisa"], meta);
  if (kind === "worksheet") return worksheet(data as DocData["worksheet"], meta);
  return bzhb(data as DocData["bzhb"], meta);
}
