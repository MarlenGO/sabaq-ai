"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { topicPackageSchema, type TopicPackage } from "@/types/topic-package";
import { languageNames, subjectNames } from "@/lib/labels";
import { getTemplate } from "@/slides/templates";
import { Card } from "@/components/ui/Card";
import { ArrowLeftIcon, CheckIcon, EyeIcon, GameIcon, PencilIcon, SlidesIcon } from "@/components/ui/Icons";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { PackageEditor } from "@/components/slides/PackageEditor";
import { SlidePreview } from "@/components/slides/SlidePreview";
import { DownloadPptxButton } from "@/components/slides/DownloadPptxButton";
import { TemplatePicker } from "@/components/slides/TemplatePicker";
import { GamesPanel } from "./GamesPanel";

type Tab = "slides" | "games";
type Mode = "edit" | "preview";
type SaveState = "saved" | "saving" | "invalid" | "error";

const SAVE_DELAY_MS = 800;

// Рабочее место урока: вкладки «Презентация / Ойындар» и переключатель
// «Конструктор / Алдын ала көру». Правки сохраняются на сервер сами
// через секунду после последнего изменения.
export function LessonWorkspace({ initial, initialTab }: { initial: TopicPackage; initialTab: Tab }) {
  const [lesson, setLesson] = useState(initial);
  const [tab, setTab] = useState<Tab>(initialTab);
  const [mode, setMode] = useState<Mode>("preview");
  const [save, setSave] = useState<SaveState>("saved");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Предупреждение, если закрыть вкладку до сохранения
  useEffect(() => {
    if (save === "saved") return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [save]);

  const update = (next: TopicPackage) => {
    setLesson(next);
    clearTimeout(timer.current);
    // Пустые поля сервер не примет, поэтому ждём, пока учитель их заполнит
    if (!topicPackageSchema.safeParse(next).success) return setSave("invalid");
    setSave("saving");
    timer.current = setTimeout(async () => {
      const response = await fetch(`/api/lessons/${next.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      }).catch(() => null);
      setSave(response?.ok ? "saved" : "error");
    }, SAVE_DELAY_MS);
  };

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-24 pt-6">
      <Link href="/" className="inline-flex items-center gap-1.5 text-subhead font-medium text-accent hover:opacity-70">
        <ArrowLeftIcon />
        Басты бет
      </Link>

      <header className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-large font-bold tracking-tight">{lesson.topic}</h1>
          <p className="mt-1 text-subhead text-label-2">
            {subjectNames[lesson.subject]} · {lesson.grade}-сынып · {languageNames[lesson.language]}
          </p>
        </div>
        <SaveStatus state={save} />
      </header>

      {lesson.source === "demo" && (
        <Card className="mt-4 bg-orange/12 p-4 text-subhead shadow-none">
          <b>Демо-режим.</b> AI кілті әлі қосылмаған, сондықтан мазмұны — мысал (Ньютон заңы). Кілтті қосқаннан
          кейін жаңа тақырыптар үшін нағыз мазмұн жасалады.
        </Card>
      )}

      <div className="sticky top-14 z-40 -mx-4 mt-6 flex flex-wrap items-center justify-between gap-3 border-b border-separator bg-bg/85 px-4 py-3 backdrop-blur-xl">
        <SegmentedControl
          size="lg"
          ariaLabel="Бөлім"
          value={tab}
          onChange={setTab}
          options={[
            { value: "slides", label: "Презентация", icon: <SlidesIcon /> },
            { value: "games", label: "Ойындар", icon: <GameIcon /> },
          ]}
        />
        <SegmentedControl
          size="lg"
          ariaLabel="Режим"
          value={mode}
          onChange={setMode}
          options={[
            { value: "edit", label: "Конструктор", icon: <PencilIcon /> },
            { value: "preview", label: "Алдын ала көру", icon: <EyeIcon /> },
          ]}
        />
      </div>

      <div className="mt-6">
        {tab === "slides" ? (
          <div className="flex flex-col gap-6">
            {mode === "edit" ? (
              <>
                <Card className="p-4 sm:p-6">
                  <PackageEditor pkg={lesson} onChange={update} />
                </Card>
                <DownloadPptxButton pkg={lesson} />
              </>
            ) : (
              <>
                <section>
                  <h2 className="mb-3 text-title3 font-semibold">Шаблонды таңдаңыз</h2>
                  <TemplatePicker
                    pkg={lesson}
                    value={getTemplate(lesson.templateId, lesson.subject).id}
                    onChange={(templateId) => update({ ...lesson, templateId })}
                  />
                </section>
                <DownloadPptxButton pkg={lesson} />
                <SlidePreview pkg={lesson} />
              </>
            )}
          </div>
        ) : (
          <GamesPanel
            lesson={lesson}
            mode={mode}
            onChange={update}
            onJeopardyReady={(jeopardy, updatedAt) => setLesson({ ...lesson, jeopardy, updatedAt })}
          />
        )}
      </div>
    </main>
  );
}

function SaveStatus({ state }: { state: SaveState }) {
  const view: Record<SaveState, { text: string; className: string }> = {
    saved: { text: "Сақталды", className: "text-green" },
    saving: { text: "Сақталуда…", className: "text-label-2" },
    invalid: { text: "Бос өрістерді толтырыңыз — содан кейін өзі сақталады", className: "text-orange" },
    error: { text: "Сақталмады. Интернетті тексеріңіз", className: "text-red" },
  };
  const { text, className } = view[state];
  return (
    <p role="status" className={`flex items-center gap-1.5 text-subhead font-medium ${className}`}>
      {state === "saved" && <CheckIcon />}
      {text}
    </p>
  );
}
