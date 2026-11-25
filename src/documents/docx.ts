import { withWidths, type Block, type Doc, type Para } from "./model";

// Настоящий Word-файл .docx без библиотек. .docx — это ZIP-архив с несколькими XML:
// текст и таблицы (word/document.xml), стили по умолчанию (word/styles.xml) и служебные файлы.
// Таблицы — с фиксированными ширинами колонок, строка заголовков повторяется на каждой
// странице, строки могут переноситься — поэтому в Word ничего не «съезжает» и легко правится.

const esc = (s: string) =>
  s
    // Символы, которые XML не допускает
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** Пункты → полупункты (так Word хранит размер шрифта) и twips (1/20 пункта) */
const half = (pt: number) => Math.round(pt * 2);
const twips = (pt: number) => Math.round(pt * 20);

function para(p: Para) {
  const props = [
    p.align && p.align !== "left" ? `<w:jc w:val="${p.align}"/>` : "",
    `<w:spacing w:after="${twips(p.after ?? 0)}" w:line="252" w:lineRule="auto"/>`,
    p.indent ? `<w:ind w:left="${twips(p.indent)}"/>` : "",
  ].join("");
  const runs = p.runs
    .map((r) => {
      const rPr = [r.bold ? "<w:b/>" : "", r.italic ? "<w:i/>" : "", p.size ? `<w:sz w:val="${half(p.size)}"/><w:szCs w:val="${half(p.size)}"/>` : ""].join("");
      return `<w:r>${rPr ? `<w:rPr>${rPr}</w:rPr>` : ""}<w:t xml:space="preserve">${esc(r.text)}</w:t></w:r>`;
    })
    .join("");
  return `<w:p><w:pPr>${props}</w:pPr>${runs}</w:p>`;
}

const border = (side: string) => `<w:${side} w:val="single" w:sz="4" w:space="0" w:color="000000"/>`;
const noBorder = (side: string) => `<w:${side} w:val="nil"/>`;

function block(b: Block): string {
  if (b.type === "p") return para(b);
  if (b.type === "pageBreak") return `<w:p><w:r><w:br w:type="page"/></w:r></w:p>`;
  const table = withWidths(b);
  const total = table.columns.reduce((a, c) => a + c, 0);
  const rows = table.rows
    .map((row) => {
      const trProps = [row.header ? "<w:tblHeader/>" : "", row.height ? `<w:trHeight w:val="${twips(row.height)}" w:hRule="exact"/>` : ""].join("");
      const trPr = trProps ? `<w:trPr>${trProps}</w:trPr>` : "";
      const cells = row.cells
        .map((c) => {
          const tcPr = [
            `<w:tcW w:w="${c.width}" w:type="dxa"/>`,
            c.span && c.span > 1 ? `<w:gridSpan w:val="${c.span}"/>` : "",
            c.vmerge === "restart" ? `<w:vMerge w:val="restart"/>` : c.vmerge === "continue" ? "<w:vMerge/>" : "",
            // Сетка кроссворда: у таблицы рамок нет, у клеток с буквами — свои, у пустых — никаких
            table.grid
              ? `<w:tcBorders>${["top", "left", "bottom", "right"].map(c.blank ? noBorder : border).join("")}</w:tcBorders>`
              : "",
            c.shade ? `<w:shd w:val="clear" w:color="auto" w:fill="F2F2F2"/>` : "",
          ].join("");
          // В каждой ячейке Word требует хотя бы один абзац
          const body = c.vmerge === "continue" || c.paras.length === 0 ? "<w:p/>" : c.paras.map(para).join("");
          return `<w:tc><w:tcPr>${tcPr}</w:tcPr>${body}</w:tc>`;
        })
        .join("");
      return `<w:tr>${trPr}${cells}</w:tr>`;
    })
    .join("");
  return [
    `<w:tbl><w:tblPr><w:tblW w:w="${total}" w:type="dxa"/><w:tblLayout w:type="fixed"/>`,
    `<w:tblBorders>${["top", "left", "bottom", "right", "insideH", "insideV"].map(table.grid ? noBorder : border).join("")}</w:tblBorders>`,
    table.grid
      ? `<w:tblCellMar><w:top w:w="0" w:type="dxa"/><w:left w:w="20" w:type="dxa"/><w:bottom w:w="0" w:type="dxa"/><w:right w:w="20" w:type="dxa"/></w:tblCellMar>`
      : `<w:tblCellMar><w:top w:w="28" w:type="dxa"/><w:left w:w="85" w:type="dxa"/><w:bottom w:w="28" w:type="dxa"/><w:right w:w="85" w:type="dxa"/></w:tblCellMar>`,
    `<w:tblLook w:val="04A0"/></w:tblPr>`,
    `<w:tblGrid>${table.columns.map((w) => `<w:gridCol w:w="${w}"/>`).join("")}</w:tblGrid>`,
    rows,
    `</w:tbl>`,
    // Пустой абзац после таблицы: две таблицы подряд Word склеил бы в одну
    `<w:p><w:pPr><w:spacing w:after="0"/></w:pPr></w:p>`,
  ].join("");
}

