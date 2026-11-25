import { boldCell, cell, type Cell, type Doc, type Para, type Run } from "@/documents/model";
import { kmzhStages, taskCountOf, taskMinutes, type KmzhDoc, type KmzhStage } from "./schema";

// Лист ҚМЖ на сайте (и печать / PDF) из того же JSON, что идёт в Word-шаблон.
// Подписи и ширины колонок — как в templates/kmzh.docx, поэтому лист и файл совпадают.

/** Строки основной таблицы: 8 этапов шаблона и, при 4 заданиях, 4-тапсырма после 3-й */
type Row = KmzhStage | "task4";

/** Первая колонка основной таблицы — как в шаблоне (первая строка жирная); минуты заданий — по их числу */
function stageLabels(id: Row, minutes: number[]): string[] {
  const labels: Record<Row, string[]> = {
    org: ["Ұйымдастыру кезеңі", "3 минут"],
    start: ["Сабақтың басы", "7 минут", "Функционалдық сауаттылық"],
    new: ["Сабақтың ортасы", "Жаңа білім", "7 минут"],
    task1: ["1-тапсырма", "ЖИ сауаттылығы", `${minutes[0]} минут`],
    task2: ["2-тапсырма", "Құндылыққа негізделген", `${minutes[1]} минут`],
    task3: ["3-тапсырма", "Жеке жұмыс", `${minutes[2]} минут`],
    task4: ["4-тапсырма", "Шығармашылық тапсырма", `${minutes[3]} минут`],
    sen: ["ЕБҚ оқушысына арналған"],
    end: ["Сабақтың соңы", "5 минут", "", "Бағалау."],
  };
  return labels[id];
}

const columns = ["Сабақ кезеңі (уақыты)", "Педагогтің іс-әрекеті", "Оқушының іс-әрекеті", "Бағалау", "Ресурстар"];

/** Текст с \n — абзацы (в Word это переносы строк внутри ячейки) */
const lines = (text: string, first: Run[] = []): Para[] =>
  text.split("\n").map((line, i) => ({ runs: i === 0 ? [...first, { text: line }] : [{ text: line }] }));

/**
 * checkMarks — список полей, которые предложил AI (бөлім, оқу мақсаты): на листе
 * к ним дописывается жёлтое «тексеріңіз». Для печати передаём пустой список.
 */
export function kmzhPreview(d: KmzhDoc, checkMarks: ("section" | "learning_objective")[] = []): Doc {
  const value = (text: string, field?: "section" | "learning_objective"): Cell => ({
    paras: lines(text).map((para, i, all) =>
      field && checkMarks.includes(field) && i === all.length - 1
        ? { runs: [...para.runs, { text: " " }, { text: "тексеріңіз", mark: true, italic: true }] }
        : para,
    ),
  });
  const header = (label: string, content: Cell) => ({ cells: [boldCell(label), content] });
  const spaces = " ".repeat(17);

  /** Ячейка «Оқушының іс-әрекеті»: текст + дескрипторы (как в шаблоне) */
  const student = (id: Row): Cell => {
    const paras = lines(d[`${id}_student`] ?? "");
    if (id === "task1") paras.push(...lines(d.task1_descriptors.join("; ") + ".", [{ text: "Дескрипторлар: ", bold: true }]));
    if (id === "task2" || id === "task3" || id === "task4" || id === "sen") {
      paras.push({ runs: [{ text: `${d[`${id}_points`]} балл:`, bold: true }] });
      for (const x of d[`${id}_descriptors`] ?? []) paras.push({ runs: [{ text: `• ${x.text} — ${x.points};` }] });
    }
    return { paras };
  };

  const count = taskCountOf(d);
  const minutes = taskMinutes(count);
  const rows: Row[] = count === 4 ? kmzhStages.flatMap((id): Row[] => (id === "task3" ? ["task3", "task4"] : [id])) : [...kmzhStages];

  return {
    title: `ҚМЖ — ${d.topic}`,
    landscape: true,
    blocks: [
      {
        type: "table",
        columns: [3402, 12302],
        rows: [
          header("Педагогтің аты-жөні:", value(d.teacher_name)),
          header("Күні:", value(d.date)),
          header("Сынып:", value(`${d.grade}${spaces}Қатысқандар саны:${spaces}Қатыспағандар саны:`)),
          header("Бөлім:", value(d.section, "section")),
          header("Сабақтың тақырыбы:", value(d.topic)),
          header("Оқу бағдарламасына сәйкес оқу мақсаты:", value(d.learning_objective, "learning_objective")),
          header("Сабақтың мақсаты:", value(d.lesson_goal)),
        ],
      },
      {
        type: "table",
        columns: [1980, 7431, 2438, 2494, 1361],
        rows: [
          { header: true, cells: columns.map((name) => boldCell(name, { shade: true })) },
          ...rows.map((id) => {
            const [first, ...rest] = stageLabels(id, minutes);
            return {
              cells: [
                cell([{ runs: [{ text: first, bold: true }] }, ...rest.map((text) => ({ runs: [{ text }] }))]),
                {
                  paras: (d[`${id}_teacher`] ?? []).flatMap((b) =>
                    lines(b.text, b.title ? [{ text: b.title, bold: true }, { text: " " }] : []),
                  ),
                },
                student(id),
                { paras: lines(d[`${id}_assessment`] ?? "") },
                { paras: lines(d[`${id}_resources`] ?? "") },
              ],
            };
          }),
        ],
      },
    ],
  };
}
