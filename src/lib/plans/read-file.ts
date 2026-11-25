import PizZip from "pizzip";

// Достаём текст КТП из Word (.docx) или Excel (.xlsx) — без AI и без новых библиотек.
// Оба формата — ZIP-архив с XML внутри (как и шаблон ҚМЖ). Таблицы превращаем
// в строки «| ячейка | ячейка |», текст вне таблиц — в обычные строки.
// Дальше этот текст читает Gemini (parse.ts), а мы проверяем им же, что темы не выдуманы.
// Старые .doc и PDF не принимаем: их так просто не прочитать.

export type PlanFileType = "docx" | "xlsx";

export function fileTypeOf(name: string): PlanFileType | null {
  const lower = name.toLowerCase();
  if (lower.endsWith(".docx")) return "docx";
  if (lower.endsWith(".xlsx")) return "xlsx";
  return null;
}

/** Текст файла; пустая строка — внутри не нашлось текста */
export function readPlanFile(type: PlanFileType, bytes: ArrayBuffer): string {
  const zip = new PizZip(bytes);
  return (type === "docx" ? readDocx(zip) : readXlsx(zip)).replace(/\n{3,}/g, "\n\n").trim();
}

const decode = (text: string) =>
  text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&amp;/g, "&");

/** Склеить ячейку в одну строку: внутри таблицы перенос строки — « / » */
const cell = (text: string) => text.replace(/\s*\n\s*/g, " / ").replace(/\|/g, "/").trim();

// ——— Word ———

/** Текст абзацев Word: <w:t> внутри <w:p>, табуляция и перенос строки — пробел */
function paragraphs(xml: string): string[] {
  return [...xml.matchAll(/<w:p[ >][\s\S]*?<\/w:p>/g)].map(([p]) =>
    decode(
      [...p.matchAll(/<w:t(?: [^>]*)?>([^<]*)<\/w:t>|<w:(?:tab|br)\/>/g)].map((m) => m[1] ?? " ").join(""),
    ).trim(),
  );
}

function readDocx(zip: PizZip): string {
  const xml = zip.file("word/document.xml")?.asText();
  if (!xml) return "";
  const body = xml.slice(xml.indexOf("<w:body"));
  const lines: string[] = [];
  // Таблицы и абзацы между ними — по порядку
  let at = 0;
  for (const table of body.matchAll(/<w:tbl>[\s\S]*?<\/w:tbl>/g)) {
    lines.push(...paragraphs(body.slice(at, table.index)).filter(Boolean));
    for (const [row] of table[0].matchAll(/<w:tr[ >][\s\S]*?<\/w:tr>/g)) {
      const cells = [...row.matchAll(/<w:tc>[\s\S]*?<\/w:tc>/g)].map(([c]) => cell(paragraphs(c).filter(Boolean).join("\n")));
      if (cells.some(Boolean)) lines.push(`| ${cells.join(" | ")} |`);
    }
    lines.push("");
    at = table.index + table[0].length;
  }
  lines.push(...paragraphs(body.slice(at)).filter(Boolean));
  return lines.join("\n");
}

// ——— Excel ———

/** Excel хранит даты числом дней с 30.12.1899 — переводим в «дд.мм.гггг» */
function excelDate(serial: number) {
  const date = new Date(Date.UTC(1899, 11, 30) + Math.round(serial) * 86_400_000);
  const two = (n: number) => String(n).padStart(2, "0");
  return `${two(date.getUTCDate())}.${two(date.getUTCMonth() + 1)}.${date.getUTCFullYear()}`;
}

/** Номера стилей ячеек, у которых формат — дата (иначе дата видна как 46280) */
function dateStyles(zip: PizZip): Set<number> {
  const xml = zip.file("xl/styles.xml")?.asText() ?? "";
  const custom = new Map<number, string>();
  for (const m of xml.matchAll(/<numFmt [^>]*numFmtId="(\d+)"[^>]*formatCode="([^"]*)"/g)) custom.set(Number(m[1]), m[2]);
  const isDate = (id: number) =>
    (id >= 14 && id <= 22) || (id >= 45 && id <= 47) || /[dy]|m{3,}|d\W*m/i.test((custom.get(id) ?? "").replace(/\[[^\]]*\]|"[^"]*"/g, ""));
  const cellXfs = xml.match(/<cellXfs[\s\S]*?<\/cellXfs>/)?.[0] ?? "";
  const result = new Set<number>();
  [...cellXfs.matchAll(/<xf [^>]*?numFmtId="(\d+)"/g)].forEach((m, index) => {
    if (isDate(Number(m[1]))) result.add(index);
  });
  return result;
}

function readXlsx(zip: PizZip): string {
  const shared = [...(zip.file("xl/sharedStrings.xml")?.asText() ?? "").matchAll(/<si>([\s\S]*?)<\/si>/g)].map(([, si]) =>
    decode([...si.matchAll(/<t(?: [^>]*)?>([^<]*)<\/t>/g)].map((m) => m[1]).join("")),
  );
  const dates = dateStyles(zip);
  const sheets = zip
    .file(/^xl\/worksheets\/sheet\d+\.xml$/)
    .sort((a, b) => Number(a.name.match(/\d+/)![0]) - Number(b.name.match(/\d+/)![0]));

  const lines: string[] = [];
  for (const sheet of sheets) {
    for (const [, row] of sheet.asText().matchAll(/<row[ >]([\s\S]*?)<\/row>/g)) {
      const cells: string[] = [];
      for (const [, attrs, inner] of row.matchAll(/<c ([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
        // Колонка из адреса ячейки (B7 → 1): пустые ячейки в XML пропущены, а места нужны
        const letters = attrs.match(/r="([A-Z]+)\d+"/)?.[1] ?? "";
        const column = [...letters].reduce((n, ch) => n * 26 + ch.charCodeAt(0) - 64, 0) - 1;
        const type = attrs.match(/t="(\w+)"/)?.[1];
        const style = Number(attrs.match(/s="(\d+)"/)?.[1] ?? -1);
        const raw = inner?.match(/<v>([^<]*)<\/v>/)?.[1];
        let text = "";
        if (type === "s" && raw !== undefined) text = shared[Number(raw)] ?? "";
        else if (type === "inlineStr") text = decode([...(inner ?? "").matchAll(/<t(?: [^>]*)?>([^<]*)<\/t>/g)].map((m) => m[1]).join(""));
        else if (raw !== undefined) text = !type && dates.has(style) ? excelDate(Number(raw)) : decode(raw);
        if (column >= 0) cells[column] = cell(text);
      }
      const filled = Array.from(cells, (c) => c ?? "");
      if (filled.some(Boolean)) lines.push(`| ${filled.join(" | ")} |`);
    }
    lines.push("");
  }
  return lines.join("\n");
}
