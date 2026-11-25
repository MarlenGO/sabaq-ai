// Кроссворд из слов и подсказок — без AI, простым перебором: слова ставим по одному
// (от длинного к короткому) туда, где они пересекаются с уже стоящими по общей букве.
// Слово, которое никуда не встаёт, пропускаем. Результат одинаковый при каждой сборке,
// поэтому лист на сайте и файл Word совпадают.

export interface CrosswordWord {
  /** Слово заглавными буквами, без пробелов */
  word: string;
  clue: string;
  row: number;
  col: number;
  across: boolean;
  /** Номер клетки, с которой начинается слово */
  number: number;
}

export interface Crossword {
  rows: number;
  cols: number;
  /** Буква клетки или null — пустая клетка */
  grid: (string | null)[][];
  words: CrosswordWord[];
}

/** Слово для кроссворда: одно слово из букв, 3–14 знаков. Иначе — null */
export function crosswordWord(raw: string): string | null {
  const word = raw.trim().toLocaleUpperCase("kk-KZ").replace(/Ё/g, "Е");
  return /^\p{L}{3,14}$/u.test(word) ? word : null;
}

interface Cell {
  letter: string;
  across: boolean;
  down: boolean;
}

export function buildCrossword(entries: { word: string; clue: string }[], maxSize = 17): Crossword | null {
  const list = entries
    .map((entry) => ({ word: crosswordWord(entry.word), clue: entry.clue.trim() }))
    .filter((entry): entry is { word: string; clue: string } => entry.word !== null)
    // Одинаковые слова в кроссворде не нужны
    .filter((entry, i, all) => all.findIndex((other) => other.word === entry.word) === i)
    .sort((a, b) => b.word.length - a.word.length);
  if (list.length < 4) return null;

  const cells = new Map<string, Cell>();
  const key = (r: number, c: number) => `${r},${c}`;
  const placed: Omit<CrosswordWord, "number">[] = [];
  let box = { top: 0, left: 0, bottom: -1, right: -1 };

  const put = (word: string, clue: string, row: number, col: number, across: boolean) => {
    for (let i = 0; i < word.length; i++) {
      const r = across ? row : row + i;
      const c = across ? col + i : col;
      const cell = cells.get(key(r, c)) ?? { letter: word[i], across: false, down: false };
      cell[across ? "across" : "down"] = true;
      cells.set(key(r, c), cell);
    }
    placed.push({ word, clue, row, col, across });
    box = {
      top: Math.min(box.top, row),
      left: Math.min(box.left, col),
      bottom: Math.max(box.bottom, across ? row : row + word.length - 1),
      right: Math.max(box.right, across ? col + word.length - 1 : col),
    };
  };

  /** Сколько пересечений даст слово на этом месте; -1 — встать нельзя */
  const check = (word: string, row: number, col: number, across: boolean) => {
    const dr = across ? 0 : 1;
    const dc = across ? 1 : 0;
    // До начала и после конца слова — пусто, иначе слова слипнутся
    if (cells.has(key(row - dr, col - dc)) || cells.has(key(row + dr * word.length, col + dc * word.length))) return -1;
    let crossings = 0;
    for (let i = 0; i < word.length; i++) {
      const r = row + dr * i;
      const c = col + dc * i;
      const cell = cells.get(key(r, c));
      if (cell) {
        // Пересекать можно только слово другого направления и только по той же букве
        if (cell.letter !== word[i] || cell[across ? "across" : "down"]) return -1;
        crossings++;
      } else if (cells.has(key(r + dc, c + dr)) || cells.has(key(r - dc, c - dr))) {
        // Новая буква не должна касаться соседних слов сбоку
        return -1;
      }
    }
    const top = Math.min(box.top, row);
    const left = Math.min(box.left, col);
    const bottom = Math.max(box.bottom, row + dr * (word.length - 1));
    const right = Math.max(box.right, col + dc * (word.length - 1));
    if (bottom - top + 1 > maxSize || right - left + 1 > maxSize) return -1;
    return crossings;
  };

  const tryPlace = (word: string, clue: string) => {
    let best: { row: number; col: number; across: boolean; score: number } | null = null;
    for (const [at, cell] of cells) {
      const [r, c] = at.split(",").map(Number);
      for (let i = 0; i < word.length; i++) {
        if (word[i] !== cell.letter) continue;
        for (const across of [true, false]) {
          if (cell[across ? "across" : "down"]) continue;
          const row = across ? r : r - i;
          const col = across ? c - i : c;
          const crossings = check(word, row, col, across);
          if (crossings < 1) continue;
          // Больше пересечений и компактнее — лучше; при равенстве чередуем направления
          const height = Math.max(box.bottom, across ? row : row + word.length - 1) - Math.min(box.top, row) + 1;
          const width = Math.max(box.right, across ? col + word.length - 1 : col) - Math.min(box.left, col) + 1;
          const score = crossings * 100 - (height + width) * 2 - Math.abs(height - width);
          if (!best || score > best.score) best = { row, col, across, score };
        }
      }
    }
    if (best) put(word, clue, best.row, best.col, best.across);
    return Boolean(best);
  };

  put(list[0].word, list[0].clue, 0, 0, true);
  let rest = list.slice(1);
  // Второй проход: слово, которому сначала не нашлось места, может встать после других
  for (let pass = 0; pass < 2 && rest.length > 0; pass++) {
    rest = rest.filter((entry) => !tryPlace(entry.word, entry.clue));
  }
  if (placed.length < 4) return null;

  const rows = box.bottom - box.top + 1;
  const cols = box.right - box.left + 1;
  const grid: (string | null)[][] = Array.from({ length: rows }, () => Array<string | null>(cols).fill(null));
  for (const [at, cell] of cells) {
    const [r, c] = at.split(",").map(Number);
    grid[r - box.top][c - box.left] = cell.letter;
  }

  // Номера — по клеткам начала слов, слева направо и сверху вниз (как в газетах)
  const shifted = placed.map((w) => ({ ...w, row: w.row - box.top, col: w.col - box.left }));
  const starts = [...new Set(shifted.map((w) => w.row * cols + w.col))].sort((a, b) => a - b);
  const words = shifted
    .map((w) => ({ ...w, number: starts.indexOf(w.row * cols + w.col) + 1 }))
    .sort((a, b) => a.number - b.number || Number(b.across) - Number(a.across));
  return { rows, cols, grid, words };
}
