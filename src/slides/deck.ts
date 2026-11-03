import type { Deck, Language, TopicPackage } from "@/types/topic-package";

// Слайды-заготовки (цели, план, таблица, рефлексия…): их тексты по умолчанию —
// подсказки для учителя на языке урока. Что учитель поменял в конструкторе,
// лежит в pkg.deck и заменяет подсказку целым разделом.

const defaults: Record<Language, Omit<Deck, "table">> = {
  kk: {
    goals: {
      title: "Сабақтың мақсаты",
      items: [
        { title: "Білу", body: "Оқушылар … біледі" },
        { title: "Түсіну", body: "Оқушылар … түсінеді" },
        { title: "Қолдану", body: "Оқушылар … қолдана алады" },
      ],
    },
    plan: {
      title: "Сабақ жоспары",
      steps: [
        { name: "Ұйымдастыру", time: "3 мин" },
        { name: "Жаңа тақырып", time: "15 мин" },
        { name: "Бекіту", time: "15 мин" },
        { name: "Рефлексия", time: "5 мин" },
      ],
    },
    textImage: {
      title: "Тақырыпшаны жазыңыз",
      bullets: ["Бірінші ойды осында жазыңыз", "Екінші ойды осында жазыңыз", "Үшінші ойды осында жазыңыз"],
    },
    bigImage: { caption: "Суретке түсініктеме жазыңыз" },
    compare: {
      title: "Салыстырайық",
      left: "1-ұғым",
      right: "2-ұғым",
      leftLines: ["Белгісі …", "Белгісі …", "Белгісі …"],
      rightLines: ["Белгісі …", "Белгісі …", "Белгісі …"],
    },
    numbers: {
      title: "Сандар сөйлейді",
      items: [0, 1, 2].map(() => ({ value: "00", caption: "Бұл сан нені білдіреді?" })),
    },
    chart: {
      title: "Диаграмма атауын жазыңыз",
      items: [
        { label: "1-топ", value: 40 },
        { label: "2-топ", value: 65 },
        { label: "3-топ", value: 30 },
        { label: "4-топ", value: 80 },
      ],
    },
    think: {
      title: "Ойланайық",
      question: "Талқылауға арналған сұрақты осында жазыңыз?",
      hint: "Ойлан — жұптас — бөліс · 3 минут",
    },
    task: {
      title: "Тапсырма",
      name: "1-тапсырма",
      lines: ["Тапсырманың шартын осында жазыңыз", "Не істеу керек — қадам бойынша", "Уақыты: 5 минут"],
      criteriaTitle: "Дескрипторлар",
      criteria: ["Анықтаманы атайды", "Мысал келтіреді", "Қорытынды жасайды"],
    },
    reflection: { title: "Рефлексия", items: ["Бүгін мен білдім…", "Маған қиын болды…", "Мен әлі білгім келеді…"] },
    homework: { title: "Үй тапсырмасы", lines: ["§ ___ , ___-бетті оқу", "___-жаттығуды орындау"], thanks: "Сабаққа рахмет!" },
  },
  ru: {
    goals: {
      title: "Цели урока",
      items: [
        { title: "Знать", body: "Учащиеся будут знать …" },
        { title: "Понимать", body: "Учащиеся поймут …" },
        { title: "Применять", body: "Учащиеся смогут …" },
      ],
    },
    plan: {
      title: "План урока",
      steps: [
        { name: "Орг. момент", time: "3 мин" },
        { name: "Новая тема", time: "15 мин" },
        { name: "Закрепление", time: "15 мин" },
        { name: "Рефлексия", time: "5 мин" },
      ],
    },
    textImage: {
      title: "Впишите подзаголовок",
      bullets: ["Впишите первую мысль", "Впишите вторую мысль", "Впишите третью мысль"],
    },
    bigImage: { caption: "Впишите подпись к рисунку" },
    compare: {
      title: "Сравним",
      left: "Понятие 1",
      right: "Понятие 2",
      leftLines: ["Признак …", "Признак …", "Признак …"],
      rightLines: ["Признак …", "Признак …", "Признак …"],
    },
    numbers: {
      title: "Цифры и факты",
      items: [0, 1, 2].map(() => ({ value: "00", caption: "Что означает это число?" })),
    },
    chart: {
      title: "Впишите название диаграммы",
      items: [
        { label: "Группа 1", value: 40 },
        { label: "Группа 2", value: 65 },
        { label: "Группа 3", value: 30 },
        { label: "Группа 4", value: 80 },
      ],
    },
    think: {
      title: "Подумаем",
      question: "Впишите вопрос для обсуждения?",
      hint: "Думай — объединяйся — делись · 3 минуты",
    },
    task: {
      title: "Задание",
      name: "Задание 1",
      lines: ["Впишите условие задания", "Что нужно сделать — по шагам", "Время: 5 минут"],
      criteriaTitle: "Дескрипторы",
      criteria: ["Называет определение", "Приводит пример", "Делает вывод"],
    },
    reflection: { title: "Рефлексия", items: ["Сегодня я узнал…", "Мне было трудно…", "Я хочу узнать…"] },
    homework: { title: "Домашнее задание", lines: ["§ ___ , стр. ___ прочитать", "Выполнить упражнение ___"], thanks: "Спасибо за урок!" },
  },
};

const tableText = {
  kk: { title: "Кесте", columns: ["1-баған", "2-баған", "3-баған"], formula: ["Белгісі", "Шама", "Өлшем бірлігі"] },
  ru: { title: "Таблица", columns: ["Столбец 1", "Столбец 2", "Столбец 3"], formula: ["Обозначение", "Величина", "Единица"] },
} satisfies Record<Language, unknown>;

// Таблица по умолчанию: если у темы есть формула — её величины, иначе пустая сетка
function defaultTable(pkg: TopicPackage): Deck["table"] {
  const { title, columns, formula } = tableText[pkg.language];
  if (pkg.formula && pkg.formula.variables.length > 0) {
    return {
      title,
      columns: formula,
      rows: pkg.formula.variables.slice(0, 8).map((v) => [v.symbol, v.meaning, v.unit ?? "—"]),
    };
  }
  return { title, columns, rows: [0, 1, 2].map(() => columns.map(() => "…")) };
}

/** Все тексты заготовок: правки учителя поверх подсказок по умолчанию */
export function resolveDeck(pkg: TopicPackage): Deck {
  return { ...defaults[pkg.language], table: defaultTable(pkg), ...pkg.deck };
}
