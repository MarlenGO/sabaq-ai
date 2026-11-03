"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type ReactNode } from "react";
import type { Language, Subject } from "@/types/topic-package";
import { subjectOrder } from "@/lib/labels";
import { useT } from "@/i18n/client";
import { useStoredState } from "@/lib/stored-state";
import { useVoiceInput } from "@/lib/voice-input";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { GameIcon, MicIcon, SlidesIcon, SparkleIcon } from "@/components/ui/Icons";
import { SegmentedControl } from "@/components/ui/SegmentedControl";

type Output = "slides" | "game";

interface Draft {
  topic: string;
  grade: number;
  language: Language;
  subject: Subject;
  output: Output;
}

const emptyDraft: Draft = { topic: "", grade: 7, language: "kk", subject: "physics", output: "slides" };

const grades = Array.from({ length: 11 }, (_, i) => i + 1);

const exampleTopics: Record<Language, string[]> = {
  kk: ["Ньютонның бірінші заңы", "Фотосинтез", "Абай Құнанбайұлы", "Жасуша құрылысы"],
  ru: ["Первый закон Ньютона", "Фотосинтез", "Абай Кунанбаев", "Строение клетки"],
};

// Пошаговая форма: каждый шаг с номером и понятным вопросом.
// Всё введённое сохраняется автоматически (см. useStoredState).
export function TopicForm() {
  const router = useRouter();
  const t = useT();
  const [draft, setDraft] = useStoredState("sabaq-draft", emptyDraft);
  // Переход на урок — «переход» (transition): кнопка крутится, пока идёт запрос
  // и открывается урок, а потом сама возвращается в обычный вид. Раньше тут был
  // флаг loading, и он «застревал»: Next.js сохраняет главную страницу целиком,
  // когда уходишь на урок, и при возврате кнопка всё ещё крутилась.
  const [loading, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const update = (patch: Partial<Draft>) => {
    setDraft({ ...draft, ...patch });
    setError(null);
  };

  const voice = useVoiceInput(draft.language, (text) => update({ topic: text }));
  const hasTopic = draft.topic.trim().length >= 2;

  const submit = () =>
    startTransition(async () => {
      setError(null);
      const { topic, grade, language, subject } = draft;
      const response = await fetch("/api/lessons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, grade, language, subject }),
      }).catch(() => null);
      const data = await response?.json().catch(() => null);
      if (response?.ok && data?.id) {
        router.push(`/lesson/${data.id}?tab=${draft.output === "slides" ? "slides" : "games"}`);
        return;
      }
      setError(data?.error ?? t.form.netError);
    });

  return (
    <Card className="p-5 sm:p-8">
      <form
        className="flex flex-col gap-8"
        onSubmit={(e) => {
          e.preventDefault();
          if (!loading) submit();
        }}
      >
        <Step n={1} title={t.form.step1}>
          <div className="relative">
            <input
              value={draft.topic}
              onChange={(e) => update({ topic: e.target.value })}
              placeholder={exampleTopics[draft.language][0]}
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
            {exampleTopics[draft.language].map((topic) => (
              <button
                key={topic}
                type="button"
                onClick={() => update({ topic })}
                className="rounded-full bg-accent/10 px-3.5 py-1.5 text-footnote font-medium text-accent transition hover:bg-accent/20"
              >
                {topic}
              </button>
            ))}
          </div>
        </Step>

        <Step n={2} title={t.form.step2}>
          <div role="radiogroup" aria-label={t.form.subject} className="flex flex-wrap gap-2">
            {subjectOrder.map((subject) => {
              const selected = subject === draft.subject;
              return (
                <button
                  key={subject}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => update({ subject })}
                  className={`h-11 rounded-full px-4 text-callout font-semibold transition ${
                    selected ? "bg-accent text-white shadow-sm" : "bg-fill text-label hover:bg-accent/15"
                  }`}
                >
                  {t.subjects[subject]}
                </button>
              );
            })}
          </div>
        </Step>

        <Step n={3} title={t.form.step3}>
          <div role="radiogroup" aria-label={t.form.gradeLabel} className="flex flex-wrap gap-2">
            {grades.map((grade) => {
              const selected = grade === draft.grade;
              return (
                <button
                  key={grade}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  aria-label={t.common.grade(grade)}
                  onClick={() => update({ grade })}
                  className={`h-11 min-w-11 rounded-full px-3 text-callout font-semibold transition ${
                    selected ? "bg-accent text-white shadow-sm" : "bg-fill text-label hover:bg-accent/15"
                  }`}
                >
                  {grade}
                </button>
              );
            })}
          </div>
          <div className="mt-4">
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
          </div>
        </Step>

        <Step n={4} title={t.form.step4}>
          <div role="radiogroup" aria-label={t.form.output} className="grid gap-3 sm:grid-cols-2">
            <OutputTile
              selected={draft.output === "slides"}
              onSelect={() => update({ output: "slides" })}
              icon={<SlidesIcon />}
              tint="bg-accent"
              title={t.form.slidesTitle}
              text={t.form.slidesText}
            />
            <OutputTile
              selected={draft.output === "game"}
              onSelect={() => update({ output: "game" })}
              icon={<GameIcon />}
              tint="bg-purple"
              title={t.form.gameTitle}
              text={t.form.gameText}
            />
          </div>
        </Step>

        <div className="flex flex-col gap-3">
          <Button type="submit" size="lg" disabled={!hasTopic || loading} className="w-full">
            <SparkleIcon className={loading ? "animate-spin" : ""} />
            {loading
              ? t.form.working
              : draft.output === "slides"
                ? t.form.makeSlides
                : t.form.makeGame}
          </Button>
          <p className="text-center text-footnote text-label-2">
            {hasTopic
              ? t.form.autosaved
              : t.form.startHint}
          </p>
          {error && (
            <div role="alert" className="rounded-2xl bg-red/10 p-4 text-subhead text-red">
              {error}
            </div>
          )}
        </div>
      </form>
    </Card>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <fieldset>
      <legend className="mb-3 flex items-center gap-3 text-title3 font-semibold">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-callout font-bold text-white">
          {n}
        </span>
        {title}
      </legend>
      {children}
    </fieldset>
  );
}

function OutputTile(props: {
  selected: boolean;
  onSelect: () => void;
  icon: ReactNode;
  tint: string;
  title: string;
  text: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={props.selected}
      onClick={props.onSelect}
      className={`flex items-start gap-4 rounded-2xl border-2 p-4 text-left transition ${
        props.selected ? "border-accent bg-accent/6" : "border-transparent bg-fill hover:border-separator"
      }`}
    >
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white ${props.tint}`}>
        {props.icon}
      </span>
      <span>
        <span className="block text-body font-semibold">{props.title}</span>
        <span className="mt-0.5 block text-footnote text-label-2">{props.text}</span>
      </span>
    </button>
  );
}
