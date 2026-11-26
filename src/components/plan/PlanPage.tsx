"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import { useT } from "@/i18n/client";
import { useStoredState } from "@/lib/stored-state";
import { subjectOrder } from "@/lib/labels";
import { Button, buttonClass } from "@/components/ui/Button";
import { ArrowLeftIcon, PlusIcon, SparkleIcon, TrashIcon } from "@/components/ui/Icons";
import { PopoverSelect } from "@/components/ui/Popover";
import { confirmDelete } from "@/components/ui/field";
import { LessonList, PLAN_CHANGED, kmzhHref } from "@/components/plan/LessonList";
import type { Plan, PlanInput } from "@/types/plan";

// «Жоспар» — КТП учителя. Три состояния:
// 1) планов нет или нажали «Жаңа КТП жүктеу» — загрузка файла;
// 2) файл прочитан — проверка: уроки можно поправить, потом «Сақтау»;
// 3) план сохранён — сверху «Келесі сабақ» с кнопкой ҚМЖ, ниже все уроки по четвертям.
// Правки сохранённого плана пишутся сами (через секунду после последнего изменения).

const noDraft = { draft: null as PlanInput | null };
const grades = Array.from({ length: 11 }, (_, i) => i + 1);

export function PlanPage({ initialPlans }: { initialPlans: Plan[] }) {
  const t = useT();
  const [plans, setPlans] = useState(initialPlans);
  const [currentId, setCurrentId] = useState(initialPlans[0]?.id ?? null);
  const [uploading, setUploading] = useState(initialPlans.length === 0);
  // Разобранный файл живёт в браузере до «Сақтау»: перезагрузка страницы не потратит AI ещё раз
  const [{ draft }, setStored] = useStoredState("sabaq-plan-draft", noDraft);
  const setDraft = (next: PlanInput | null) => setStored({ draft: next });
  const [saving, startSaving] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const plan = plans.find((p) => p.id === currentId) ?? null;

  // Автосохранение: ждём секунду тишины, потом отправляем план целиком
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const pending = useRef<Plan | null>(null);
  useEffect(() => {
    const next = pending.current;
    if (!next) return;
    const timer = setTimeout(async () => {
      pending.current = null;
      setStatus("saving");
      const { title, subject, grade, language, lessons } = next;
      const response = await fetch(`/api/plans/${next.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, subject, grade, language, lessons }),
      }).catch(() => null);
      setStatus(response?.ok ? "saved" : "error");
    }, 1000);
    return () => clearTimeout(timer);
  }, [plans]);

  // Next.js держит страницу в памяти: вернулись из ҚМЖ — список старый, без галочки.
  // Эффект заново срабатывает при каждом показе страницы (и когда вкладка снова видна) —
  // перечитываем планы из базы. Пока есть несохранённая правка, не трогаем.
  const opened = useRef(false);
  useEffect(() => {
    const reload = async () => {
      if (document.visibilityState !== "visible" || pending.current) return;
      const response = await fetch("/api/plans").catch(() => null);
      const data = await response?.json().catch(() => null);
      if (!response?.ok || !Array.isArray(data?.plans) || pending.current) return;
      setPlans(data.plans);
    };
    if (opened.current) reload();
    opened.current = true;
    document.addEventListener("visibilitychange", reload);
    window.addEventListener(PLAN_CHANGED, reload);
    return () => {
      document.removeEventListener("visibilitychange", reload);
      window.removeEventListener(PLAN_CHANGED, reload);
    };
  }, []);

  const changePlan = (patch: Partial<Plan>) => {
    if (!plan) return;
    const next = { ...plan, ...patch };
    pending.current = next;
    setPlans(plans.map((p) => (p.id === next.id ? next : p)));
  };

  const saveDraft = () =>
    startSaving(async () => {
      if (!draft) return;
      setError(null);
      const response = await fetch("/api/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      }).catch(() => null);
      const data = await response?.json().catch(() => null);
      if (!response?.ok || !data?.id) {
        setError(data?.error ?? t.form.netError);
        return;
      }
      const saved: Plan = { ...draft, id: data.id, updatedAt: new Date().toISOString() };
      setPlans([saved, ...plans]);
      setCurrentId(saved.id);
      setDraft(null);
      setUploading(false);
    });

  const removePlan = async () => {
    if (!plan || !confirmDelete(t.common.confirmDelete(t.plan.planWhat(plan.title)))) return;
    const response = await fetch(`/api/plans/${plan.id}`, { method: "DELETE" }).catch(() => null);
    if (!response?.ok) {
      setError(t.form.netError);
      return;
    }
    const rest = plans.filter((p) => p.id !== plan.id);
    setPlans(rest);
    setCurrentId(rest[0]?.id ?? null);
    setUploading(rest.length === 0);
  };

  // ——— 2) Проверка разобранного файла ———
  if (draft) {
    const unsure = draft.lessons.filter((lesson) => lesson.unsure).length;
    return (
      <div className="flex flex-col gap-6">
        <div className="rounded-2xl bg-accent/10 p-4 text-callout">
          <p className="font-semibold text-accent">{t.plan.found(draft.lessons.length)}</p>
          {unsure > 0 && <p className="mt-1 text-subhead text-orange">{t.plan.unsureCount(unsure)}</p>}
        </div>
        <PlanSettings value={draft} onChange={(patch) => setDraft({ ...draft, ...patch })} />
        <LessonList key="draft" lessons={draft.lessons} onChange={(lessons) => setDraft({ ...draft, lessons })} plan={null} />
        {error && <ErrorBox>{error}</ErrorBox>}
        {/* Кнопки снизу и «прилипают» к краю экрана: длинный список не надо листать обратно */}
        <div className="sticky bottom-4 flex flex-wrap gap-3 rounded-2xl bg-glass p-3 shadow-card backdrop-blur-xl">
          <Button size="lg" onClick={saveDraft} disabled={saving || draft.lessons.length === 0}>
            {t.plan.save}
          </Button>
          <Button size="lg" variant="tinted" onClick={() => setDraft(null)}>
            {t.plan.cancel}
          </Button>
        </div>
      </div>
    );
  }

  // ——— 1) Загрузка файла ———
  if (uploading || !plan) {
    return (
      <div className="flex flex-col gap-4">
        {plans.length > 0 && (
          <button type="button" onClick={() => setUploading(false)} className={`${buttonClass("plain")} -ml-3 self-start`}>
            <ArrowLeftIcon />
            {t.plan.cancel}
          </button>
        )}
        <Upload onParsed={(next) => setDraft(next)} />
      </div>
    );
  }

  // ——— 3) Сохранённый план ———
  const next = plan.lessons.find((lesson) => lesson.kind === "lesson" && lesson.topic.trim() && !lesson.kmzhAt);
  const nextNumber = next ? plan.lessons.indexOf(next) + 1 : 0;
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-2">
        {plans.length > 1 ? (
          <PopoverSelect
            ariaLabel={t.plan.choosePlan}
            value={plan.id}
            onChange={setCurrentId}
            options={plans.map((p) => ({ value: p.id, label: p.title }))}
          />
        ) : (
          <p className="text-title3 font-bold">{plan.title}</p>
        )}
        <span className="text-footnote text-label-3" aria-live="polite">
          {status === "saving" ? t.plan.saving : status === "saved" ? t.plan.saved : status === "error" ? t.plan.saveError : ""}
        </span>
        <button type="button" onClick={() => setUploading(true)} className={`${buttonClass("tinted")} ml-auto`}>
          <PlusIcon />
          {t.plan.newPlan}
        </button>
      </div>

      {/* Келесі сабақ: первый урок без ҚМЖ — главное, что нужно каждый день */}
      <div className="rounded-3xl bg-surface p-5 shadow-card sm:p-7">
        {next ? (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-subhead font-semibold text-accent">
                {t.plan.next} · {nextNumber}
                {next.date && ` · ${next.date}`}
              </p>
              <p className="mt-1 text-title2 font-extrabold leading-tight tracking-tight">{next.topic}</p>
              {next.section && <p className="mt-1 text-subhead text-label-2">{next.section}</p>}
            </div>
            <Link href={kmzhHref(plan, next)} className={`${buttonClass("filled", "lg")} shrink-0`}>
              <SparkleIcon />
              {t.plan.makeKmzh}
            </Link>
          </div>
        ) : (
          <p className="text-title3 font-bold text-accent">{t.plan.allDone}</p>
        )}
      </div>

      <LessonList key={plan.id} lessons={plan.lessons} onChange={(lessons) => changePlan({ lessons })} plan={plan} />

      <details className="group rounded-2xl">
        <summary className="flex min-h-11 cursor-pointer list-none items-center px-1 text-subhead font-semibold text-label-2 hover:text-label">
          {t.plan.edit}: {t.plan.name.toLowerCase()}, {t.plan.subject.toLowerCase()}, {t.common.grade(plan.grade)}
        </summary>
        <div className="mt-2 flex flex-col gap-4">
          <PlanSettings value={plan} onChange={changePlan} />
          <button type="button" onClick={removePlan} className={`${buttonClass("plain")} self-start text-red`}>
            <TrashIcon />
            {t.plan.deletePlan}
          </button>
        </div>
      </details>
      {error && <ErrorBox>{error}</ErrorBox>}
    </div>
  );
}

/** Название, предмет, класс и язык уроков — строками, как в форме ҚМЖ */
function PlanSettings({ value, onChange }: { value: PlanInput; onChange: (patch: Partial<PlanInput>) => void }) {
  const t = useT();
  return (
    <div className="divide-y divide-separator rounded-2xl border border-accent/25 bg-surface">
      <Row title={t.plan.name}>
        <input
          value={value.title}
          onChange={(e) => onChange({ title: e.target.value })}
          aria-label={t.plan.name}
          className="min-h-11 min-w-0 flex-1 rounded-lg bg-transparent px-2 text-right text-callout font-semibold text-accent outline-none focus:bg-fill"
        />
      </Row>
      <Row title={t.plan.subject}>
        <PopoverSelect
          inline
          alignRight
          ariaLabel={t.plan.subject}
          value={value.subject}
          onChange={(subject) => onChange({ subject })}
          options={subjectOrder.map((subject) => ({ value: subject, label: t.subjects[subject] }))}
        />
      </Row>
      <Row title={t.form.gradeLabel}>
        <PopoverSelect
          inline
          alignRight
          ariaLabel={t.form.gradeLabel}
          value={String(value.grade)}
          onChange={(grade) => onChange({ grade: Number(grade) })}
          options={grades.map((grade) => ({ value: String(grade), label: t.common.grade(grade) }))}
        />
      </Row>
      <Row title={t.plan.language}>
        <PopoverSelect
          inline
          alignRight
          ariaLabel={t.plan.language}
          value={value.language}
          onChange={(language) => onChange({ language })}
          options={[
            { value: "kk", label: "Қазақша" },
            { value: "ru", label: "Русский" },
          ]}
        />
      </Row>
    </div>
  );
}

function Row({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex min-h-12 items-center justify-between gap-3 pl-4 pr-2">
      <span className="shrink-0 text-subhead text-label-2">{title}</span>
      {children}
    </div>
  );
}

function ErrorBox({ children }: { children: ReactNode }) {
  return (
    <div role="alert" className="rounded-2xl bg-red/10 p-4 text-subhead text-red">
      {children}
    </div>
  );
}

/** Выбор файла КТП: кнопка или перетаскивание. Файл читает сервер (POST /api/plans/parse) */
function Upload({ onParsed }: { onParsed: (plan: PlanInput) => void }) {
  const t = useT();
  const input = useRef<HTMLInputElement>(null);
  const [reading, startReading] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [over, setOver] = useState(false);

  const send = (file: File) =>
    startReading(async () => {
      setError(null);
      if (!/\.(docx|xlsx)$/i.test(file.name)) {
        setError(t.errors.planFileType);
        return;
      }
      const form = new FormData();
      form.append("file", file);
      const response = await fetch("/api/plans/parse", { method: "POST", body: form }).catch(() => null);
      const data = await response?.json().catch(() => null);
      if (response?.ok && data?.plan) onParsed(data.plan);
      else setError(data?.error ?? t.form.netError);
    });

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        const file = e.dataTransfer.files[0];
        if (file && !reading) send(file);
      }}
      className={`flex flex-col items-center gap-4 rounded-3xl border-2 border-dashed px-6 py-12 text-center transition ${
        over ? "border-accent bg-accent/10" : "border-accent/30 bg-surface"
      }`}
    >
      <h2 className="text-title2 font-extrabold tracking-tight">{t.plan.uploadTitle}</h2>
      <p className="max-w-xl text-body text-label-2">{t.plan.uploadText}</p>
      <input
        ref={input}
        type="file"
        accept=".docx,.xlsx,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) send(file);
        }}
      />
      <Button size="lg" disabled={reading} onClick={() => input.current?.click()}>
        <SparkleIcon className={reading ? "animate-spin" : ""} />
        {reading ? t.plan.reading : t.plan.chooseFile}
      </Button>
      {!reading && <p className="text-subhead text-label-3">{t.plan.dropHint}</p>}
      {error && <ErrorBox>{error}</ErrorBox>}
    </div>
  );
}
