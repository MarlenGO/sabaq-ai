// Fills templates/kmzh.docx with examples/sample.json and writes tmp/kmzh-test.docx.
// Run from the project root: node scripts/test-fill.mjs [template] [data.json] [out.docx]
import fs from 'fs';
import path from 'path';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';

const templatePath = process.argv[2] || 'templates/kmzh.docx';
const dataPath = process.argv[3] || 'examples/sample.json';
const outPath = process.argv[4] || 'tmp/kmzh-test.docx';

const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

// Same preparation as in the API route: a space after a bold title, descriptors as one line
const blockKeys = ['org', 'start', 'new', 'task1', 'task2', 'task3', 'sen', 'end'];
for (const key of blockKeys) {
  data[key + '_teacher'] = (data[key + '_teacher'] || []).map((b) => ({
    title: b.title || '',
    sp: b.title ? ' ' : '',
    text: b.text || '',
  }));
}
if (Array.isArray(data.task1_descriptors)) data.task1_descriptors = data.task1_descriptors.join('; ') + '.';
// Минуты заданий и строка 4-тапсырма (как в src/lib/kmzh/fill.ts): 3 задания — 8/7/8, 4 — 6/6/6/5
data.has_task4 = Boolean(data.task4_teacher);
(data.has_task4 ? [6, 6, 6, 5] : [8, 7, 8]).forEach((m, i) => (data[`task${i + 1}_min`] = m));
if (data.task4_teacher) data.task4_teacher = data.task4_teacher.map((b) => ({ title: b.title || '', sp: b.title ? ' ' : '', text: b.text || '' }));

const zip = new PizZip(fs.readFileSync(templatePath));
const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });
doc.render(data);

const buffer = doc.getZip().generate({ type: 'nodebuffer', compression: 'DEFLATE' });
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, buffer);

const xml = doc.getZip().file('word/document.xml').asText();
const leftover = xml.match(/\{[#/]?[a-z0-9_]+\}/g);
console.log(leftover ? 'LEFTOVER TAGS: ' + leftover.join(', ') : 'OK, no leftover tags');
console.log('Saved', outPath);
