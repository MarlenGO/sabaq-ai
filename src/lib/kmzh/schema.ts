import { z } from "zod";

// ҚМЖ по шаблону templates/kmzh.docx (скилл kmzh-docx-generator).
// Один плоский JSON: из него и лист на сайте (preview.ts), и файл Word (fill.ts),
// поэтому предпросмотр и Word всегда совпадают по содержанию.

/** Этапы урока — префиксы тегов в шаблоне. Подписи этапов стоят в самом шаблоне, минуты заданий — теги {taskN_min}.
 *  4-тапсырма (task4) — отдельно, только при 4 заданиях */
export const kmzhStages = ["org", "start", "new", "task1", "task2", "task3", "sen", "end"] as const;
export type KmzhStage = (typeof kmzhStages)[number];

/** Абзац в колонке учителя: title жирным («"…" тәсілі.», «Күтілетін жауап:»), потом text */
const block = z.object({ title: z.string(), text: z.string().min(1) });
const blocks = z.array(block).min(1);
const scored = z.array(z.object({ text: z.string().min(1), points: z.number().int().min(1) })).min(1);

/** Что пишет Gemini. Бөлім и оқу мақсаты AI тоже пишет: если учитель их дал — повторяет, нет — предлагает */
const base = z.object({
    section: z.string().min(1),
    learning_objective: z.string().min(1),
    lesson_goal: z.string().min(1),

    org_teacher: blocks,
    org_student: z.string(),
    org_assessment: z.string(),
    org_resources: z.string(),

    start_teacher: blocks,
    start_student: z.string(),
    start_assessment: z.string(),
    start_resources: z.string(),

    new_teacher: blocks,
    new_student: z.string(),
    new_assessment: z.string(),
    new_resources: z.string(),

    task1_teacher: blocks,
    task1_student: z.string(),
    task1_descriptors: z.array(z.string().min(1)).min(1),
    task1_assessment: z.string(),
    task1_resources: z.string(),

    task2_teacher: blocks,
    task2_student: z.string(),
    task2_points: z.number().int(),
    task2_descriptors: scored,
    task2_assessment: z.string(),
    task2_resources: z.string(),

    task3_teacher: blocks,
    task3_student: z.string(),
    task3_points: z.number().int(),
    task3_descriptors: scored,
    task3_assessment: z.string(),
    task3_resources: z.string(),

    sen_teacher: blocks,
    sen_student: z.string(),
    sen_points: z.number().int(),
    sen_descriptors: scored,
    sen_assessment: z.string(),
    sen_resources: z.string(),

    end_teacher: blocks,
    end_student: z.string(),
    end_assessment: z.string(),
    end_resources: z.string(),
});

/** 4-тапсырма (шығармашылық) — только когда учитель выбрал 4 задания; в шаблоне строка с условием {#has_task4} */
const task4 = {
  task4_teacher: blocks,
  task4_student: z.string(),
  task4_points: z.number().int(),
  task4_descriptors: scored,
  task4_assessment: z.string(),
  task4_resources: z.string(),
};

/** Сколько заданий в ҚМЖ: 4 — если есть 4-тапсырма */
export const taskCountOf = (d: { task4_teacher?: unknown }) => (d.task4_teacher ? 4 : 3);

/** Минуты 1–4-тапсырма: всего 23 минуты, урок 45 минут */
export const taskMinutes = (count: number) => (count === 4 ? [6, 6, 6, 5] : [8, 7, 8]);

// Баллы за основные задания — всего 10: при 3 заданиях жұптық 4 + жеке 6,
// при 4 заданиях 3 + 4 + 3. ЕБҚ — 10. Сумма дескрипторов совпадает с баллом.
// Если не так — generateJson один раз спрашивает Gemini заново.
type Points = { points: number }[];
const checkPoints = (d: Record<string, unknown>, ctx: z.RefinementCtx) => {
  const four = taskCountOf(d) === 4;
  const expected: [string, number][] = four
    ? [["task2", 3], ["task3", 4], ["task4", 3], ["sen", 10]]
    : [["task2", 4], ["task3", 6], ["sen", 10]];
  for (const [name, want] of expected) {
    const points = d[`${name}_points`];
    const descriptors = (d[`${name}_descriptors`] ?? []) as Points;
    const sum = descriptors.reduce((total, x) => total + x.points, 0);
    if (points !== want || sum !== want) {
      ctx.addIssue({ code: "custom", message: `${name}: ${String(points)} балл, сумма ${sum}, нужно ${want}` });
    }
  }
};

/** Ответ AI на 3 или 4 задания (4-тапсырма необязательна) — им проверяем сохранённое */
export const kmzhAiSchema = base.extend(z.object(task4).partial().shape).superRefine(checkPoints);
/** Для запроса к Gemini при 4 заданиях: 4-тапсырма обязательна */
export const kmzhAi4Schema = base.extend(task4).superRefine(checkPoints);

export type KmzhAi = z.infer<typeof kmzhAiSchema>;

/** Весь ҚМЖ: поля учителя + ответ AI. Это и есть «один JSON» для листа и для Word */
export const kmzhDocSchema = kmzhAiSchema.safeExtend({
  teacher_name: z.string().max(200),
  date: z.string().max(100),
  grade: z.string().max(20),
  topic: z.string().max(200),
  textbook_ref: z.string().max(300),
});
export type KmzhDoc = z.infer<typeof kmzhDocSchema>;

/** Пустой бланк («Бос үлгі» и демо без ключа): тот же шаблон, вместо текста — многоточие */
export function emptyKmzh(): KmzhAi {
  const dots = "…";
  const stage = { teacher: [{ title: "", text: dots }], student: dots, assessment: dots, resources: dots };
  const fields: Record<string, unknown> = { section: dots, learning_objective: dots, lesson_goal: dots };
  for (const id of kmzhStages) {
    fields[`${id}_teacher`] = stage.teacher;
    fields[`${id}_student`] = stage.student;
    fields[`${id}_assessment`] = stage.assessment;
    fields[`${id}_resources`] = stage.resources;
  }
  return {
    ...fields,
    task1_descriptors: [dots],
    task2_points: 4,
    task2_descriptors: [{ text: dots, points: 4 }],
    task3_points: 6,
    task3_descriptors: [{ text: dots, points: 6 }],
    sen_points: 10,
    sen_descriptors: [{ text: dots, points: 10 }],
  } as KmzhAi;
}
