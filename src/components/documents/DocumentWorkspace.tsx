"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition, type ReactNode } from "react";
import type { Language, Subject } from "@/types/topic-package";
import { docSchemas, lessonTypes, planTypes, testCounts, type DocData, type DocFields, type DocKind, type DocumentRequest, type MyDocument } from "@/types/documents";
import { docIcon } from "@/data/catalog";
import { buildDocument, docTitle } from "@/documents/render";
import { toHtmlBody, toPrintPage } from "@/documents/html";
import { DOCX_TYPE, toDocx } from "@/documents/docx";
import { emptyDocument } from "@/documents/empty";
import { emptyKmzh, kmzhAiSchema, type KmzhAi, type KmzhDoc } from "@/lib/kmzh/schema";
import { kmzhPreview } from "@/lib/kmzh/preview";
import { kk } from "@/i18n/kk";
import { ru } from "@/i18n/ru";
import { useT } from "@/i18n/client";
import { useStoredState } from "@/lib/stored-state";
import { useVoiceInput } from "@/lib/voice-input";
import { FileText } from "lucide-static";
import { Button } from "@/components/ui/Button";
import { LucideIcon } from "@/components/ui/LucideIcon";
import { ArrowLeftIcon, MicIcon, PencilIcon, SparkleIcon } from "@/components/ui/Icons";
import { PopoverSelect } from "@/components/ui/Popover";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { subjectColors } from "@/components/home/SubjectBadge";
import { PLAN_CHANGED } from "@/components/plan/LessonList";

type Mode = "ai" | "empty";

interface Draft {
  topic: string;
  grade: number;
  language: Language;
  mode: Mode;
  teacher: string;
  school: string;
  date: string;
  /** Сколько вопросов в тесте */
  count: number;
  /** Только ҚМЖ: бөлім, оқу мақсаты (пусто — предложит AI), оқулық, апта құндылығы */
  section: string;
  objective: string;
  textbook: string;
  value: string;
  /** Только ҚМЖ: вид плана, тип урока и число заданий (3 или 4) */
  planType: DocumentRequest["planType"];
  lessonType: DocumentRequest["lessonType"];
  taskCount: DocumentRequest["taskCount"];
}

const emptyDraft: Draft = {
  topic: "",
  grade: 7,
  language: "kk",
  mode: "ai",
  teacher: "",
  school: "",
  date: "",
  count: 15,
  section: "",
  objective: "",
  textbook: "",
  value: "",
  planType: "full",
  lessonType: "new",
  taskCount: 3,
};
/** Поля ҚМЖ, которые учитель пишет сам: и в запросе, и в адресе из «Тарих» */
const kmzhFields = ["section", "objective", "textbook", "value", "planType", "lessonType"] as const;
/** Последний документ AI: для какой темы/класса/языка (for), сам текст и его id в «Менің құжаттарым» */
const noResult = { for: "", data: null as unknown, docId: "" };
/** Пауза перед автосохранением: учитель допечатывает слово — запрос один */
const SAVE_DELAY = 800;
type SaveState = "idle" | "saving" | "saved" | "error";
/** Классы 6–11: сайт для средней и старшей школы, все помещаются в одну строку */
const grades = [6, 7, 8, 9, 10, 11];
/** Названия предметов в документе — на языке документа, а не сайта */
const subjectNames = { kk: kk.subjects, ru: ru.subjects };

