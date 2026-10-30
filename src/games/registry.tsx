import type { ReactNode } from "react";
import { CheckIcon, GridIcon, ListCheckIcon, TimerIcon } from "@/components/ui/Icons";

// Шаблоны игр. Шаблон = способ показать данные пакета темы, а не новые данные.
// Тест и викторина берут одни и те же вопросы (quiz), поэтому правка вопроса
// видна в обеих играх. Новая игра — это новая запись здесь + её компонент.

export type GameId = "test" | "quiz" | "jeopardy" | "true-false";

export interface GameTemplate {
  id: GameId;
  title: string;
  description: string;
  icon: ReactNode;
  tint: string;
  /** Какую часть пакета темы использует игра */
  data: "quiz" | "trueFalse" | "jeopardy";
}

export const games: GameTemplate[] = [
  {
    id: "test",
    title: "Тест",
    description: "Сұрақтар бір-бірден, асықпай. Соңында баға шығады",
    icon: <ListCheckIcon />,
    tint: "bg-green",
    data: "quiz",
  },
  {
    id: "quiz",
    title: "Викторина",
    description: "Таймер мен ұпай. Проекторда бүкіл сыныппен ойнауға",
    icon: <TimerIcon />,
    tint: "bg-purple",
    data: "quiz",
  },
  {
    id: "jeopardy",
    title: "Өз ойын",
    description: "Тақырыптар мен 100–500 ұпайлық сұрақтар тақтасы, командалармен",
    icon: <GridIcon />,
    tint: "bg-orange",
    data: "jeopardy",
  },
  {
    id: "true-false",
    title: "Шын немесе жалған",
    description: "Тұжырымды оқып, шын ба, жалған ба — таңдау",
    icon: <CheckIcon />,
    tint: "bg-teal",
    data: "trueFalse",
  },
];