const NS = `xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"`;

function documentXml(doc: Doc) {
  // A4: 11906 × 16838 twips; поля 1 см (567), как в шаблоне ҚМЖ
  const size = doc.landscape ? `<w:pgSz w:w="16838" w:h="11906" w:orient="landscape"/>` : `<w:pgSz w:w="11906" w:h="16838"/>`;
  const margin = doc.landscape
    ? `<w:pgMar w:top="567" w:right="567" w:bottom="567" w:left="567" w:header="284" w:footer="284" w:gutter="0"/>`
    : `<w:pgMar w:top="851" w:right="851" w:bottom="851" w:left="1134" w:header="425" w:footer="425" w:gutter="0"/>`;
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document ${NS}><w:body>${doc.blocks.map(block).join("")}<w:sectPr>${size}${margin}</w:sectPr></w:body></w:document>`;
}

const STYLES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman" w:eastAsia="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/><w:lang w:val="kk-KZ" w:eastAsia="ru-RU"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="0" w:line="252" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style><w:style w:type="table" w:default="1" w:styleId="TableNormal"><w:name w:val="Normal Table"/><w:tblPr><w:tblInd w:w="0" w:type="dxa"/><w:tblCellMar><w:top w:w="0" w:type="dxa"/><w:left w:w="108" w:type="dxa"/><w:bottom w:w="0" w:type="dxa"/><w:right w:w="108" w:type="dxa"/></w:tblCellMar></w:tblPr></w:style></w:styles>`;

const CONTENT_TYPES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/></Types>`;

const ROOT_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/></Relationships>`;

const DOC_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`;

const core = (title: string) =>
  `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:title>${esc(title)}</dc:title><dc:creator>Sabaq AI</dc:creator></cp:coreProperties>`;

// ——— ZIP без сжатия (метод «stored»): Word такие архивы открывает без проблем ———

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(data: Uint8Array) {
  let c = 0xffffffff;
  for (const byte of data) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function zip(files: { name: string; text: string }[]): Uint8Array {
  const encoder = new TextEncoder();
  const chunks: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;
  for (const file of files) {
    const name = encoder.encode(file.name);
    const data = encoder.encode(file.text);
    const crc = crc32(data);
    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034b50, true);
    local.setUint16(4, 20, true); // версия
    local.setUint16(8, 0, true); // без сжатия
    local.setUint32(14, crc, true);
    local.setUint32(18, data.length, true);
    local.setUint32(22, data.length, true);
    local.setUint16(26, name.length, true);
    chunks.push(new Uint8Array(local.buffer), name, data);

    const entry = new DataView(new ArrayBuffer(46));
    entry.setUint32(0, 0x02014b50, true);
    entry.setUint16(4, 20, true);
    entry.setUint16(6, 20, true);
    entry.setUint32(16, crc, true);
    entry.setUint32(20, data.length, true);
    entry.setUint32(24, data.length, true);
    entry.setUint16(28, name.length, true);
    entry.setUint32(42, offset, true);
    central.push(new Uint8Array(entry.buffer), name);
    offset += 30 + name.length + data.length;
  }
  const centralSize = central.reduce((sum, c) => sum + c.length, 0);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true);
  end.setUint16(8, files.length, true);
  end.setUint16(10, files.length, true);
  end.setUint32(12, centralSize, true);
  end.setUint32(16, offset, true);
  const all = [...chunks, ...central, new Uint8Array(end.buffer)];
  const out = new Uint8Array(all.reduce((sum, c) => sum + c.length, 0));
  let at = 0;
  for (const c of all) {
    out.set(c, at);
    at += c.length;
  }
  return out;
}

/** Байты файла .docx */
export function toDocx(doc: Doc): Uint8Array {
  return zip([
    { name: "[Content_Types].xml", text: CONTENT_TYPES },
    { name: "_rels/.rels", text: ROOT_RELS },
    { name: "docProps/core.xml", text: core(doc.title) },
    { name: "word/document.xml", text: documentXml(doc) },
    { name: "word/styles.xml", text: STYLES },
    { name: "word/_rels/document.xml.rels", text: DOC_RELS },
  ]);
}

export const DOCX_TYPE = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
