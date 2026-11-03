import { layoutSchemas, type DeckType, type Language, type LayoutData, type LayoutKind, type TopicPackage } from "@/types/topic-package";
import { messages } from "@/i18n/locale";
import type { IconName } from "./icons";

// Виды презентаций (структуры): какие слайды идут подряд и какой на них
// текст-подсказка по умолчанию. Слайд = раскладка (layout.ts) + данные.
// Одна раскладка служит разным целям: «Цифры» в уроке — интересные числа по теме,
// в отчёте — показатели класса. Что учитель поменял, лежит в pkg.deck[id слайда].
//
// Новый вид: значение в deckTypeSchema + список слайдов здесь + название в словарях (deckTypes).

/** Слайды с содержанием темы из пакета (AI пишет их вместе с вопросами для игр) */
export type ContentKind = "definition" | "facts" | "examples" | "terms";

type Text<K extends LayoutKind> = LayoutData<K> | ((pkg: TopicPackage) => LayoutData<K>);

export type DataSlide = {
  [K in LayoutKind]: { id: string; kind: K; icons?: IconName[]; text: Record<Language, Text<K>> };
}[LayoutKind];
export type StructureSlide = { id: string; kind: ContentKind } | DataSlide;

const slide = <K extends LayoutKind>(id: string, kind: K, kk: Text<K>, ru: Text<K>, icons?: IconName[]): DataSlide =>
  ({ id, kind, icons, text: { kk, ru } }) as DataSlide;
const content = (kind: ContentKind): StructureSlide => ({ id: kind, kind });

// ——— Общие части ———

const gradeWord = { kk: "сынып", ru: "класс" };
const subjectLine = (pkg: TopicPackage) => `${messages[pkg.language].subjects[pkg.subject]} · ${pkg.grade}-${gradeWord[pkg.language]}`;

/** Титульный: надпись над темой (по умолчанию — предмет и класс) и автор внизу */
const title = (kicker: Record<Language, string> | null, author: Record<Language, string>) =>
  slide(
    "title",
    "title",
    (pkg) => ({ kicker: kicker?.kk ?? subjectLine(pkg), author: author.kk }),
    (pkg) => ({ kicker: kicker?.ru ?? subjectLine(pkg), author: author.ru }),
  );
const noAuthor = { kk: "", ru: "" };
const preparedBy = { kk: "Дайындаған: Аты-жөні, мектеп", ru: "Подготовил(а): ФИО, школа" };

const lessonGoals = slide(
  "goals",
  "goals",
  {
    title: "Сабақтың мақсаты",
    items: [
      { title: "Білу", body: "Оқушылар … біледі" },
      { title: "Түсіну", body: "Оқушылар … түсінеді" },
      { title: "Қолдану", body: "Оқушылар … қолдана алады" },
    ],
  },
  {
    title: "Цели урока",
    items: [
      { title: "Знать", body: "Учащиеся будут знать …" },
      { title: "Понимать", body: "Учащиеся поймут …" },
      { title: "Применять", body: "Учащиеся смогут …" },
    ],
  },
  ["lightbulb", "brain", "rocket"],
);

const lessonPlan = slide(
  "plan",
  "plan",
  {
    title: "Сабақ жоспары",
    steps: [
      { name: "Ұйымдастыру", time: "3 мин" },
      { name: "Жаңа тақырып", time: "15 мин" },
      { name: "Бекіту", time: "15 мин" },
      { name: "Рефлексия", time: "5 мин" },
    ],
  },
  {
    title: "План урока",
    steps: [
      { name: "Орг. момент", time: "3 мин" },
      { name: "Новая тема", time: "15 мин" },
      { name: "Закрепление", time: "15 мин" },
      { name: "Рефлексия", time: "5 мин" },
    ],
  },
);

const lessonTask = slide(
  "task",
  "task",
  {
    title: "Тапсырма",
    name: "1-тапсырма",
    lines: ["Тапсырманың шартын осында жазыңыз", "Не істеу керек — қадам бойынша", "Уақыты: 5 минут"],
    criteriaTitle: "Дескрипторлар",
    criteria: ["Анықтаманы атайды", "Мысал келтіреді", "Қорытынды жасайды"],
  },
  {
    title: "Задание",
    name: "Задание 1",
    lines: ["Впишите условие задания", "Что нужно сделать — по шагам", "Время: 5 минут"],
    criteriaTitle: "Дескрипторы",
    criteria: ["Называет определение", "Приводит пример", "Делает вывод"],
  },
);

