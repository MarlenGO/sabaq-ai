// Дописывает в размеченный шаблон ҚМЖ строку «4-тапсырма» и минуты-теги.
// Запуск: node .claude/skills/kmzh-docx-generator/scripts/add_task4.mjs templates/kmzh.docx templates/kmzh.docx
//
// Что делает (один раз, повторный запуск ничего не меняет):
// 1) в первой колонке строк 1–3-тапсырма минуты «8 / 7 / 8» заменяет тегами
//    {task1_min} {task2_min} {task3_min} — при 4 заданиях они другие (6 / 6 / 6);
// 2) после строки «3-тапсырма» вставляет её копию «4-тапсырма / Шығармашылық тапсырма»
//    с тегами task4_… и минутами {task4_min};
// 3) обрамляет новую строку условием {#has_task4}…{/has_task4}: docxtemplater
//    повторяет всю строку таблицы, если начало и конец условия в разных ячейках одной строки,
//    поэтому при 3 заданиях строки в файле просто нет.
// Работает со строкой XML без lxml: шаблон уже размечен build_template.py.
import fs from "node:fs";
import PizZip from "pizzip";

const [src, out] = process.argv.slice(2);
const zip = new PizZip(fs.readFileSync(src));
let xml = zip.file("word/document.xml").asText();

if (xml.includes("{#has_task4}")) {
  console.log("already has task4, nothing to do");
  process.exit(0);
}

// Основная таблица — вторая в документе; строки 4, 5, 6 — 1-, 2-, 3-тапсырма
const mainStart = xml.indexOf("<w:tbl>", xml.indexOf("<w:tbl>") + 1);
const rowRe = /<w:tr[ >][\s\S]*?<\/w:tr>/g;
rowRe.lastIndex = mainStart;
const rows = [];
for (let m; (m = rowRe.exec(xml)) && rows.length < 9; ) rows.push({ start: m.index, text: m[0] });
const [r1, r2, r3] = [rows[4], rows[5], rows[6]];
if (!r3.text.includes("3-тапсырма") || !r3.text.includes("task3_")) throw new Error("строка 3-тапсырма не найдена");

/** Минуты в первой ячейке: текст «8 » перед «минут» → «{taskN_min} » */
const withMinutes = (row, id, minutes) => {
  const cellEnd = row.indexOf("</w:tc>") + "</w:tc>".length;
  const first = row.slice(0, cellEnd);
  const fixed = first.replace(new RegExp(`>${minutes} </w:t>`), `>{${id}_min} </w:t>`);
  if (fixed === first) throw new Error(`минуты ${minutes} в строке ${id} не найдены`);
  return fixed + row.slice(cellEnd);
};
const row1 = withMinutes(r1.text, "task1", 8);
const row2 = withMinutes(r2.text, "task2", 7);
const row3 = withMinutes(r3.text, "task3", 8);

// Копия 3-тапсырма → 4-тапсырма
let row4 = row3
  .replaceAll("task3_", "task4_")
  .replace(">3-тапсырма<", ">4-тапсырма<")
  .replace(">Жеке </w:t>", ">Шығармашылық </w:t>")
  .replace(">Жеке<", ">Шығармашылық<")
  .replace(">жұмыс<", ">тапсырма<");
if (!row4.includes("4-тапсырма") || !row4.includes("Шығармашылық")) throw new Error("подпись 4-тапсырма не встала");

// Условие: в начало первого текста строки и в конец последнего
row4 = row4.replace(/(<w:t(?: [^>]*)?>)/, "$1{#has_task4}");
const lastT = row4.lastIndexOf("</w:t>");
row4 = row4.slice(0, lastT) + "{/has_task4}" + row4.slice(lastT);

xml =
  xml.slice(0, r1.start) +
  row1 +
  xml.slice(r1.start + r1.text.length, r2.start) +
  row2 +
  xml.slice(r2.start + r2.text.length, r3.start) +
  row3 +
  row4 +
  xml.slice(r3.start + r3.text.length);

zip.file("word/document.xml", xml);
fs.writeFileSync(out, zip.generate({ type: "nodebuffer", compression: "DEFLATE" }));
console.log("ok", out);
