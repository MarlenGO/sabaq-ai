"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type ReactNode } from "react";
import type { DeckType, Language, Subject } from "@/types/topic-package";
import { subjectOrder } from "@/lib/labels";
import { useT } from "@/i18n/client";
import { useStoredState } from "@/lib/stored-state";
import { useVoiceInput } from "@/lib/voice-input";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ArrowLeftIcon, ChevronRightIcon, GameIcon, MicIcon, PencilIcon, SlidesIcon, SparkleIcon } from "@/components/ui/Icons";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { DeckTypePicker } from "@/components/slides/DeckTypePicker";

type Output = "slides" | "game";
type Mode = "ai" | "empty";
type Step = 1 | 2 | 3;

interface Draft {
  topic: string;
  grade: number;
  language: Language;
  subject: Subject;
  output: Output;
  mode: Mode;
  deckType: DeckType;
}

const emptyDraft: Draft = {
  topic: "",
  grade: 7,
  language: "kk",
  subject: "physics",
  output: "slides",
  mode: "ai",
  deckType: "lesson",
};

const grades = Array.from({ length: 11 }, (_, i) => i + 1);

const exampleTopics: Record<Language, string[]> = {
  kk: ["Ньютонның бірінші заңы", "Фотосинтез", "Абай Құнанбайұлы", "Жасуша құрылысы"],
  ru: ["Первый закон Ньютона", "Фотосинтез", "Абай Кунанбаев", "Строение клетки"],
};

