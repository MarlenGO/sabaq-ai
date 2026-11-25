"use client";

import Link from "next/link";
import { useState } from "react";
import { docPath } from "@/data/catalog";
import { useT } from "@/i18n/client";
import { buttonClass } from "@/components/ui/Button";
import { CheckIcon, PencilIcon, PlusIcon } from "@/components/ui/Icons";
import { DeleteButton, MoveButtons } from "@/components/ui/ItemButtons";
import { PopoverSelect } from "@/components/ui/Popover";
import { confirmDelete, fieldClass, moveItem, replaceAt } from "@/components/ui/field";
import type { Plan, PlanLesson } from "@/types/plan";

// Список уроков КТП по четвертям. Строка: номер, дата, тема крупно, бөлім мелко,
// справа — «ҚМЖ жасау» (или галочка «ҚМЖ дайын»). Карандаш раскрывает строку
// в поля: тему, бөлім, цель, дату можно поменять, урок — переставить или удалить.

/** Адрес ҚМЖ по уроку плана: поля подставятся сами (как при открытии из «Тарих») */
export function kmzhHref(plan: Plan, lesson: PlanLesson) {
  const params = new URLSearchParams({
    topic: lesson.topic,
    grade: String(plan.grade),
    lang: plan.language,
    section: lesson.section,
    objective: lesson.objective,
    v: "2",
    plan: plan.id,
    lesson: lesson.id,
  });
  if (lesson.date) params.set("date", lesson.date);
  // ҚМЖ уже был — открываем его из кэша, без новой записи в «Тарих»
  if (lesson.kmzhAt) params.set("done", "1");
  return `/subject/${plan.subject}/${docPath("kmzh")}?${params}`;
}

export const newLessonId = () => Math.random().toString(36).slice(2, 10);

