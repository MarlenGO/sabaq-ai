import type { DeckType, Subject } from "@/types/topic-package";

// Шаблон презентации = цвета + шрифты + украшение. Раскладка слайдов общая
// (src/slides/layout.ts), поэтому любая тема ложится в любой шаблон,
// а новый шаблон — это новый объект здесь, без нового кода.
//
// Цвета — hex без «#» (так их ждёт PowerPoint). Шрифт во всех стилях — Times New Roman:
// так принято в школьных документах, он есть на любом Windows и умеет казахские буквы.

export interface SlideTemplate {
  id: string;
  name: string;
  description: string;
  colors: {
    background: string;
    /** Подложка карточек и формулы */
    surface: string;
    text: string;
    muted: string;
    accent: string;
    /** Текст поверх accent */
    onAccent: string;
  };
  fonts: { heading: string; body: string };
  /** Декоративные круги в углу: прозрачность 0–100 (100 — не видно) */
  decor: { color: string; transparency: number } | null;
  /** Второй цвет для мелких деталей (золотые линии, точки) — у праздничных стилей */
  detail?: string;
}

export const templates: SlideTemplate[] = [
  {
    id: "classic",
    name: "Классика",
    description: "Ақ фон, қатаң — ашық сабаққа",
    colors: {
      background: "FFFFFF",
      surface: "F2F4F7",
      text: "1D1D1F",
      muted: "5F6368",
      accent: "1F4E9C",
      onAccent: "FFFFFF",
    },
    fonts: { heading: "Times New Roman", body: "Times New Roman" },
    decor: null,
  },
  {
    id: "science",
    name: "Ғылым",
    description: "Көк түстер — физика, химия",
    colors: {
      background: "0B3D91",
      surface: "1A4FA8",
      text: "FFFFFF",
      muted: "C9DAF5",
      accent: "7DD3FC",
      onAccent: "0B3D91",
    },
    fonts: { heading: "Times New Roman", body: "Times New Roman" },
    decor: { color: "FFFFFF", transparency: 88 },
  },
  {
    id: "nature",
    name: "Табиғат",
    description: "Жасыл түстер — биология, география",
    colors: {
      background: "F3F8EF",
      surface: "E1EDD7",
      text: "1E3A1E",
      muted: "4F6B4A",
      accent: "2E7D32",
      onAccent: "FFFFFF",
    },
    fonts: { heading: "Times New Roman", body: "Times New Roman" },
    decor: { color: "2E7D32", transparency: 90 },
  },
  {
    id: "history",
    name: "Тарих",
    description: "Жылы бежевый түстер — тарих, әдебиет",
    colors: {
      background: "FBF5EA",
      surface: "F1E4CC",
      text: "3E2C1C",
      muted: "7A6450",
      accent: "A0522D",
      onAccent: "FFFFFF",
    },
    fonts: { heading: "Times New Roman", body: "Times New Roman" },
    decor: { color: "A0522D", transparency: 90 },
  },
  {
    id: "dark",
    name: "Қараңғы",
    description: "Қараңғы фон — жарық сыныпта проекторға",
    colors: {
      background: "121417",
      surface: "23272E",
      text: "F5F5F7",
      muted: "A1A7B0",
      accent: "FFB020",
      onAccent: "121417",
    },
    fonts: { heading: "Times New Roman", body: "Times New Roman" },
    decor: { color: "FFB020", transparency: 90 },
  },
  // Стили, подобранные к видам презентаций (designs.ts выбирает их по умолчанию)
  {
    id: "festive",
    name: "Мереке",
    description: "Қою көк пен алтын — ашық сабақ, байқау",
    colors: {
      background: "FFFFFF",
      surface: "EEF0FA",
      text: "1B1F3B",
      muted: "5A5F7D",
      accent: "2B2D7C",
      onAccent: "FFFFFF",
    },
    fonts: { heading: "Times New Roman", body: "Times New Roman" },
    decor: null,
    detail: "E8A900",
  },
  {
    id: "corporate",
    name: "Есеп",
    description: "Ақ фон, көгілдір — есеп, кесте, диаграмма",
    colors: {
      background: "FFFFFF",
      surface: "EAF2F4",
      text: "1E2A33",
      muted: "5B6B77",
      accent: "0F6E7A",
      onAccent: "FFFFFF",
    },
    fonts: { heading: "Times New Roman", body: "Times New Roman" },
    decor: null,
  },
  {
    id: "academic",
    name: "Ғылыми",
    description: "Шие түс, қатаң сызықтар — баяндама",
    colors: {
      background: "FFFFFF",
      surface: "F4EEEE",
      text: "222222",
      muted: "666060",
      accent: "7A1F2B",
      onAccent: "FFFFFF",
    },
    fonts: { heading: "Times New Roman", body: "Times New Roman" },
    decor: null,
  },
  {
    id: "warm",
    name: "Жылы",
    description: "Күн сәулесіндей қызғылт сары — сынып сағаты",
    colors: {
      background: "FFF9F4",
      surface: "FDE9DA",
      text: "3A2A22",
      muted: "7D6355",
      accent: "D9622B",
      onAccent: "FFFFFF",
    },
    fonts: { heading: "Times New Roman", body: "Times New Roman" },
    decor: { color: "F2A541", transparency: 75 },
  },
  {
    id: "calm",
    name: "Тыныш",
    description: "Жұмсақ көк — ата-аналар жиналысы",
    colors: {
      background: "F7FAFC",
      surface: "E3EEF6",
      text: "1D2B36",
      muted: "5A6B78",
      accent: "2F6FA3",
      onAccent: "FFFFFF",
    },
    fonts: { heading: "Times New Roman", body: "Times New Roman" },
    decor: null,
  },
  {
    id: "elegant",
    name: "Салтанатты",
    description: "Қою жасыл мен жақтау — аттестация, портфолио",
    colors: {
      background: "FFFFFF",
      surface: "EEF2EE",
      text: "1F2A24",
      muted: "5F6A63",
      accent: "1E4D3A",
      onAccent: "FFFFFF",
    },
    fonts: { heading: "Times New Roman", body: "Times New Roman" },
    decor: null,
    detail: "B8963E",
  },
];

const bySubject: Partial<Record<Subject, string>> = {
  physics: "science",
  chemistry: "science",
  math: "science",
  informatics: "dark",
  biology: "nature",
  geography: "nature",
  history: "history",
};

/** Стиль вида презентации по умолчанию; у «урока» — по предмету */
const byDeckType: Partial<Record<DeckType, string>> = {
  "open-lesson": "festive",
  report: "corporate",
  talk: "academic",
  "class-hour": "warm",
  parents: "calm",
  attestation: "elegant",
};

/** Выбранный учителем стиль, иначе — по виду презентации, иначе — по предмету */
export function getTemplate(id: string | undefined, subject: Subject, deckType?: DeckType): SlideTemplate {
  const fallback = (deckType && byDeckType[deckType]) ?? bySubject[subject];
  return templates.find((t) => t.id === id) ?? templates.find((t) => t.id === fallback) ?? templates[0];
}
