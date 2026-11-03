// Плитки ответов «Жарыса»: цвет и фигура, как в Kahoot. На проекторе и на телефоне
// они одинаковые, поэтому ученик находит свой ответ по цвету и фигуре, даже не читая.
export const raceTiles = [
  { shape: "▲", color: "bg-red" },
  { shape: "◆", color: "bg-accent" },
  { shape: "●", color: "bg-orange" },
  { shape: "■", color: "bg-green" },
] as const;

/** Как часто экраны «Жарыса» спрашивают сервер, что происходит */
export const RACE_POLL_MS = 1000;
