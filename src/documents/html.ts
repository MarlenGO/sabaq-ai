import { withWidths, type Block, type Doc, type Para } from "./model";

// HTML из модели документа — для предпросмотра на сайте и для печати / PDF.
// Цвета «бумажные» (чёрный на белом) и не зависят от темы сайта: это лист A4.

const esc = (value: string) =>
  value.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] as string);

const TD = "border:1px solid #000;padding:2pt 4pt;vertical-align:top";

function para(p: Para, tag = "p") {
  const style = [
    "margin:0",
    p.after ? `margin-bottom:${p.after}pt` : "",
    p.align && p.align !== "left" ? `text-align:${p.align}` : "",
    p.size ? `font-size:${p.size}pt` : "",
    p.indent ? `margin-left:${p.indent}pt` : "",
  ]
    .filter(Boolean)
    .join(";");
  const runs = p.runs
    .map((r) => {
      let html = esc(r.text);
      if (r.bold) html = `<b>${html}</b>`;
      if (r.italic) html = `<i>${html}</i>`;
      return html;
    })
    .join("");
  return `<${tag} style="${style}">${runs || "&nbsp;"}</${tag}>`;
}

function block(b: Block) {
  if (b.type === "p") return para(b);
  if (b.type === "pageBreak") return `<div style="break-after:page;height:12pt"></div>`;
  const table = withWidths(b);
  const total = table.columns.reduce((a, c) => a + c, 0);
  const cols = table.columns.map((w) => `<col style="width:${((w / total) * 100).toFixed(2)}%">`).join("");
  const rows = table.rows
    .map((row) => {
      const cells = row.cells
        .filter((c) => c.vmerge !== "continue")
        .map((c, i, list) => {
          // Высота объединённой ячейки: сколько строк ниже продолжают её
          const rowspan = c.vmerge === "restart" ? countMerged(table.rows, table.rows.indexOf(row), cellColumn(list, i, row)) : 1;
          const attrs = [c.span && c.span > 1 ? `colspan="${c.span}"` : "", rowspan > 1 ? `rowspan="${rowspan}"` : ""].join(" ");
          const style = `${TD}${c.shade ? ";background:#f2f2f2" : ""}`;
          return `<td ${attrs} style="${style}">${c.paras.map((p) => para(p)).join("")}</td>`;
        })
        .join("");
      return `<tr>${cells}</tr>`;
    })
    .join("");
  return `<table style="width:100%;border-collapse:collapse;table-layout:fixed;margin:0 0 10pt">${cols}${rows}</table>`;
}

/** Номер колонки ячейки в строке (с учётом span и пропущенных continue) */
function cellColumn(visible: { span?: number }[], index: number, row: { cells: { span?: number; vmerge?: string }[] }) {
  const target = visible[index];
  let col = 0;
  for (const c of row.cells) {
    if (c === target) return col;
    col += c.span ?? 1;
  }
  return col;
}

function countMerged(rows: { cells: { span?: number; vmerge?: string }[] }[], from: number, column: number) {
  let n = 1;
  for (let r = from + 1; r < rows.length; r++) {
    let col = 0;
    const at = rows[r].cells.find((c) => {
      const hit = col === column;
      col += c.span ?? 1;
      return hit;
    });
    if (at?.vmerge === "continue") n++;
    else break;
  }
  return n;
}

const FONT = "font-family:'Times New Roman',Times,serif;font-size:12pt;line-height:1.25;color:#000";

/** Тело документа для предпросмотра */
export const toHtmlBody = (doc: Doc) => `<div style="${FONT}">${doc.blocks.map(block).join("")}</div>`;

/** Отдельная страница для печати и «Сохранить как PDF» */
export function toPrintPage(doc: Doc) {
  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(doc.title)}</title>
<style>@page { size: A4 ${doc.landscape ? "landscape" : "portrait"}; margin: 10mm; } body { margin: 0; } tr { break-inside: avoid; }</style>
</head><body>${toHtmlBody(doc)}</body></html>`;
}
