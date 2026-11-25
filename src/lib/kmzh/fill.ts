import fs from "node:fs";
import path from "node:path";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { kmzhStages, taskCountOf, taskMinutes, type KmzhDoc } from "./schema";

// Word из шаблона templates/kmzh.docx: оформление (таблицы, шрифт, ширины колонок)
// берётся из шаблона, мы только подставляем текст. Шаблон руками в Word не правим —
// теги развалятся; новый шаблон размечает .claude/skills/kmzh-docx-generator/scripts/build_template.py.

export function fillKmzh(doc: KmzhDoc): Buffer {
  const data: Record<string, unknown> = { ...doc };
  // Как в scripts/test-fill.mjs: пробел после жирного заголовка, дескрипторы ЖИ одной строкой
  for (const id of kmzhStages) {
    data[`${id}_teacher`] = doc[`${id}_teacher`].map((b) => ({ title: b.title, sp: b.title ? " " : "", text: b.text }));
  }
  data.task1_descriptors = doc.task1_descriptors.join("; ") + ".";
  // 4-тапсырма: строка шаблона с условием {#has_task4}; минуты заданий меняются
  const count = taskCountOf(doc);
  data.has_task4 = count === 4;
  if (doc.task4_teacher) {
    data.task4_teacher = doc.task4_teacher.map((b) => ({ title: b.title, sp: b.title ? " " : "", text: b.text }));
  }
  taskMinutes(count).forEach((minutes, i) => (data[`task${i + 1}_min`] = minutes));

  const template = fs.readFileSync(path.join(process.cwd(), "templates", "kmzh.docx"));
  const word = new Docxtemplater(new PizZip(template), { paragraphLoop: true, linebreaks: true });
  word.render(data);
  return word.getZip().generate({ type: "nodebuffer", compression: "DEFLATE" });
}
