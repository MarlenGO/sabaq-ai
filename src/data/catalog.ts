import {
  Atom,
  Award,
  BookA,
  BookOpenText,
  CircleCheck,
  ClipboardCheck,
  ClipboardList,
  Dna,
  Earth,
  Feather,
  FlaskConical,
  Grid3x3,
  HeartHandshake,
  Landmark,
  Languages,
  ListChecks,
  ListTodo,
  Megaphone,
  NotebookPen,
  Monitor,
  Presentation,
  School,
  Shapes,
  Sigma,
  Timer,
  Users,
  Zap,
} from "lucide-static";
import type { DeckType, Subject } from "@/types/topic-package";
import type { GameId } from "@/games/registry";
import { docKinds, type DocKind } from "@/types/documents";
import { deckTypeOrder } from "@/slides/structures";
import { games } from "@/games/registry";

// Каталог для главной и страницы предмета: как выглядит каждый предмет
// и что можно сделать (виды презентаций + игры). Названия — в словарях i18n.

/**
 * Плитка предмета: свой цвет и иконка. Из цвета страница сама делает
 * мягкий фон плитки и цвет иконки (color-mix), поэтому подходит и тёмной теме.
 */
export const subjectLook: Record<Subject, { icon: string; hue: string }> = {
  physics: { icon: Atom, hue: "#6a55c8" },
  math: { icon: Sigma, hue: "#3a6fc4" },
  informatics: { icon: Monitor, hue: "#2b8c8c" },
  chemistry: { icon: FlaskConical, hue: "#2a8fb8" },
  biology: { icon: Dna, hue: "#4a9a4f" },
  geography: { icon: Earth, hue: "#7f9a2e" },
  history: { icon: Landmark, hue: "#b5713a" },
  kazakh: { icon: BookOpenText, hue: "#c99418" },
  russian: { icon: BookA, hue: "#5f7598" },
  literature: { icon: Feather, hue: "#a5484a" },
  english: { icon: Languages, hue: "#c2456c" },
  other: { icon: Shapes, hue: "#6b7280" },
};

export const deckTypeIcon: Record<DeckType, string> = {
  lesson: Presentation,
  "open-lesson": Award,
  report: ClipboardList,
  talk: Megaphone,
  "class-hour": School,
  parents: Users,
  attestation: HeartHandshake,
};

export const gameIcon: Record<GameId, string> = {
  test: ListChecks,
  quiz: Timer,
  jeopardy: Grid3x3,
  "true-false": CircleCheck,
  race: Zap,
};

export const docIcon: Record<DocKind, string> = {
  kmzh: NotebookPen,
  test: ListTodo,
  bzhb: ClipboardCheck,
};

/** Что можно создать: документ, вид презентации или игра. Адрес — /subject/<предмет>/<id> */
export type CreateKind = { type: "doc"; id: DocKind } | { type: "deck"; id: DeckType } | { type: "game"; id: GameId };

/** Все id для адресов страниц создания (id видов, игр и документов не пересекаются) */
export const createKindIds: string[] = [...docKinds, ...deckTypeOrder, ...games.map((g) => g.id)];

export function kindOf(id: string): CreateKind | null {
  if ((docKinds as string[]).includes(id)) return { type: "doc", id: id as DocKind };
  if ((deckTypeOrder as string[]).includes(id)) return { type: "deck", id: id as DeckType };
  if (games.some((g) => g.id === id)) return { type: "game", id: id as GameId };
  return null;
}
