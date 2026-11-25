"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition, type ReactNode } from "react";
import type { Language, Subject } from "@/types/topic-package";
import { docSchemas, testCounts, type DocKind } from "@/types/documents";
import { docIcon } from "@/data/catalog";
import { buildDocument, docTitle } from "@/documents/render";
import { toHtmlBody, toPrintPage } from "@/documents/html";
import { DOCX_TYPE, toDocx } from "@/documents/docx";
import { emptyDocument } from "@/documents/empty";
import { kk } from "@/i18n/kk";
import { ru } from "@/i18n/ru";
import { useT } from "@/i18n/client";
import { useStoredState } from "@/lib/stored-state";
import { useVoiceInput } from "@/lib/voice-input";
import { FileText } from "lucide-static";
import { Button } from "@/components/ui/Button";
import { LucideIcon } from "@/components/ui/LucideIcon";
import { ArrowLeftIcon, MicIcon, PencilIcon, SparkleIcon } from "@/components/ui/Icons";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { subjectColors } from "@/components/home/SubjectBadge";

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
}

const emptyDraft: Draft = { topic: "", grade: 7, language: "kk", mode: "ai", teacher: "", school: "", date: "", count: 15 };
/** Последний документ AI: для какой темы/класса/языка (for) и сам текст */
const noResult = { for: "", data: null as unknown };
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
  const draft: Draft = { ...merged, grade: grades.includes(merged.grade) ? merged.grade : 7 };
  const [result, setResult] = useStoredState(`sabaq-doc-${kind}-${subject}`, noResult);
  const [loading, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const update = (patch: Partial<Draft>) => {
    setDraft({ ...draft, ...patch });
    setError(null);
  };
  const voice = useVoiceInput(draft.language, (text) => update({ topic: text }));
  const hasTopic = draft.topic.trim().length >= 2;
  const isTest = kind === "test";
  const keyOf = (d: Draft) => `${d.topic.trim().toLowerCase()}|${d.grade}|${d.language}${isTest ? `|${d.count}` : ""}`;
  const requestKey = keyOf(draft);

  // Сохранённый документ мог остаться от старой версии схемы — проверяем
  const saved = useMemo(() => {
    const parsed = docSchemas[kind].safeParse(result.data);
    return parsed.success ? parsed.data : null;
  }, [kind, result.data]);
  const useSaved = draft.mode === "ai" && saved !== null && result.for === requestKey;
  const stale = draft.mode === "ai" && saved !== null && !useSaved && hasTopic;

  const title = docTitle(kind, draft.language);
  const doc = buildDocument(kind, useSaved ? saved : emptyDocument(kind, draft.language, draft.count), {
    topic: draft.topic.trim() || "…",
    grade: draft.grade,
    language: draft.language,
    subjectName: subjectNames[draft.language][subject],
    teacher: draft.teacher,
    school: draft.school,
    date: draft.date,
  });
  const body = toHtmlBody(doc);

  const generate = (from: Draft = draft, again = false) =>
    startTransition(async () => {
      setError(null);
      const { topic, grade, language, count } = from;
      const response = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, topic, grade, language, subject, count, again }),
      }).catch(() => null);
      const data = await response?.json().catch(() => null);
      if (response?.ok && data?.data) setResult({ for: keyOf(from), data: data.data });
      else setError(data?.error ?? t.form.netError);
    });

  // Открыт из «Тарих» (?topic=…&grade=…&lang=…&count=…): подставляем тему и берём
  // документ из кэша — AI второй раз не тратится. Адрес сразу очищаем.
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const fromHistory = params.get("topic");
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
    };
    setDraft(next);
    router.replace(pathname);
    if (result.for !== keyOf(next)) generate(next, true);
    // Только при открытии из истории
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromHistory]);

  const fileName = `${title} — ${draft.topic.trim() || t.docs.document}`.replace(/[\\/:*?"<>|]+/g, " ").slice(0, 90);

  const downloadWord = () => {
    // Настоящий .docx: таблицы с фиксированными колонками — в Word ничего не съезжает
    const bytes = toDocx(doc);
    const blob = new Blob([bytes.buffer as ArrayBuffer], { type: DOCX_TYPE });
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
            <span
              style={subjectColors(subject)}
              className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-(--tile) text-(--ink)"
            >
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

          <Field title={t.form.contentLanguage}>
            <SegmentedControl
              ariaLabel={t.form.contentLanguage}
              value={draft.language}
              onChange={(language) => update({ language })}
              options={[
                { value: "kk", label: "Қазақша" },
                { value: "ru", label: "Русский" },
              ]}
            />
          </Field>

          <Field title={t.form.gradeLabel}>
            <div role="radiogroup" aria-label={t.form.gradeLabel} className="grid grid-cols-6 gap-1.5">
              {grades.map((grade) => (
                <button
                  key={grade}
                  type="button"
                  role="radio"
                  aria-checked={grade === draft.grade}
                  aria-label={t.common.grade(grade)}
                  onClick={() => update({ grade })}
                  className={`flex h-11 items-center justify-center rounded-xl text-callout font-semibold transition ${
                    grade === draft.grade ? "bg-accent text-white" : "bg-fill text-label hover:bg-accent/15"
                  }`}
                >
                  {grade}
                </button>
              ))}
            </div>
          </Field>

          {isTest && (
            <Field title={t.docs.count}>
              <SegmentedControl
                ariaLabel={t.docs.count}
                value={String(draft.count)}
                onChange={(value) => update({ count: Number(value) })}
                options={testCounts.map((n) => ({ value: String(n), label: String(n) }))}
              />
            </Field>
          )}

          <div role="radiogroup" aria-label={t.form.contentMode} className="grid grid-cols-2 gap-2">
              <ModeRow
                selected={draft.mode === "ai"}
                onSelect={() => update({ mode: "ai" })}
                icon={<SparkleIcon />}
                title={t.form.modeAi}
              />
              <ModeRow
                selected={draft.mode === "empty"}
                onSelect={() => update({ mode: "empty" })}
                icon={<PencilIcon />}
                title={t.docs.modeEmpty}
              />
            </div>

          <details className="group rounded-xl bg-fill px-4 py-3">
            <summary className="cursor-pointer text-subhead font-semibold">{t.docs.extra}</summary>
            <div className="mt-3 flex flex-col gap-2.5">
              <TextInput label={t.docs.teacher} value={draft.teacher} onChange={(teacher) => update({ teacher })} />
              <TextInput label={t.docs.school} value={draft.school} onChange={(school) => update({ school })} />
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
          {error && (
            <div role="alert" className="rounded-2xl bg-red/10 p-4 text-subhead text-red">
              {error}
            </div>
          )}
        </form>

      </div>

      <section aria-label={t.docs.preview} className="min-w-0 lg:sticky lg:top-6">
        <h2 className="mb-3 text-subhead font-semibold text-label-2">{t.docs.preview}</h2>
        {draft.mode === "ai" && !useSaved && (
          <p className="mb-3 rounded-2xl bg-accent/10 px-4 py-3 text-subhead text-accent">{stale ? t.docs.stale : t.docs.previewHint}</p>
        )}
        {/* Лист бумаги: всегда белый с чёрным текстом, и в тёмной теме — как будет на печати */}
        <Sheet landscape={doc.landscape} html={body} dim={loading} />
      </section>
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

function ModeRow(props: { selected: boolean; onSelect: () => void; icon: ReactNode; title: string }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={props.selected}
      onClick={props.onSelect}
      className={`flex items-center gap-2 rounded-xl border-2 px-3 py-3 text-left transition ${
        props.selected ? "border-accent bg-accent/6" : "border-transparent bg-fill hover:border-separator"
      }`}
    >
      <span className={`${props.selected ? "text-accent" : "text-label-2"}`}>{props.icon}</span>
      <span>
        <span className="block text-subhead font-bold">{props.title}</span>
      </span>
    </button>
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
        className="h-11 rounded-xl bg-surface px-3.5 text-body outline-none placeholder:text-label-3 focus:ring-4 focus:ring-accent/25"
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