export function LessonList(props: {
  lessons: PlanLesson[];
  onChange: (lessons: PlanLesson[]) => void;
  /** Сохранённый план — есть кнопки ҚМЖ; при проверке после загрузки их нет */
  plan: Plan | null;
}) {
  const t = useT();
  const { lessons, onChange, plan } = props;
  const [editing, setEditing] = useState<string | null>(null);

  // Четверти идут блоками подряд; если в файле их нет — один общий список без заголовка
  const groups: { quarter: number; items: { lesson: PlanLesson; index: number }[] }[] = [];
  lessons.forEach((lesson, index) => {
    const last = groups.at(-1);
    if (last && last.quarter === lesson.quarter) last.items.push({ lesson, index });
    else groups.push({ quarter: lesson.quarter, items: [{ lesson, index }] });
  });
  const showQuarters = lessons.some((lesson) => lesson.quarter > 0);

  const change = (index: number, patch: Partial<PlanLesson>) =>
    // Учитель поправил строку — пометка «тексеріңіз» больше не нужна
    onChange(replaceAt(lessons, index, { ...lessons[index], ...patch, unsure: undefined }));
  const add = () => {
    const last = lessons.at(-1);
    const lesson: PlanLesson = {
      id: newLessonId(),
      quarter: last?.quarter ?? 0,
      date: "",
      section: last?.section ?? "",
      topic: "",
      objective: "",
      kind: "lesson",
    };
    onChange([...lessons, lesson]);
    setEditing(lesson.id);
  };

  return (
    <div className="flex flex-col gap-6">
      {groups.map((group, gi) => (
        <section key={gi}>
          {showQuarters && (
            <h2 className="mb-2 flex items-baseline gap-2 px-1 text-title3 font-extrabold tracking-tight">
              {group.quarter > 0 ? t.plan.quarter(group.quarter) : t.plan.noQuarter}
              <span className="text-subhead font-normal text-label-2">{t.plan.lessonsCount(group.items.length)}</span>
            </h2>
          )}
          <ul className="divide-y divide-separator rounded-3xl bg-surface shadow-card">
            {group.items.map(({ lesson, index }) =>
              editing === lesson.id ? (
                <li key={lesson.id} className="flex flex-col gap-3 bg-accent/5 p-4 sm:p-5 [li:first-child]:rounded-t-3xl [li:last-child]:rounded-b-3xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-subhead font-bold text-label-2">{index + 1}</span>
                    <input
                      value={lesson.date}
                      onChange={(e) => change(index, { date: e.target.value })}
                      aria-label={t.plan.date}
                      placeholder={t.plan.date}
                      className="h-11 w-32 rounded-xl bg-fill px-3 text-callout outline-none focus:ring-4 focus:ring-accent/25"
                    />
                    <PopoverSelect
                      ariaLabel={t.plan.kind}
                      value={lesson.kind}
                      onChange={(kind) => change(index, { kind })}
                      options={(["lesson", "bzhb", "tzhb"] as const).map((kind) => ({ value: kind, label: t.plan.kinds[kind] }))}
                    />
                    <span className="ml-auto flex items-center">
                      <MoveButtons
                        index={index}
                        count={lessons.length}
                        what={t.plan.lessonWhat(index + 1)}
                        onMove={(to) => onChange(moveItem(lessons, index, to))}
                      />
                      <DeleteButton
                        label={`${t.plan.lessonWhat(index + 1)}: ${t.common.delete}`}
                        onClick={() => {
                          if (!confirmDelete(t.common.confirmDelete(t.plan.lessonWhat(index + 1)))) return;
                          onChange(lessons.filter((_, i) => i !== index));
                          setEditing(null);
                        }}
                      />
                    </span>
                  </div>
                  <Labeled title={t.plan.topic}>
                    <input
                      value={lesson.topic}
                      onChange={(e) => change(index, { topic: e.target.value })}
                      // Новая строка или «Өзгерту» — сразу можно печатать тему
                      autoFocus
                      className={`${fieldClass} font-semibold`}
                    />
                  </Labeled>
                  <Labeled title={t.plan.section}>
                    <input value={lesson.section} onChange={(e) => change(index, { section: e.target.value })} className={fieldClass} />
                  </Labeled>
                  <Labeled title={t.plan.objective}>
                    <textarea
                      value={lesson.objective}
                      onChange={(e) => change(index, { objective: e.target.value })}
                      rows={2}
                      className={`${fieldClass} resize-y`}
                    />
                  </Labeled>
                  <button type="button" onClick={() => setEditing(null)} className={`${buttonClass("filled")} self-end`}>
                    <CheckIcon />
                    {t.plan.done}
                  </button>
                </li>
              ) : (
                <li key={lesson.id} className="flex items-center gap-3 px-4 py-3 sm:gap-4 sm:px-5">
                  <span className="w-7 shrink-0 text-right text-subhead font-bold tabular-nums text-label-3">{index + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-x-2 text-footnote text-label-2">
                      {lesson.date && <span className="font-semibold">{lesson.date}</span>}
                      {lesson.kind !== "lesson" && (
                        <span className="rounded-md bg-purple/12 px-1.5 font-bold text-purple">{t.plan.kinds[lesson.kind]}</span>
                      )}
                      {lesson.unsure && <span className="rounded-md bg-orange/15 px-1.5 font-semibold text-orange">{t.plan.unsure}</span>}
                    </p>
                    <p className="text-body font-bold leading-snug">{lesson.topic || "…"}</p>
                    {lesson.section && <p className="truncate text-footnote text-label-2">{lesson.section}</p>}
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditing(lesson.id)}
                    aria-label={`${t.plan.lessonWhat(index + 1)}: ${t.plan.edit}`}
                    title={t.plan.edit}
                    className="flex size-11 shrink-0 items-center justify-center rounded-xl text-label-2 transition hover:bg-fill hover:text-label"
                  >
                    <PencilIcon />
                  </button>
                  {plan && lesson.kind === "lesson" && lesson.topic.trim() && (
                    <Link
                      href={kmzhHref(plan, lesson)}
                      title={lesson.kmzhAt ? t.plan.openKmzh : t.plan.makeKmzh}
                      className={`${buttonClass(lesson.kmzhAt ? "plain" : "tinted")} shrink-0 px-3 sm:px-4`}
                    >
                      {lesson.kmzhAt && <CheckIcon className="size-5" />}
                      {lesson.kmzhAt ? t.plan.kmzhReady : t.plan.makeKmzh}
                    </Link>
                  )}
                </li>
              ),
            )}
          </ul>
        </section>
      ))}
      <button type="button" onClick={add} className={`${buttonClass("tinted")} self-start`}>
        <PlusIcon />
        {t.plan.addLesson}
      </button>
    </div>
  );
}

function Labeled({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="px-1 text-footnote font-semibold text-label-2">{title}</span>
      {children}
    </label>
  );
}
