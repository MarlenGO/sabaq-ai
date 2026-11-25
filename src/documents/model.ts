// Простая модель документа: абзацы и таблицы. Из неё собираются два результата —
// HTML для предпросмотра и печати (html.ts) и настоящий Word .docx (docx.ts).
// Так лист на сайте и файл в Word устроены одинаково: те же таблицы, ширины колонок,
// объединённые ячейки и жирные подписи.

export interface Run {
  text: string;
  bold?: boolean;
  italic?: boolean;
  /** Жёлтая пометка — только на листе сайта (например, «тексеріңіз»), в файл не идёт */
  mark?: boolean;
}

export interface Para {
  runs: Run[];
  align?: "left" | "center" | "right";
  /** Размер шрифта в пунктах (по умолчанию 12) */
  size?: number;
  /** Отступ после абзаца в пунктах */
  after?: number;
  /** Отступ слева в пунктах (варианты ответов теста) */
  indent?: number;
}

export interface Cell {
  paras: Para[];
  /** Сколько колонок занимает */
  span?: number;
  /** Объединение по вертикали: первая ячейка — restart, следующие под ней — continue */
  vmerge?: "restart" | "continue";
  /** Серый фон — строка заголовков */
  shade?: boolean;
  /** Ширина в twips (1/20 пункта) — считается сама по колонкам */
  width?: number;
  /** Пустая клетка без рамки — фон кроссворда */
  blank?: boolean;
}

export interface Row {
  cells: Cell[];
  /** Строка заголовков: в Word повторяется на каждой странице */
  header?: boolean;
  /** Точная высота строки в пунктах — квадратные клетки кроссворда */
  height?: number;
}

export interface Table {
  type: "table";
  /** Ширины колонок в twips, как в шаблоне Word */
  columns: number[];
  rows: Row[];
  /** Сетка кроссворда: рамки только у клеток с буквами, без полей внутри клеток */
  grid?: boolean;
}

export type Block = ({ type: "p" } & Para) | Table | { type: "pageBreak" };

export interface Doc {
  title: string;
  landscape: boolean;
  blocks: Block[];
}

// ——— Помощники ———

export const p = (text: string, extra: Omit<Para, "runs"> & { bold?: boolean; italic?: boolean } = {}): { type: "p" } & Para => {
  const { bold, italic, ...rest } = extra;
  return { type: "p", runs: [{ text, bold, italic }], ...rest };
};

/**
 * Текст из AI — в абзацы: каждая строка отдельно. Подпись в начале строки до двоеточия
 * («Күтілетін жауап:», «Дескрипторлар:», «4 балл:») становится жирной — как в шаблоне.
 */
export function textParas(text: string, extra: Omit<Para, "runs"> = {}): Para[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const m = line.match(/^([^:]{2,45}):(\s|$)(.*)$/);
      if (m && m[1].split(/\s+/).length <= 5 && !/[=<>]/.test(m[1])) {
        const rest = m[3] ? [{ text: ` ${m[3]}` }] : [];
        return { runs: [{ text: `${m[1]}:`, bold: true }, ...rest], ...extra };
      }
      return { runs: [{ text: line }], ...extra };
    });
}

export const cell = (content: string | Para[], extra: Omit<Cell, "paras"> = {}): Cell => ({
  paras: typeof content === "string" ? textParas(content) : content,
  ...extra,
});

/** Ячейка с жирным текстом (подписи слева, заголовки колонок) */
export const boldCell = (text: string, extra: Omit<Cell, "paras"> = {}): Cell => ({
  paras: text.split("\n").map((line) => ({ runs: [{ text: line, bold: true }] })),
  ...extra,
});

/** Ширина каждой ячейки по колонкам таблицы (с учётом span) */
export function withWidths(table: Table): Table {
  return {
    ...table,
    rows: table.rows.map((row) => {
      let col = 0;
      return {
        ...row,
        cells: row.cells.map((c) => {
          const span = c.span ?? 1;
          const width = table.columns.slice(col, col + span).reduce((a, b) => a + b, 0);
          col += span;
          return { ...c, width };
        }),
      };
    }),
  };
}
