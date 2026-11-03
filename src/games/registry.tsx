import type { ReactNode } from "react";
import { BoltIcon, CheckIcon, GridIcon, ListCheckIcon, TimerIcon } from "@/components/ui/Icons";

// Шаблоны игр. Шаблон = способ показать данные пакета темы, а не новые данные.
// Тест и викторина берут одни и те же вопросы (quiz), поэтому правка вопроса
// видна в обеих играх. Новая игра — это новая запись здесь + её компонент
// + название и описание в словарях src/i18n (games).

export type GameId = "test" | "quiz" | "jeopardy" | "true-false" | "race";

export interface GameTemplate {
  id: GameId;
  icon: ReactNode;
  tint: string;
  /** Какую часть пакета темы использует игра */
  data: "quiz" | "trueFalse" | "jeopardy";
  /** Можно ли играть через QR, каждый со своего телефона (см. RoomHost) */
  qr: boolean;
  /** Только вместе через QR, без режима «на экране» (см. RaceHost) */
  live?: boolean;
}

export const games: GameTemplate[] = [
  {
    id: "test",
    icon: <ListCheckIcon />,
    tint: "bg-green",
    data: "quiz",
    qr: true,
  },
  {
    id: "quiz",
    icon: <TimerIcon />,
    tint: "bg-purple",
    data: "quiz",
    qr: true,
  },
  {
    id: "jeopardy",
    icon: <GridIcon />,
    tint: "bg-orange",
    data: "jeopardy",
    // Командная игра у доски: через телефоны в неё играть неудобно
    qr: false,
  },
  {
    id: "true-false",
    icon: <CheckIcon />,
    tint: "bg-teal",
    data: "trueFalse",
    qr: true,
  },
  {
    // Как Kahoot: вопрос на проекторе, все отвечают с телефонов одновременно.
    // Вопросы — те же, что у Теста и Викторины.
    id: "race",
    icon: <BoltIcon />,
    tint: "bg-red",
    data: "quiz",
    qr: true,
    live: true,
  },
];
