import type { DeckType, LookId, Subject, TopicPackage } from "@/types/topic-package";

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
  // Цвета оформлений (looks.ts): при выборе оформления берутся эти
  {
    id: "beles",
    name: "Көк пен сары",
    description: "Қою көк пен сары",
    colors: { background: "FFFFFF", surface: "EEF2F7", text: "1B2A44", muted: "5B6678", accent: "1B2A44", onAccent: "FFFFFF" },
    fonts: { heading: "Times New Roman", body: "Times New Roman" },
    decor: null,
    detail: "F2A33A",
  },
  {
    id: "syzba",
    name: "Көгілдір мен маржан",
    description: "Көгілдір мен маржан",
    colors: { background: "FFFFFF", surface: "E3F3F3", text: "1F2933", muted: "5F6B76", accent: "0E7C86", onAccent: "FFFFFF" },
    fonts: { heading: "Times New Roman", body: "Times New Roman" },
    decor: null,
    detail: "EF6F5E",
  },
  {
    id: "journal",
    name: "Жасыл мен қыша",
    description: "Қою жасыл мен қыша сары",
    colors: { background: "FFFFFF", surface: "E7EFE9", text: "1D1D1B", muted: "5E625C", accent: "14473A", onAccent: "FFFFFF" },
    fonts: { heading: "Times New Roman", body: "Times New Roman" },
    decor: null,
    detail: "D39B1C",
  },
  {
    id: "mosaic",
    name: "Күлгін мозаика",
    description: "Ақшыл күлгін, түрлі түсті плиткалар",
    colors: { background: "F1F0FA", surface: "FFFFFF", text: "1E1B3A", muted: "5D5A78", accent: "3D3AA8", onAccent: "FFFFFF" },
    fonts: { heading: "Times New Roman", body: "Times New Roman" },
    decor: null,
    detail: "FFA585",
  },
  {
    id: "official",
    name: "Ресми көк",
    description: "Қою көк пен алтын — ресми",
    colors: { background: "FFFFFF", surface: "F2F4F8", text: "1F2633", muted: "5E6675", accent: "1D2F5E", onAccent: "FFFFFF" },
    fonts: { heading: "Times New Roman", body: "Times New Roman" },
    decor: null,
    detail: "B8913A",
  },
  {
    id: "attest",
    name: "Шие мен графит",
    description: "Шие түс пен графит",
    colors: { background: "FFFFFF", surface: "F3F4F6", text: "2B2F36", muted: "626872", accent: "7A1F2B", onAccent: "FFFFFF" },
    fonts: { heading: "Times New Roman", body: "Times New Roman" },
    decor: null,
    detail: "B8913A",
  },
  {
    id: "method",
    name: "Сұр мен болат көк",
    description: "Сұр-қара мен болат көк",
    colors: { background: "FFFFFF", surface: "EEF3F5", text: "263238", muted: "5D6B72", accent: "263238", onAccent: "FFFFFF" },
    fonts: { heading: "Times New Roman", body: "Times New Roman" },
    decor: null,
    detail: "1F6F8B",
  },
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

/** Порядок дизайнов в выборе: сначала для уроков, потом официальные */
export const lookOrder: Exclude<LookId, "classic">[] = ["beles", "syzba", "journal", "mosaic", "official", "attest", "method"];

/** Оформление слайдов по умолчанию для вида презентации */
const lookByDeckType: Record<DeckType, LookId> = {
  lesson: "beles",
  "open-lesson": "journal",
  report: "official",
  talk: "method",
  "class-hour": "mosaic",
  parents: "syzba",
  attestation: "attest",
};

export const lookOf = (pkg: Pick<TopicPackage, "look" | "deckType">): LookId => pkg.look ?? lookByDeckType[pkg.deckType ?? "lesson"];

/**
 * Цвета презентации: выбранные учителем, иначе цвета оформления.
 * У прежнего оформления (classic) — как раньше: по виду и предмету.
 */
export function templateOf(pkg: Pick<TopicPackage, "templateId" | "subject" | "deckType" | "look" | "font">): SlideTemplate {
  const look = lookOf(pkg);
  const base =
    look === "classic"
      ? getTemplate(pkg.templateId, pkg.subject, pkg.deckType)
      : (templates.find((t) => t.id === pkg.templateId) ?? templates.find((t) => t.id === look) ?? templates[0]);
  // Свой шрифт учителя — во всех текстах слайдов (дизайн иначе задаёт свои)
  return pkg.font ? { ...base, fonts: { heading: pkg.font, body: pkg.font } } : base;
}