const lessonReflection = slide(
  "reflection",
  "reflection",
  { title: "Рефлексия", items: ["Бүгін мен білдім…", "Маған қиын болды…", "Мен әлі білгім келеді…"] },
  { title: "Рефлексия", items: ["Сегодня я узнал…", "Мне было трудно…", "Я хочу узнать…"] },
  ["star", "puzzle", "heart"],
);

const groupsChart = (id: string, kk: string, ru: string) =>
  slide(
    id,
    "chart",
    { title: kk, items: [1, 2, 3, 4].map((n, i) => ({ label: `${n}-топ`, value: [40, 65, 30, 80][i] })) },
    { title: ru, items: [1, 2, 3, 4].map((n, i) => ({ label: `Группа ${n}`, value: [40, 65, 30, 80][i] })) },
  );

const yearsChart = (id: string, kk: string, ru: string) => {
  const items = [
    { label: "2023–2024", value: 60 },
    { label: "2024–2025", value: 65 },
    { label: "2025–2026", value: 70 },
  ];
  return slide(id, "chart", { title: kk, items }, { title: ru, items });
};

const epigraph = (id: string, kk: string, ru: string) =>
  slide(
    id,
    "think",
    { title: kk, question: "«Нақыл сөзді немесе дана ойды осында жазыңыз»", hint: "— Авторы" },
    { title: ru, question: "«Впишите цитату или мудрую мысль»", hint: "— Автор" },
    ["quote"],
  );

const thanks = (id: string, kk: { title: string; lines: string[]; thanks: string }, ru: typeof kk, icon: IconName) =>
  slide(id, "homework", kk, ru, [icon]);

// Таблица урока по умолчанию: если у темы есть формула — её величины, иначе пустая сетка
const lessonTable = (language: Language) => (pkg: TopicPackage): LayoutData<"table"> => {
  const text = {
    kk: { title: "Кесте", columns: ["1-баған", "2-баған", "3-баған"], formula: ["Белгісі", "Шама", "Өлшем бірлігі"] },
    ru: { title: "Таблица", columns: ["Столбец 1", "Столбец 2", "Столбец 3"], formula: ["Обозначение", "Величина", "Единица"] },
  }[language];
  if (pkg.formula && pkg.formula.variables.length > 0) {
    return {
      title: text.title,
      columns: text.formula,
      rows: pkg.formula.variables.slice(0, 8).map((v) => [v.symbol, v.meaning, v.unit ?? "—"]),
    };
  }
  return { title: text.title, columns: text.columns, rows: [0, 1, 2].map(() => text.columns.map(() => "…")) };
};

// ——— Виды ———