// Мастер из трёх шагов: на экране только один вопрос, внизу «Артқа / Келесі».
// Так учителю не нужно разбираться в двадцати кнопках сразу.
// Всё введённое сохраняется автоматически (см. useStoredState).
export function TopicForm() {
  const router = useRouter();
  const t = useT();
  // Черновик из старой версии сайта мог сохраниться без новых полей — дополняем
  const [stored, setDraft] = useStoredState("sabaq-draft", emptyDraft);
  const draft: Draft = { ...emptyDraft, ...stored };
  const [step, setStep] = useState<Step>(1);
  // Переход на урок — «переход» (transition): кнопка крутится, пока идёт запрос
  // и открывается урок, а потом сама возвращается в обычный вид. Флаг loading
  // «застревал»: Next.js сохраняет главную страницу, когда уходишь на урок.
  const [loading, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const update = (patch: Partial<Draft>) => {
    setDraft({ ...draft, ...patch });
    setError(null);
  };

  const voice = useVoiceInput(draft.language, (text) => update({ topic: text }));
  const hasTopic = draft.topic.trim().length >= 2;
  const canOpen = (target: Step) => target === 1 || hasTopic;

  const submit = () =>
    startTransition(async () => {
      setError(null);
      const { topic, grade, language, subject, mode, output } = draft;
      // Вид презентации важен только для презентации; игры берут вопросы урока
      const deckType = output === "slides" ? draft.deckType : "lesson";
      const response = await fetch("/api/lessons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, grade, language, subject, mode, deckType }),
      }).catch(() => null);
      const data = await response?.json().catch(() => null);
      if (response?.ok && data?.id) {
        router.push(`/lesson/${data.id}?tab=${output === "slides" ? "slides" : "games"}`);
        return;
      }
      setError(data?.error ?? t.form.netError);
    });

  const steps: { n: Step; label: string }[] = [
    { n: 1, label: t.form.stepTopic },
    { n: 2, label: t.form.stepSubject },
    { n: 3, label: t.form.stepOutput },
  ];

  return (
    <Card className="p-5 sm:p-8">
      {/* Шаги сверху: видно, где мы, и можно вернуться к любому пройденному */}
      <nav aria-label={t.form.stepOf(step, 3)} className="mb-6 grid grid-cols-3 gap-2">
        {steps.map(({ n, label }) => {
          const current = n === step;
          const done = n < step;
          return (
            <button
              key={n}
              type="button"
              disabled={!canOpen(n)}
              onClick={() => setStep(n)}
              aria-current={current ? "step" : undefined}
              className="flex flex-col gap-2 text-left disabled:opacity-40"
            >
              <span className={`h-1.5 rounded-full transition ${current || done ? "bg-accent" : "bg-fill"}`} />
              <span className="flex items-center gap-2">
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-footnote font-bold ${
                    current || done ? "bg-accent text-white" : "bg-fill text-label-2"
                  }`}
                >
                  {n}
                </span>
                <span className={`hidden text-subhead font-semibold sm:inline ${current ? "text-label" : "text-label-2"}`}>
                  {label}
                </span>
              </span>
            </button>
          );
        })}
      </nav>

      {/* Что уже выбрано — коротко одной строкой */}
      {step > 1 && (
        <p className="mb-5 rounded-2xl bg-fill px-4 py-3 text-subhead">
          <b>{draft.topic}</b>
          {step > 2 && (
            <span className="text-label-2">
              {" "}
              · {t.subjects[draft.subject]} · {t.common.grade(draft.grade)} · {t.languages[draft.language]}
            </span>
          )}
        </p>
      )}

      <form
        className="flex flex-col gap-8"
        onSubmit={(e) => {
          e.preventDefault();
          if (step < 3) {
            if (hasTopic) setStep((step + 1) as Step);
          } else if (!loading) submit();
        }}
      >
        {step === 1 && (
          <>
            <Section title={t.form.step1}>
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
            </Section>

            <Section title={t.form.contentLanguage}>
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
            </Section>
          </>
        )}

        {step === 2 && (
          <>
            <Section title={t.form.step2}>
              <div role="radiogroup" aria-label={t.form.subject} className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                {subjectOrder.map((subject) => (
                  <Choice key={subject} selected={subject === draft.subject} onSelect={() => update({ subject })}>
                    {t.subjects[subject]}
                  </Choice>
                ))}
              </div>
            </Section>

            <Section title={t.form.gradeLabel}>
              <div role="radiogroup" aria-label={t.form.gradeLabel} className="grid grid-cols-6 gap-2 sm:grid-cols-11">
                {grades.map((grade) => (
                  <Choice
                    key={grade}
                    selected={grade === draft.grade}
                    onSelect={() => update({ grade })}
                    label={t.common.grade(grade)}
                  >
                    {grade}
                  </Choice>
                ))}
              </div>
            </Section>
          </>
        )}

        {step === 3 && (
          <>
            <Section title={t.form.step4}>
              <div role="radiogroup" aria-label={t.form.output} className="grid gap-3 sm:grid-cols-2">
                <Tile
                  selected={draft.output === "slides"}
                  onSelect={() => update({ output: "slides" })}
                  icon={<SlidesIcon />}
                  tint="bg-accent"
                  title={t.form.slidesTitle}
                  text={t.form.slidesText}
                />
                <Tile
                  selected={draft.output === "game"}
                  onSelect={() => update({ output: "game" })}
                  icon={<GameIcon />}
                  tint="bg-purple"
                  title={t.form.gameTitle}
                  text={t.form.gameText}
                />
              </div>
            </Section>

            {draft.output === "slides" && (
              <Section title={t.form.deckType}>
                <DeckTypePicker value={draft.deckType} onChange={(deckType) => update({ deckType })} />
              </Section>
            )}

            <Section title={t.form.contentMode}>
              <div role="radiogroup" aria-label={t.form.contentMode} className="grid gap-3 sm:grid-cols-2">
                <Tile
                  selected={draft.mode === "ai"}
                  onSelect={() => update({ mode: "ai" })}
                  icon={<SparkleIcon />}
                  tint="bg-indigo"
                  title={t.form.modeAi}
                  text={t.form.modeAiHint}
                />
                <Tile
                  selected={draft.mode === "empty"}
                  onSelect={() => update({ mode: "empty" })}
                  icon={<PencilIcon />}
                  tint="bg-teal"
                  title={t.form.modeEmpty}
                  text={t.form.modeEmptyHint}
                />
              </div>
            </Section>
          </>
        )}

        <div className="flex flex-col gap-3">
          <div className="flex gap-3">
            {step > 1 && (
              <Button type="button" variant="tinted" size="lg" onClick={() => setStep((step - 1) as Step)}>
                <ArrowLeftIcon />
                {t.form.back}
              </Button>
            )}
            {step < 3 ? (
              <Button type="submit" size="lg" disabled={!hasTopic} className="flex-1">
                {t.form.next}
                <ChevronRightIcon />
              </Button>
            ) : (
              <Button type="submit" size="lg" disabled={!hasTopic || loading} className="flex-1">
                <SparkleIcon className={loading ? "animate-spin" : ""} />
                {loading
                  ? draft.mode === "empty"
                    ? t.form.opening
                    : t.form.working
                  : draft.mode === "empty"
                    ? t.form.makeEmpty
                    : draft.output === "slides"
                      ? t.form.makeSlides
                      : t.form.makeGame}
              </Button>
            )}
          </div>
          <p className="text-center text-footnote text-label-2">{hasTopic ? t.form.autosaved : t.form.startHint}</p>
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

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset>
      <legend className="mb-3 text-title3 font-semibold">{title}</legend>
      {children}
    </fieldset>
  );
}

/** Одна кнопка выбора (предмет, класс): одинакового размера в сетке */
function Choice(props: { selected: boolean; onSelect: () => void; children: ReactNode; label?: string }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={props.selected}
      aria-label={props.label}
      onClick={props.onSelect}
      className={`flex min-h-12 items-center justify-center rounded-xl px-2 text-center text-callout font-semibold transition ${
        props.selected ? "bg-accent text-white shadow-sm" : "bg-fill text-label hover:bg-accent/15"
      }`}
    >
      {props.children}
    </button>
  );
}

function Tile(props: { selected: boolean; onSelect: () => void; icon: ReactNode; tint: string; title: string; text: string }) {
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