// Документ: слева узкая форма (тема, язык, класс, AI или бланк), справа — лист A4.
// Конструктора нет: что видно справа, то и скачивается в Word или идёт на печать.
export function DocumentWorkspace({ subject, kind }: { subject: Subject; kind: DocKind }) {
  const t = useT();
  const [stored, setDraft] = useStoredState("sabaq-doc", emptyDraft);
  const merged: Draft = { ...emptyDraft, ...stored };
  // В старых черновиках мог остаться класс 1–5 — их больше нет в списке
  // Жұмыс парағы — только на казахском; выбор языка у других документов не трогаем
  const onlyKazakh = kind === "worksheet";
  const draft: Draft = {
    ...merged,
    grade: grades.includes(merged.grade) ? merged.grade : 7,
    ...(onlyKazakh ? { language: "kk" as const } : {}),
  };
  const [result, setResult] = useStoredState(`sabaq-doc-${kind}-${subject}`, noResult);
  const [loading, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const update = (patch: Partial<Draft>) => {
    setDraft({ ...draft, language: merged.language, ...patch });
    setError(null);
  };
  const voice = useVoiceInput(draft.language, (text) => update({ topic: text }));
  const hasTopic = draft.topic.trim().length >= 2;
  const isTest = kind === "test";
  const isKmzh = kind === "kmzh";
  const keyOf = (d: Draft) =>
    `${d.topic.trim().toLowerCase()}|${d.grade}|${d.language}${isTest ? `|${d.count}` : ""}${
      isKmzh ? `|${kmzhFields.map((f) => d[f].trim().toLowerCase()).join("|")}${d.taskCount === 4 ? "|t4" : ""}` : ""
    }`;
  const requestKey = keyOf(draft);
  /** Поля формы для «Менің құжаттарым» (сохраняются вместе с ответом AI) */
  const fieldsOf = (d: Draft): DocFields => ({
    subject,
    topic: d.topic.trim(),
    grade: d.grade,
    language: d.language,
    count: d.count,
    section: d.section.trim(),
    objective: d.objective.trim(),
    textbook: d.textbook.trim(),
    value: d.value.trim(),
    planType: d.planType,
    lessonType: d.lessonType,
    taskCount: d.taskCount,
    teacher: d.teacher.trim(),
    school: d.school.trim(),
    date: d.date.trim(),
  });

  // Сохранённый документ мог остаться от старой версии схемы — проверяем
  const saved = useMemo(() => {
    const parsed = (isKmzh ? kmzhAiSchema : docSchemas[kind]).safeParse(result.data);
    return parsed.success ? parsed.data : null;
  }, [isKmzh, kind, result.data]);
  const useSaved = draft.mode === "ai" && saved !== null && result.for === requestKey;
  const stale = draft.mode === "ai" && saved !== null && !useSaved && hasTopic;

  const title = docTitle(kind, draft.language);
  // ҚМЖ: один JSON (поля учителя + ответ AI) — из него и лист справа, и файл Word
  const ai = (useSaved ? saved : emptyKmzh()) as KmzhAi;
  const kmzh: KmzhDoc = {
    ...ai,
    teacher_name: draft.teacher.trim(),
    date: draft.date.trim(),
    grade: String(draft.grade),
    topic: draft.topic.trim() || "…",
    section: draft.section.trim() || ai.section,
    learning_objective: draft.objective.trim() || ai.learning_objective,
    textbook_ref: draft.textbook.trim(),
  };
  // Бөлім и оқу мақсаты, которые предложил AI, на листе помечены «тексеріңіз» (в файл и печать пометка не идёт)
  const suggested = useSaved
    ? [!draft.section.trim() && ("section" as const), !draft.objective.trim() && ("learning_objective" as const)].filter((x) => x !== false)
    : [];
  const doc = isKmzh
    ? kmzhPreview(kmzh)
    : buildDocument<DocKind>(kind, (useSaved ? saved : emptyDocument(kind, draft.language, draft.count)) as DocData[DocKind], {
        topic: draft.topic.trim() || "…",
        grade: draft.grade,
        language: draft.language,
        subjectName: subjectNames[draft.language][subject],
        teacher: draft.teacher,
        school: draft.school,
        date: draft.date,
      });
  const body = toHtmlBody(isKmzh ? kmzhPreview(kmzh, suggested) : doc);

  // Автосохранение в «Менің құжаттарым»: поля формы уходят на сервер через 800 мс после правки,
  // пока лист справа — этот документ (тему поменяли — это уже другой документ, его надо создать)
  const savedFields = useRef("");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const docId = useSaved ? (result.docId ?? "") : "";
  const fieldsJson = JSON.stringify(fieldsOf(draft));
  useEffect(() => {
    if (!docId || fieldsJson === savedFields.current) return;
    const timer = setTimeout(async () => {
      setSaveState("saving");
      const response = await fetch(`/api/documents/${docId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fields: JSON.parse(fieldsJson) }),
      }).catch(() => null);
      if (response?.ok) savedFields.current = fieldsJson;
      setSaveState(response?.ok ? "saved" : "error");
    }, SAVE_DELAY);
    return () => clearTimeout(timer);
  }, [docId, fieldsJson]);

  /** afterwards — что сделать после удачного ответа (отметить урок в «Жоспар») */
  const generate = (from: Draft = draft, again = false, afterwards?: () => Promise<unknown>) =>
    startTransition(async () => {
      setError(null);
      const { topic, grade, language, count, section, objective, textbook, value, planType, lessonType, taskCount, teacher, school, date } = from;
      setOldFormat(false);
      const response = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          topic,
          grade,
          language,
          subject,
          count,
          section,
          objective,
          textbook,
          value,
          planType,
          lessonType,
          taskCount,
          teacher,
          school,
          date,
          again,
        }),
      }).catch(() => null);
      const data = await response?.json().catch(() => null);
      if (response?.ok && data?.data) {
        // Новый документ сразу лежит в «Менің құжаттарым» (docId); из «Тарих» (again) — прежний id, если был
        const docId = typeof data.docId === "string" ? data.docId : again && result.for === keyOf(from) ? result.docId : "";
        savedFields.current = JSON.stringify(fieldsOf(from));
        setSaveState(docId ? "saved" : "idle");
        setResult({ for: keyOf(from), data: data.data, docId });
        await afterwards?.().catch(() => {});
      } else setError(data?.error ?? t.form.netError);
    });

  // Открыт из «Тарих» (?topic=…&grade=…&lang=…&count=…): подставляем тему и берём
  // документ из кэша — AI второй раз не тратится. Адрес сразу очищаем.
  // Из «Жоспар» (&plan=…&lesson=…&date=…): ҚМЖ по уроку КТП — новая запись в «Тарих»
  // и галочка у урока; &done=1 — ҚМЖ по уроку уже был, просто открываем.
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const fromHistory = params.get("topic");
  /** Старый ҚМЖ из «Тарих» (до Word-шаблона): его нет в новом кэше — предлагаем пересоздать */
  const [oldFormat, setOldFormat] = useState(false);
  useEffect(() => {
    if (!fromHistory) return;
    const grade = Number(params.get("grade"));
    const count = Number(params.get("count"));
    const next: Draft = {
      ...draft,
      mode: "ai",
      topic: fromHistory,
      grade: grades.includes(grade) ? grade : draft.grade,
      language: params.get("lang") === "ru" ? "ru" : "kk",
      count: testCounts.includes(count as (typeof testCounts)[number]) ? count : draft.count,
      ...Object.fromEntries(kmzhFields.map((f) => [f, params.get(f) ?? emptyDraft[f]])),
      taskCount: params.get("tasks") === "4" ? 4 : 3,
      date: params.get("date") ?? draft.date,
    };
    setDraft(next);
    router.replace(pathname);
    const planId = params.get("plan");
    const lessonId = params.get("lesson");
    const fromPlan = Boolean(planId && lessonId) && params.get("done") !== "1";
    const markLesson = () =>
      fetch(`/api/plans/${planId}/kmzh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lesson: lessonId }),
        // «Жоспар» может быть уже открыт (вернулись, пока ҚМЖ готовился) — пусть перечитает
      }).then(() => window.dispatchEvent(new Event(PLAN_CHANGED)));
    if (isKmzh && params.get("v") !== "2") setOldFormat(true);
    else if (fromPlan) generate(next, false, markLesson);
    else if (result.for !== keyOf(next)) generate(next, true);
    // Только при открытии из истории
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromHistory]);

  // Открыт из «Менің құжаттарым» (?doc=id): поля формы и ответ AI — с сервера, с правками учителя
  const openDoc = params.get("doc");
  const [opening, startOpening] = useTransition();
  useEffect(() => {
    if (!openDoc) return;
    router.replace(pathname);
    startOpening(async () => {
      setError(null);
      setOldFormat(false);
      const response = await fetch(`/api/documents/${openDoc}`).catch(() => null);
      const data = await response?.json().catch(() => null);
      if (!response?.ok || !data?.fields) {
        setError(data?.error ?? t.form.netError);
        return;
      }
      const { fields, content } = data as MyDocument;
      const next: Draft = {
        ...emptyDraft,
        ...fields,
        mode: "ai",
        grade: grades.includes(fields.grade) ? fields.grade : 7,
      };
      setDraft(next);
      savedFields.current = JSON.stringify(fieldsOf(next));
      setSaveState("saved");
      setResult({ for: keyOf(next), data: content, docId: openDoc });
    });
    // Только при открытии из списка
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openDoc]);

  // «ҚМЖ - Тақырып»: у ҚМЖ на обоих языках сайта приставка «ҚМЖ»
  const fileName = `${isKmzh ? "ҚМЖ" : title} - ${draft.topic.trim() || t.docs.document}`.replace(/[\\/:*?"<>|]+/g, " ").slice(0, 90);

  const downloadWord = async () => {
    // ҚМЖ собирает сервер по Word-шаблону из того же JSON, что на листе; остальные —
    // настоящий .docx прямо в браузере (таблицы с фиксированными колонками)
    let blob: Blob;
    if (isKmzh) {
      const response = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word: kmzh }),
      }).catch(() => null);
      if (!response?.ok) {
        setError(t.form.netError);
        return;
      }
      blob = await response.blob();
    } else {
      blob = new Blob([toDocx(doc).buffer as ArrayBuffer], { type: DOCX_TYPE });
    }
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${fileName}.docx`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const print = () => {
    // Отдельное окно только с листом: в окне печати можно выбрать «Сохранить как PDF»
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(toPrintPage(doc));
    win.document.close();
    win.focus();
    win.print();
  };

  const name = t.docs.kinds[kind].name;

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[22rem_minmax(0,1fr)]">
      <div className="flex min-w-0 flex-col gap-5">
        <div>
          <Link
            href={`/subject/${subject}`}
            className="inline-flex h-11 items-center gap-1.5 rounded-full pr-3 text-subhead font-semibold text-accent hover:opacity-70"
          >
            <ArrowLeftIcon />
            {t.subjects[subject]}
          </Link>
          <div className="mt-1 flex items-center gap-3">
            <span style={subjectColors(subject)} className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-(--tile) text-(--ink)">
              <LucideIcon svg={docIcon[kind]} className="size-7 [&>svg]:stroke-[1.6]" />
            </span>
            <div>
              <p className="text-footnote text-label-2">{t.docs.document}</p>
              <h1 className="text-title2 font-extrabold tracking-tight">{name}</h1>
            </div>
          </div>
        </div>

        <form
          className="flex flex-col gap-5 rounded-3xl bg-surface p-5"
          onSubmit={(e) => {
            e.preventDefault();
            if (draft.mode === "ai" && hasTopic && !loading) generate();
          }}
        >
          <Field title={t.form.topicLabel}>
            <div className="relative">
              <input
                value={draft.topic}
                onChange={(e) => update({ topic: e.target.value })}
                aria-label={t.form.topicLabel}
                className="h-12 w-full rounded-xl bg-fill pl-4 pr-12 text-body outline-none placeholder:text-label-3 focus:ring-4 focus:ring-accent/25"
              />
              {voice.supported && (
                <button
                  type="button"
                  onClick={voice.listening ? voice.stop : voice.start}
                  aria-label={voice.listening ? t.form.voiceStop : t.form.voiceStart}
                  title={t.form.voiceStart}
                  className={`absolute right-1.5 top-1.5 flex size-9 items-center justify-center rounded-lg transition ${
                    voice.listening ? "animate-pulse bg-red text-white" : "text-accent hover:bg-accent/12"
                  }`}
                >
                  <MicIcon />
                </button>
              )}
            </div>
            {voice.listening && <p className="mt-2 text-subhead text-red">{t.form.listening}</p>}
          </Field>

          {/* Остальные настройки — один компактный список, как «Настройки» в iPhone:
              название слева мелко, значение справа; заметной остаётся только тема */}
          <div className="divide-y divide-separator rounded-2xl border border-accent/25">
            <Setting title={t.form.contentLanguage}>
              {onlyKazakh ? (
                <span className="px-2 text-callout font-semibold text-label-2">Қазақша</span>
              ) : (
                <PopoverSelect
                  inline
                  alignRight
                  ariaLabel={t.form.contentLanguage}
                  value={draft.language}
                  onChange={(language) => update({ language })}
                  options={[
                    { value: "kk", label: "Қазақша" },
                    { value: "ru", label: "Русский" },
                  ]}
                />
              )}
            </Setting>
            <Setting title={t.form.gradeLabel}>
              <PopoverSelect
                inline
                alignRight
                ariaLabel={t.form.gradeLabel}
                value={String(draft.grade)}
                onChange={(value) => update({ grade: Number(value) })}
                options={grades.map((grade) => ({
                  value: String(grade),
                  label: t.common.grade(grade),
                }))}
              />
            </Setting>
            {isTest && (
              <Setting title={t.docs.count}>
                <PopoverSelect
                  inline
                  alignRight
                  ariaLabel={t.docs.count}
                  value={String(draft.count)}
                  onChange={(value) => update({ count: Number(value) })}
                  options={testCounts.map((n) => ({
                    value: String(n),
                    label: String(n),
                  }))}
                />
              </Setting>
            )}
            {isKmzh && (
              <>
                <Setting title={t.docs.section}>
                  <input
                    value={draft.section}
                    onChange={(e) => update({ section: e.target.value })}
                    aria-label={t.docs.section}
                    placeholder={t.docs.optional}
                    className="h-11 min-w-0 flex-1 rounded-lg bg-transparent px-2 text-right text-callout font-semibold text-accent outline-none placeholder:font-normal placeholder:text-label-3 focus:bg-accent/8"
                  />
                </Setting>
                <Setting title={t.docs.planType}>
                  <PopoverSelect
                    inline
                    alignRight
                    ariaLabel={t.docs.planType}
                    value={draft.planType}
                    onChange={(planType) => update({ planType })}
                    options={planTypes.map((id) => ({
                      value: id,
                      label: t.docs.planTypes[id],
                    }))}
                  />
                </Setting>
                <Setting title={t.docs.lessonType}>
                  <PopoverSelect
                    inline
                    alignRight
                    ariaLabel={t.docs.lessonType}
                    value={draft.lessonType}
                    onChange={(lessonType) => update({ lessonType })}
                    options={lessonTypes.map((id) => ({
                      value: id,
                      label: t.docs.lessonTypes[id],
                    }))}
                  />
                </Setting>
                <Setting title={t.docs.taskCount}>
                  <PopoverSelect
                    inline
                    alignRight
                    ariaLabel={t.docs.taskCount}
                    value={String(draft.taskCount)}
                    onChange={(value) => update({ taskCount: value === "4" ? 4 : 3 })}
                    options={[3, 4].map((n) => ({
                      value: String(n),
                      label: t.docs.tasks(n),
                    }))}
                  />
                </Setting>
              </>
            )}
          </div>

          {/* AI жазады / Бос жоба — небольшой переключатель */}
          <SegmentedControl
            ariaLabel={t.form.contentMode}
            value={draft.mode}
            onChange={(mode) => update({ mode })}
            options={[
              {
                value: "ai",
                label: t.form.modeAi,
                icon: <SparkleIcon className="size-4" />,
              },
              {
                value: "empty",
                label: t.docs.modeEmpty,
                icon: <PencilIcon className="size-4" />,
              },
            ]}
          />

          <details className="group px-1">
            <summary className="flex min-h-11 cursor-pointer items-center text-subhead font-semibold text-label-2 hover:text-label">
              {t.docs.extra}
            </summary>
            <div className="mt-3 flex flex-col gap-2.5">
              <TextInput label={t.docs.teacher} value={draft.teacher} onChange={(teacher) => update({ teacher })} />
              {/* В шаблоне ҚМЖ строки «Мектеп» нет */}
              {!isKmzh && <TextInput label={t.docs.school} value={draft.school} onChange={(school) => update({ school })} />}
              <TextInput label={t.docs.date} value={draft.date} onChange={(date) => update({ date })} placeholder="01.09.2026" />
            </div>
          </details>

          {draft.mode === "ai" && (
            <Button type="submit" size="lg" disabled={!hasTopic || loading}>
              <SparkleIcon className={loading ? "animate-spin" : ""} />
              {loading ? t.docs.working : t.docs.make}
            </Button>
          )}
          {/* Скачать то, что сейчас на листе справа */}
          <div className="grid grid-cols-2 gap-2">
            <FileButton label="Word" title={t.docs.word} onClick={downloadWord} />
            <FileButton label="PDF" title={t.docs.print} onClick={print} />
          </div>
          {docId && (
            <p className="flex flex-wrap items-center gap-x-2 px-1 text-footnote text-label-2" aria-live="polite">
              <Link href="/documents" className="font-semibold text-accent hover:opacity-70">
                {t.docs.savedTo}
              </Link>
              {saveState === "saving" && <span>· {t.docs.saving}</span>}
              {saveState === "saved" && <span>· {t.docs.savedOk}</span>}
              {saveState === "error" && <span className="text-red">· {t.docs.saveError}</span>}
            </p>
          )}
          {error && (
            <div role="alert" className="rounded-2xl bg-red/10 p-4 text-subhead text-red">
              {error}
            </div>
          )}
        </form>
      </div>

      <section aria-label={t.docs.preview} className="min-w-0 lg:sticky lg:top-6">
        <h2 className="mb-3 text-subhead font-semibold text-label-2">{t.docs.preview}</h2>
        {oldFormat && !loading && (
          <div className="mb-3 flex flex-wrap items-center gap-3 rounded-2xl bg-orange/12 px-4 py-3">
            <p className="flex-1 text-subhead">{t.docs.oldFormat}</p>
            <Button type="button" onClick={() => generate()}>
              <SparkleIcon />
              {t.docs.remake}
            </Button>
          </div>
        )}
        {opening && <p className="mb-3 rounded-2xl bg-accent/10 px-4 py-3 text-subhead text-accent">{t.docs.loadingDoc}</p>}
        {draft.mode === "ai" && !useSaved && !oldFormat && !opening && (
          <p className="mb-3 rounded-2xl bg-accent/10 px-4 py-3 text-subhead text-accent">{stale ? t.docs.stale : t.docs.previewHint}</p>
        )}
        {/* Лист бумаги: всегда белый с чёрным текстом, и в тёмной теме — как будет на печати */}
        <Sheet landscape={doc.landscape} html={body} dim={loading || opening} />
      </section>
    </div>
  );
}

/** Строка списка настроек: название слева, значение справа */
function Setting({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex min-h-12 items-center justify-between gap-3 pl-4 pr-2">
      <span className="shrink-0 text-subhead text-label-2">{title}</span>
      {children}
    </div>
  );
}

function Field({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset>
      <legend className="mb-2 text-callout font-bold">{title}</legend>
      {children}
    </fieldset>
  );
}

function TextInput(props: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-footnote text-label-2">{props.label}</span>
      <input
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        placeholder={props.placeholder}
        className="h-11 rounded-xl border border-accent/30 bg-surface px-3.5 text-body outline-none transition placeholder:text-label-3 focus:border-accent focus:ring-4 focus:ring-accent/20"
      />
    </label>
  );
}

/** Маленькая кнопка-«таблетка» со значком файла: Word или PDF */
function FileButton({ label, title, onClick }: { label: string; title: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className="flex h-12 items-center justify-center gap-2 rounded-full bg-fill px-5 text-subhead font-bold text-label transition-colors hover:bg-accent/15"
    >
      <LucideIcon svg={FileText} className="size-[1.1rem]" />
      {label}
    </button>
  );
}

/** Ширина листа A4 в пикселях (96 точек на дюйм) без полей: альбомный и книжный */
const SHEET_PX = { landscape: 1123, portrait: 794 };

/**
 * Лист бумаги: всегда белый с чёрным текстом, и в тёмной теме — как будет на печати.
 * Лист рисуется в настоящую ширину A4 и уменьшается под колонку (как «по ширине страницы»
 * в Word), поэтому таблицы выглядят так же, как в файле, без прокрутки вбок.
 */
function Sheet({ landscape, html, dim }: { landscape: boolean; html: string; dim: boolean }) {
  const box = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const width = landscape ? SHEET_PX.landscape : SHEET_PX.portrait;
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setScale(Math.min(1, entry.contentRect.width / width)));
    observer.observe(el);
    return () => observer.disconnect();
  }, [width]);
  return (
    <div ref={box} className="max-h-[calc(100dvh-8rem)] overflow-y-auto overflow-x-hidden rounded-2xl bg-white shadow-card ring-1 ring-black/5">
      <div
        style={{ width, zoom: scale }}
        className={`px-10 py-9 transition-opacity ${dim ? "opacity-40" : ""}`}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
