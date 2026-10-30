import type { Subject } from "@/types/topic-package";

// Шаблон презентации = цвета + шрифты + украшение. Раскладка слайдов общая
// (src/slides/layout.ts), поэтому любая тема ложится в любой шаблон,
// а новый шаблон — это новый объект здесь, без нового кода.
//
// Цвета — hex без «#» (так их ждёт PowerPoint). Шрифты — только те, что
// есть на любом Windows и умеют казахские буквы: Arial, Calibri, Georgia.

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
    fonts: { heading: "Georgia", body: "Arial" },
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
    fonts: { heading: "Arial", body: "Arial" },
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
    fonts: { heading: "Calibri", body: "Calibri" },
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
    fonts: { heading: "Georgia", body: "Georgia" },
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
    fonts: { heading: "Arial", body: "Arial" },
    decor: { color: "FFB020", transparency: 90 },
  },
];

const bySubject: Partial<Record<Subject, string>> = {
  physics: "science",
  chemistry: "science",
  math: "science",
  biology: "nature",
  geography: "nature",
  history: "history",
};

export function getTemplate(id: string | undefined, subject: Subject): SlideTemplate {
  return (
    templates.find((t) => t.id === id) ?? templates.find((t) => t.id === bySubject[subject]) ?? templates[0]
  );
}