export const structures: Record<DeckType, StructureSlide[]> = {
  // Урок: содержание темы + заготовки для всех этапов урока
  lesson: [
    title(null, noAuthor),
    lessonGoals,
    lessonPlan,
    content("definition"),
    content("facts"),
    content("examples"),
    content("terms"),
    slide(
      "textImage",
      "text-image",
      { title: "Тақырыпшаны жазыңыз", bullets: ["Бірінші ойды осында жазыңыз", "Екінші ойды осында жазыңыз", "Үшінші ойды осында жазыңыз"] },
      { title: "Впишите подзаголовок", bullets: ["Впишите первую мысль", "Впишите вторую мысль", "Впишите третью мысль"] },
    ),
    slide("bigImage", "big-image", { caption: "Суретке түсініктеме жазыңыз" }, { caption: "Впишите подпись к рисунку" }),
    slide(
      "compare",
      "compare",
      { title: "Салыстырайық", left: "1-ұғым", right: "2-ұғым", leftLines: ["Белгісі …", "Белгісі …", "Белгісі …"], rightLines: ["Белгісі …", "Белгісі …", "Белгісі …"] },
      { title: "Сравним", left: "Понятие 1", right: "Понятие 2", leftLines: ["Признак …", "Признак …", "Признак …"], rightLines: ["Признак …", "Признак …", "Признак …"] },
    ),
    slide(
      "numbers",
      "numbers",
      { title: "Сандар сөйлейді", items: [0, 1, 2].map(() => ({ value: "00", caption: "Бұл сан нені білдіреді?" })) },
      { title: "Цифры и факты", items: [0, 1, 2].map(() => ({ value: "00", caption: "Что означает это число?" })) },
    ),
    slide("table", "table", lessonTable("kk"), lessonTable("ru")),
    groupsChart("chart", "Диаграмма атауын жазыңыз", "Впишите название диаграммы"),
    slide(
      "think",
      "think",
      { title: "Ойланайық", question: "Талқылауға арналған сұрақты осында жазыңыз?", hint: "Ойлан — жұптас — бөліс · 3 минут" },
      { title: "Подумаем", question: "Впишите вопрос для обсуждения?", hint: "Думай — объединяйся — делись · 3 минуты" },
      ["question"],
    ),
    lessonTask,
    lessonReflection,
    thanks(
      "homework",
      { title: "Үй тапсырмасы", lines: ["§ ___ , ___-бетті оқу", "___-жаттығуды орындау"], thanks: "Сабаққа рахмет!" },
      { title: "Домашнее задание", lines: ["§ ___ , стр. ___ прочитать", "Выполнить упражнение ___"], thanks: "Спасибо за урок!" },
      "house",
    ),
  ],

  // Открытый урок / конкурс педагогов: эпиграф, методы, результат урока
  "open-lesson": [
    title(null, preparedBy),
    epigraph("open.epigraph", "Сабақтың эпиграфы", "Эпиграф урока"),
    lessonGoals,
    slide(
      "open.methods",
      "goals",
      {
        title: "Қолданылатын әдіс-тәсілдер",
        items: [
          { title: "Топтық жұмыс", body: "Қалай қолданылады …" },
          { title: "Сыни ойлау", body: "Қандай тапсырмалар …" },
          { title: "Ойын элементтері", body: "Сабақтың қай кезеңінде …" },
        ],
      },
      {
        title: "Методы и приёмы",
        items: [
          { title: "Работа в группах", body: "Как применяется …" },
          { title: "Критическое мышление", body: "Какие задания …" },
          { title: "Игровые элементы", body: "На каком этапе урока …" },
        ],
      },
      ["users", "brain", "puzzle"],
    ),
    lessonPlan,
    content("definition"),
    content("facts"),
    content("examples"),
    lessonTask,
    groupsChart("open.results", "Сабақ нәтижесі: топтар бойынша", "Результат урока по группам"),
    lessonReflection,
    thanks(
      "open.end",
      { title: "Үй тапсырмасы", lines: ["Үй тапсырмасын осында жазыңыз"], thanks: "Назарларыңызға рахмет!" },
      { title: "Домашнее задание", lines: ["Впишите домашнее задание"], thanks: "Спасибо за внимание!" },
      "flag",
    ),
  ],

  // Отчёт для комиссии: показатели, динамика, достижения, планы
  report: [
    title({ kk: "Жұмыс есебі", ru: "Отчёт о работе" }, preparedBy),
    slide(
      "report.goals",
      "bullets",
      { title: "Жұмыстың мақсаты мен міндеттері", lines: ["Мақсаты: …", "1-міндет: …", "2-міндет: …", "3-міндет: …"] },
      { title: "Цель и задачи работы", lines: ["Цель: …", "Задача 1: …", "Задача 2: …", "Задача 3: …"] },
    ),
    slide(
      "report.numbers",
      "numbers",
      {
        title: "Негізгі көрсеткіштер",
        items: [
          { value: "…%", caption: "Үлгерім" },
          { value: "…%", caption: "Білім сапасы" },
          { value: "…", caption: "Олимпиада мен байқау жүлдегерлері" },
        ],
      },
      {
        title: "Основные показатели",
        items: [
          { value: "…%", caption: "Успеваемость" },
          { value: "…%", caption: "Качество знаний" },
          { value: "…", caption: "Призёры олимпиад и конкурсов" },
        ],
      },
    ),
    slide(
      "report.table",
      "table",
      {
        title: "Оқу нәтижелері",
        columns: ["Оқу жылы", "Үлгерім", "Білім сапасы"],
        rows: ["2023–2024", "2024–2025", "2025–2026"].map((year) => [year, "…%", "…%"]),
      },
      {
        title: "Результаты обучения",
        columns: ["Учебный год", "Успеваемость", "Качество знаний"],
        rows: ["2023–2024", "2024–2025", "2025–2026"].map((year) => [year, "…%", "…%"]),
      },
    ),
    yearsChart("report.chart", "Білім сапасының өсуі, %", "Динамика качества знаний, %"),
    slide(
      "report.work",
      "text-image",
      { title: "Атқарылған жұмыстар", bullets: ["Бірінші жұмыс …", "Екінші жұмыс …", "Үшінші жұмыс …"] },
      { title: "Проделанная работа", bullets: ["Первое направление …", "Второе направление …", "Третье направление …"] },
    ),
    slide(
      "report.achievements",
      "goals",
      {
        title: "Жетістіктер",
        items: [
          { title: "Оқушылар", body: "Олимпиада, байқау жүлделері …" },
          { title: "Мұғалім", body: "Курстар, сертификаттар …" },
          { title: "Мектеп", body: "Іс-шаралар, жобалар …" },
        ],
      },
      {
        title: "Достижения",
        items: [
          { title: "Ученики", body: "Призы олимпиад и конкурсов …" },
          { title: "Учитель", body: "Курсы, сертификаты …" },
          { title: "Школа", body: "Мероприятия, проекты …" },
        ],
      },
      ["trophy", "award", "school"],
    ),
    slide(
      "report.issues",
      "compare",
      { title: "Қиындықтар мен шешімдер", left: "Қиындықтар", right: "Шешімдер", leftLines: ["…", "…"], rightLines: ["…", "…"] },
      { title: "Трудности и решения", left: "Трудности", right: "Решения", leftLines: ["…", "…"], rightLines: ["…", "…"] },
    ),
    slide(
      "report.plan",
      "plan",
      { title: "Келесі жылға жоспар", steps: ["I", "II", "III", "IV"].map((q) => ({ name: "…", time: `${q} тоқсан` })) },
      { title: "План на следующий год", steps: ["I", "II", "III", "IV"].map((q) => ({ name: "…", time: `${q} четверть` })) },
    ),
    thanks(
      "report.end",
      { title: "Қорытынды", lines: ["Жалпы қорытындыны осында жазыңыз"], thanks: "Назарларыңызға рахмет!" },
      { title: "Выводы", lines: ["Впишите общий вывод"], thanks: "Спасибо за внимание!" },
      "flag",
    ),
  ],

  // Доклад на семинаре, педсовете, конференции
  talk: [
    title({ kk: "Баяндама", ru: "Доклад" }, preparedBy),
    slide(
      "talk.relevance",
      "bullets",
      { title: "Тақырыптың өзектілігі", lines: ["Неге бұл тақырып маңызды …", "Қазіргі жағдай …", "Не өзгерту керек …"] },
      { title: "Актуальность темы", lines: ["Почему тема важна …", "Что происходит сейчас …", "Что нужно изменить …"] },
    ),
    slide(
      "talk.problem",
      "think",
      { title: "Негізгі мәселе", question: "Мәселені сұрақ түрінде жазыңыз?", hint: "Неге бұл маңызды?" },
      { title: "Главная проблема", question: "Сформулируйте проблему в виде вопроса?", hint: "Почему это важно?" },
      ["question"],
    ),
    slide(
      "talk.goals",
      "goals",
      {
        title: "Мақсаты мен міндеттері",
        items: [
          { title: "Мақсат", body: "…" },
          { title: "1-міндет", body: "…" },
          { title: "2-міндет", body: "…" },
        ],
      },
      {
        title: "Цель и задачи",
        items: [
          { title: "Цель", body: "…" },
          { title: "Задача 1", body: "…" },
          { title: "Задача 2", body: "…" },
        ],
      },
      ["target", "lightbulb", "rocket"],
    ),
    slide(
      "talk.main",
      "text-image",
      { title: "Негізгі бөлім", bullets: ["Бірінші ой …", "Екінші ой …", "Үшінші ой …"] },
      { title: "Основная часть", bullets: ["Первая мысль …", "Вторая мысль …", "Третья мысль …"] },
    ),
    slide(
      "talk.compare",
      "compare",
      { title: "Дәстүрлі және жаңа тәсіл", left: "Дәстүрлі", right: "Жаңа", leftLines: ["…", "…", "…"], rightLines: ["…", "…", "…"] },
      { title: "Традиционный и новый подход", left: "Традиционный", right: "Новый", leftLines: ["…", "…", "…"], rightLines: ["…", "…", "…"] },
    ),
    slide(
      "talk.numbers",
      "numbers",
      { title: "Зерттеу нәтижелері", items: [0, 1, 2].map(() => ({ value: "…", caption: "Бұл сан нені білдіреді?" })) },
      { title: "Результаты исследования", items: [0, 1, 2].map(() => ({ value: "…", caption: "Что означает это число?" })) },
    ),
    slide(
      "talk.chart",
      "chart",
      { title: "Нәтижелердің өзгеруі", items: [{ label: "Бастапқы", value: 40 }, { label: "Аралық", value: 55 }, { label: "Қорытынды", value: 75 }] },
      { title: "Изменение результатов", items: [{ label: "Начало", value: 40 }, { label: "Середина", value: 55 }, { label: "Итог", value: 75 }] },
    ),
    slide(
      "talk.conclusion",
      "bullets",
      { title: "Қорытынды мен ұсыныстар", lines: ["Қорытынды …", "1-ұсыныс …", "2-ұсыныс …"] },
      { title: "Выводы и рекомендации", lines: ["Вывод …", "Рекомендация 1 …", "Рекомендация 2 …"] },
    ),
    thanks(
      "talk.end",
      { title: "Пайдаланылған әдебиет", lines: ["1. Автор. Кітап атауы. — Қала, жылы.", "2. …"], thanks: "Назарларыңызға рахмет!" },
      { title: "Литература", lines: ["1. Автор. Название. — Город, год.", "2. …"], thanks: "Спасибо за внимание!" },
      "book",
    ),
  ],

  // Классный час: воспитательная тема, обсуждение, групповая работа
  "class-hour": [
    title({ kk: "Сынып сағаты", ru: "Классный час" }, { kk: "Сынып жетекшісі: Аты-жөні", ru: "Классный руководитель: ФИО" }),
    epigraph("ch.epigraph", "Бүгінгі ой", "Мысль дня"),
    slide(
      "ch.goals",
      "goals",
      {
        title: "Сынып сағатының мақсаты",
        items: [
          { title: "Білімділік", body: "Оқушылар … біледі" },
          { title: "Дамытушылық", body: "… дағдысын дамыту" },
          { title: "Тәрбиелік", body: "… қасиетін тәрбиелеу" },
        ],
      },
      {
        title: "Цели классного часа",
        items: [
          { title: "Образовательная", body: "Ученики узнают …" },
          { title: "Развивающая", body: "Развивать умение …" },
          { title: "Воспитательная", body: "Воспитывать …" },
        ],
      },
      ["lightbulb", "brain", "heart"],
    ),
    slide(
      "ch.intro",
      "text-image",
      { title: "Тақырыпқа кіріспе", bullets: ["…", "…", "…"] },
      { title: "Введение в тему", bullets: ["…", "…", "…"] },
    ),
    content("facts"),
    slide("ch.video", "big-image", { caption: "Бейнеролик немесе суретке түсініктеме" }, { caption: "Подпись к видео или рисунку" }),
    slide(
      "ch.task",
      "task",
      {
        title: "Топпен жұмыс",
        name: "Топтық тапсырма",
        lines: ["Тапсырманың шартын жазыңыз", "Уақыты: 7 минут"],
        criteriaTitle: "Бағалау",
        criteria: ["Белсенді қатысады", "Пікірін дәлелдейді", "Топпен келісіп жұмыс істейді"],
      },
      {
        title: "Работа в группах",
        name: "Групповое задание",
        lines: ["Впишите условие задания", "Время: 7 минут"],
        criteriaTitle: "Оценивание",
        criteria: ["Активно участвует", "Аргументирует мнение", "Работает в команде"],
      },
    ),
    slide(
      "ch.discussion",
      "think",
      { title: "Пікірталас", question: "Сен қалай ойлайсың: …?", hint: "Ойлан — жұптас — бөліс · 5 минут" },
      { title: "Обсуждение", question: "Как ты думаешь: …?", hint: "Думай — объединяйся — делись · 5 минут" },
      ["messages"],
    ),
    lessonReflection,
    thanks(
      "ch.end",
      { title: "Бүгінгі түйін", lines: ["Бүгінгі сынып сағатының басты ойы …"], thanks: "Қатысқандарыңызға рахмет!" },
      { title: "Главный вывод", lines: ["Главная мысль классного часа …"], thanks: "Спасибо за участие!" },
      "smile",
    ),
  ],

  // Родительское собрание: повестка, показатели класса, советы, решение
  parents: [
    title({ kk: "Ата-аналар жиналысы", ru: "Родительское собрание" }, { kk: "Сынып жетекшісі: Аты-жөні", ru: "Классный руководитель: ФИО" }),
    slide(
      "par.agenda",
      "plan",
      {
        title: "Күн тәртібі",
        steps: [
          { name: "Тоқсан қорытындысы", time: "10 мин" },
          { name: "Сынып жетістіктері", time: "10 мин" },
          { name: "Мәселелер", time: "10 мин" },
          { name: "Ұсыныстар", time: "10 мин" },
        ],
      },
      {
        title: "Повестка дня",
        steps: [
          { name: "Итоги четверти", time: "10 мин" },
          { name: "Успехи класса", time: "10 мин" },
          { name: "Проблемы", time: "10 мин" },
          { name: "Предложения", time: "10 мин" },
        ],
      },
    ),
    slide(
      "par.numbers",
      "numbers",
      {
        title: "Сынып көрсеткіштері",
        items: [
          { value: "…", caption: "Оқушы саны" },
          { value: "…%", caption: "Үлгерім" },
          { value: "…%", caption: "Білім сапасы" },
        ],
      },
      {
        title: "Показатели класса",
        items: [
          { value: "…", caption: "Учеников в классе" },
          { value: "…%", caption: "Успеваемость" },
          { value: "…%", caption: "Качество знаний" },
        ],
      },
    ),
    slide(
      "par.chart",
      "chart",
      { title: "Тоқсандар бойынша білім сапасы, %", items: ["I", "II", "III"].map((q, i) => ({ label: `${q} тоқсан`, value: [60, 65, 70][i] })) },
      { title: "Качество знаний по четвертям, %", items: ["I", "II", "III"].map((q, i) => ({ label: `${q} четверть`, value: [60, 65, 70][i] })) },
    ),
    slide(
      "par.achievements",
      "goals",
      {
        title: "Жетістіктеріміз",
        items: [
          { title: "Оқу", body: "…" },
          { title: "Спорт", body: "…" },
          { title: "Өнер", body: "…" },
        ],
      },
      {
        title: "Наши успехи",
        items: [
          { title: "Учёба", body: "…" },
          { title: "Спорт", body: "…" },
          { title: "Творчество", body: "…" },
        ],
      },
      ["trophy", "star", "award"],
    ),
    slide(
      "par.issues",
      "bullets",
      { title: "Назар аударатын мәселелер", lines: ["…", "…", "…"] },
      { title: "На что обратить внимание", lines: ["…", "…", "…"] },
    ),
    slide(
      "par.advice",
      "bullets",
      { title: "Ата-аналарға кеңес", lines: ["Күн тәртібін бақылау …", "Үй тапсырмасына көмек …", "Баламен сөйлесу …"] },
      { title: "Советы родителям", lines: ["Следить за режимом дня …", "Помогать с домашним заданием …", "Разговаривать с ребёнком …"] },
    ),
    slide(
      "par.decision",
      "bullets",
      { title: "Жиналыс шешімі", lines: ["1. …", "2. …", "3. …"] },
      { title: "Решение собрания", lines: ["1. …", "2. …", "3. …"] },
    ),
    thanks(
      "par.end",
      { title: "Байланыс", lines: ["Сынып жетекшісі: …", "Телефон: …"], thanks: "Рахмет! Бірге жұмыс істейік!" },
      { title: "Контакты", lines: ["Классный руководитель: …", "Телефон: …"], thanks: "Спасибо! Работаем вместе!" },
      "handshake",
    ),
  ],

  // Аттестация / портфолио педагога: опыт, кредо, курсы, результаты учеников
  attestation: [
    title({ kk: "Педагог портфолиосы", ru: "Портфолио педагога" }, { kk: "Аты-жөні, пән мұғалімі", ru: "ФИО, учитель предмета" }),
    slide(
      "att.about",
      "text-image",
      { title: "Өзім туралы", bullets: ["Білімі: …", "Педагогикалық өтілі: … жыл", "Біліктілік санаты: …"] },
      { title: "О себе", bullets: ["Образование: …", "Педагогический стаж: … лет", "Квалификационная категория: …"] },
    ),
    slide(
      "att.numbers",
      "numbers",
      {
        title: "Сандармен",
        items: [
          { value: "… жыл", caption: "Педагогикалық өтіл" },
          { value: "…", caption: "Курстар мен сертификаттар" },
          { value: "…", caption: "Жүлделі оқушылар" },
        ],
      },
      {
        title: "В цифрах",
        items: [
          { value: "… лет", caption: "Педагогический стаж" },
          { value: "…", caption: "Курсы и сертификаты" },
          { value: "…", caption: "Учеников-призёров" },
        ],
      },
    ),
    epigraph("att.credo", "Педагогикалық ұстанымым", "Моё педагогическое кредо"),
    slide(
      "att.methods",
      "goals",
      {
        title: "Қолданатын әдістерім",
        items: [
          { title: "1-әдіс", body: "Қалай қолданамын …" },
          { title: "2-әдіс", body: "Қандай нәтиже береді …" },
          { title: "3-әдіс", body: "Қай сыныптарда …" },
        ],
      },
      {
        title: "Мои методы",
        items: [
          { title: "Метод 1", body: "Как применяю …" },
          { title: "Метод 2", body: "Какой даёт результат …" },
          { title: "Метод 3", body: "В каких классах …" },
        ],
      },
      ["lightbulb", "users", "rocket"],
    ),
    slide(
      "att.courses",
      "table",
      { title: "Біліктілікті арттыру", columns: ["Жылы", "Курс атауы", "Сағат"], rows: [0, 1, 2].map(() => ["…", "…", "…"]) },
      { title: "Повышение квалификации", columns: ["Год", "Название курса", "Часы"], rows: [0, 1, 2].map(() => ["…", "…", "…"]) },
    ),
    yearsChart("att.results", "Оқушылардың білім сапасы, %", "Качество знаний учеников, %"),
    slide(
      "att.awards",
      "bullets",
      { title: "Жетістіктер мен марапаттар", lines: ["…", "…", "…"] },
      { title: "Достижения и награды", lines: ["…", "…", "…"] },
    ),
    slide(
      "att.plan",
      "plan",
      { title: "Кәсіби даму жоспары", steps: ["2026", "2027", "2028", "2029"].map((year) => ({ name: "…", time: year })) },
      { title: "План профессионального развития", steps: ["2026", "2027", "2028", "2029"].map((year) => ({ name: "…", time: year })) },
    ),
    thanks(
      "att.end",
      { title: "Қорытынды", lines: ["Басты қорытындыны осында жазыңыз"], thanks: "Назарларыңызға рахмет!" },
      { title: "Заключение", lines: ["Впишите главный вывод"], thanks: "Спасибо за внимание!" },
      "graduation",
    ),
  ],
};

