"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition, type ReactNode } from "react";
import type { Language, Subject } from "@/types/topic-package";
import { deckTypeIcon, exampleTopics, gameIcon, type CreateKind } from "@/data/catalog";
import { useT } from "@/i18n/client";
import { useStoredState } from "@/lib/stored-state";
import { useVoiceInput } from "@/lib/voice-input";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
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
}

const emptyDraft: Draft = { topic: "", grade: 7, language: "kk", mode: "ai" };
const grades = Array.from({ length: 11 }, (_, i) => i + 1);

// Одна простая форма: тема, язык, класс, «AI или пусто». Предмет и вид
// выбраны на прошлых страницах. Всё введённое сохраняется само (useStoredState).
export function CreateForm({ subject, kind }: { subject: Subject; kind: CreateKind }) {
  const router = useRouter();
  const t = useT();
  const [stored, setDraft] = useStoredState("sabaq-create", emptyDraft);
  const draft: Draft = { ...emptyDraft, ...stored };
  // useTransition, а не флаг loading: страница остаётся жить после перехода на урок
  const [loading, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const update = (patch: Partial<Draft>) => {
    setDraft({ ...draft, ...patch });
    setError(null);
  };
  const voice = useVoiceInput(draft.language, (text) => update({ topic: text }));
  const hasTopic = draft.topic.trim().length >= 2;

  const isDeck = kind.type === "deck";
  const title = isDeck ? t.deckTypes[kind.id].name : t.games[kind.id].title;
  const icon = isDeck ? deckTypeIcon[kind.id] : gameIcon[kind.id];

  const submit = () =>
    startTransition(async () => {
      setError(null);
      const { topic, grade, language, mode } = draft;
      // Игры берут вопросы урока, поэтому для них вид — обычный «урок»
      const deckType = isDeck ? kind.id : "lesson";
      const response = await fetch("/api/lessons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, grade, language, subject, mode, deckType }),
      }).catch(() => null);
      const data = await response?.json().catch(() => null);
      if (response?.ok && data?.id) {
        router.push(isDeck ? `/lesson/${data.id}?tab=slides` : `/lesson/${data.id}?game=${kind.id}`);
        return;
      }
      setError(data?.error ?? t.form.netError);
    });

  return (
    <>
      <Link
        href={`/subject/${subject}`}
        className="inline-flex h-11 items-center gap-1.5 rounded-full pr-3 text-subhead font-semibold text-accent hover:opacity-70"
      >
        <ArrowLeftIcon />
        {t.subjects[subject]}
      </Link>

      <div className="mt-2 flex items-center gap-4">
        <span
          style={subjectColors(subject)}
          className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-(--tile) text-(--ink)"
        >
          <LucideIcon svg={icon} className="size-8 [&>svg]:stroke-[1.6]" />
        </span>
        <div>
          <p className="text-subhead text-label-2">{isDeck ? t.subject.presentation : t.subject.game}</p>
          <h1 className="text-title1 font-extrabold tracking-tight">{title}</h1>
        </div>
      </div>

      <Card className="mt-6 rounded-3xl p-5 sm:p-7">
        <form
          className="flex flex-col gap-7"
          onSubmit={(e) => {
            e.preventDefault();
            if (hasTopic && !loading) submit();
          }}
        >
          <Field title={t.form.step1}>
            <div className="relative">
              <input
                value={draft.topic}
                onChange={(e) => update({ topic: e.target.value })}
                placeholder={exampleTopics[subject][draft.language][0]}
                aria-label={t.form.topicLabel}
                className="h-14 w-full rounded-2xl bg-fill pl-5 pr-16 text-body outline-none placeholder:text-label-3 focus:ring-4 focus:ring-accent/25"
              />
              {voice.supported && (
                <button
                  type="button"
                  onClick={voice.listening ? voice.stop : voice.start}
                  aria-label={voice.listening ? t.form.voiceStop : t.form.voiceStart}
                  title={t.form.voiceStart}
                  className={`absolute right-2 top-2 flex h-10 w-10 items-center justify-center rounded-xl transition ${
                    voice.listening ? "animate-pulse bg-red text-white" : "text-accent hover:bg-accent/12"
                  }`}
                >
                  <MicIcon />
                </button>
              )}
            </div>
            {voice.listening && <p className="mt-2 text-subhead text-red">{t.form.listening}</p>}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-footnote text-label-2">{t.form.examples}</span>
              {exampleTopics[subject][draft.language].map((topic) => (
                <button
                  key={topic}
                  type="button"
                  onClick={() => update({ topic })}
                  className="rounded-full bg-fill px-3.5 py-1.5 text-footnote font-medium text-label transition hover:bg-accent/15"
                >
                  {topic}
                </button>
              ))}
            </div>
          </Field>

          <Field title={t.form.contentLanguage}>
            <SegmentedControl
              size="lg"
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
            <div role="radiogroup" aria-label={t.form.gradeLabel} className="grid grid-cols-6 gap-2 sm:grid-cols-11">
              {grades.map((grade) => (
                <button
                  key={grade}
                  type="button"
                  role="radio"
                  aria-checked={grade === draft.grade}
                  aria-label={t.common.grade(grade)}
                  onClick={() => update({ grade })}
                  className={`flex min-h-12 items-center justify-center rounded-xl text-callout font-semibold transition ${
                    grade === draft.grade ? "bg-accent text-white" : "bg-fill text-label hover:bg-accent/15"
                  }`}
                >
                  {grade}
                </button>
              ))}
            </div>
          </Field>

          <Field title={t.form.contentMode}>
            <div role="radiogroup" aria-label={t.form.contentMode} className="grid gap-3 sm:grid-cols-2">
              <ModeTile
                selected={draft.mode === "ai"}
                onSelect={() => update({ mode: "ai" })}
                icon={<SparkleIcon />}
                title={t.form.modeAi}
                text={t.form.modeAiHint}
              />
              <ModeTile
                selected={draft.mode === "empty"}
                onSelect={() => update({ mode: "empty" })}
                icon={<PencilIcon />}
                title={t.form.modeEmpty}
                text={t.form.modeEmptyHint}
              />
            </div>
          </Field>

          <div className="flex flex-col gap-3">
            <Button type="submit" size="lg" disabled={!hasTopic || loading}>
              <SparkleIcon className={loading ? "animate-spin" : ""} />
              {loading
                ? draft.mode === "empty"
                  ? t.form.opening
                  : t.form.working
                : draft.mode === "empty"
                  ? t.form.makeEmpty
                  : isDeck
                    ? t.form.makeSlides
                    : t.form.makeGame}
            </Button>
            <p className="text-center text-footnote text-label-2">{hasTopic ? t.form.autosaved : t.form.startHint}</p>
            {error && (
              <div role="alert" className="rounded-2xl bg-red/10 p-4 text-subhead text-red">
                {error}
              </div>
            )}
          </div>
        </form>
      </Card>
    </>
  );
}

function Field({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset>
      <legend className="mb-3 text-title3 font-semibold">{title}</legend>
      {children}
    </fieldset>
  );
}

function ModeTile(props: { selected: boolean; onSelect: () => void; icon: ReactNode; title: string; text: string }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={props.selected}
      onClick={props.onSelect}
      className={`flex items-start gap-3 rounded-2xl border-2 p-4 text-left transition ${
        props.selected ? "border-accent bg-accent/6" : "border-transparent bg-fill hover:border-separator"
      }`}
    >
      <span className={`mt-0.5 ${props.selected ? "text-accent" : "text-label-2"}`}>{props.icon}</span>
      <span>
        <span className="block text-body font-semibold">{props.title}</span>
        <span className="mt-0.5 block text-footnote text-label-2">{props.text}</span>
      </span>
    </button>
  );
}