export const deckTypeOrder = Object.keys(structures) as DeckType[];

export const structureOf = (pkg: TopicPackage) => structures[pkg.deckType ?? "lesson"];

export const isDataSlide = (s: StructureSlide): s is DataSlide => s.kind in layoutSchemas;

/** Слайд вида презентации по id (для кнопки «AI» и конструктора) */
export const findSlide = (pkg: TopicPackage, id: string) => structureOf(pkg).find((s) => s.id === id);

/** Слайд вида презентации с данной раскладкой */
export type SlideOf<K extends LayoutKind> = Extract<DataSlide, { kind: K }>;

/** Подсказка по умолчанию для слайда на языке урока */
export function defaultData<K extends LayoutKind>(pkg: TopicPackage, s: SlideOf<K>): LayoutData<K> {
  const text = s.text[pkg.language] as Text<K>;
  return typeof text === "function" ? text(pkg) : text;
}

/** Данные слайда: правка учителя, если она подходит раскладке, иначе подсказка */
export function slideData<K extends LayoutKind>(pkg: TopicPackage, s: SlideOf<K>): LayoutData<K> {
  const stored = layoutSchemas[s.kind as K].safeParse(pkg.deck?.[s.id]);
  return stored.success ? (stored.data as LayoutData<K>) : defaultData(pkg, s);
}

/** id слайдов-заготовок вида (без титульного) — их заполняет «AI для всех слайдов» */
export const deckSlideIds = (pkg: TopicPackage) =>
  structureOf(pkg)
    .filter((s) => isDataSlide(s) && s.kind !== "title")
    .map((s) => s.id);
