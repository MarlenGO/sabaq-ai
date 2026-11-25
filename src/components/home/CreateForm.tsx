"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { Language, Subject } from "@/types/topic-package";
import { deckTypeIcon, gameIcon, type CreateKind } from "@/data/catalog";
import { useT } from "@/i18n/client";
import { useStoredState } from "@/lib/stored-state";
import { useVoiceInput } from "@/lib/voice-input";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { LucideIcon } from "@/components/ui/LucideIcon";
import { ArrowLeftIcon, MicIcon, PencilIcon, SparkleIcon } from "@/components/ui/Icons";
import { PopoverSelect } from "@/components/ui/Popover";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { subjectColors } from "@/components/home/SubjectBadge";

type Mode = "ai" | "empty";
type LessonKind = Exclude<CreateKind, { type: "doc" }>;

interface Draft {
  topic: string;
  grade: number;
  language: Language;
  mode: Mode;
}

const emptyDraft: Draft = { topic: "", grade: 7, language: "kk", mode: "ai" };
/** Классы 6–11: сайт для средней и старшей школы */
const grades = [6, 7, 8, 9, 10, 11];

// Короткая форма создания презентации или игры: тема крупно, под ней одной строкой
// язык, класс и «AI / пусто», внизу кнопка. Открывается прямо в списке на странице
// предмета (SubjectMenu) и на отдельной странице /subject/<предмет>/<вид>.
// Черновик общий для всех видов (useStoredState): тему пишут один раз и могут
// переключаться между играми, не набирая её заново.
export function CreatePanel({ subject, kind, autoFocus = false }: { subject: Subject; kind: LessonKind; autoFocus?: boolean }) {
  const router = useRouter();
  const t = useT();
  const [stored, setDraft] = useStoredState("sabaq-create", emptyDraft);
  const merged: Draft = { ...emptyDraft, ...stored };
  // В старых черновиках мог остаться класс 1–5 — их больше нет в списке
  const draft: Draft = { ...merged, grade: grades.includes(merged.grade) ? merged.grade : 7 };
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
        // new=1 — только что созданный урок: «Артқа» спросит, оставить ли его в истории
        const fresh = data.created ? "&new=1" : "";
        router.push(isDeck ? `/lesson/${data.id}?tab=slides${fresh}` : `/lesson/${data.id}?game=${kind.id}${fresh}`);
        return;
      }
      setError(data?.error ?? t.form.netError);
    });

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (hasTopic && !loading) submit();
      }}
    >
      <div className="relative">
        <input
          value={draft.topic}
          onChange={(e) => update({ topic: e.target.value })}
          aria-label={t.form.topicLabel}
          placeholder={t.form.topicLabel}
          // Форма открылась по нажатию — сразу можно печатать тему
          autoFocus={autoFocus}
          className="h-13 w-full rounded-xl border border-accent/25 bg-surface pl-4 pr-13 text-body font-semibold outline-none transition placeholder:font-normal placeholder:text-label-3 focus:border-accent focus:ring-4 focus:ring-accent/20"
        />
        {voice.supported && (
          <button
            type="button"
            onClick={voice.listening ? voice.stop : voice.start}
            aria-label={voice.listening ? t.form.voiceStop : t.form.voiceStart}
            title={t.form.voiceStart}
            className={`absolute right-1.5 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-lg transition ${
              voice.listening ? "animate-pulse bg-red text-white" : "text-accent hover:bg-accent/12"
            }`}
          >
            <MicIcon />
          </button>
        )}
      </div>
      {voice.listening && <p className="text-subhead text-red">{t.form.listening}</p>}

      {/* Язык, класс и «AI / пусто» — небольшие переключатели в одну строку */}
      <div className="flex flex-wrap items-center gap-2">
        <PopoverSelect
          ariaLabel={t.form.contentLanguage}
          value={draft.language}
          onChange={(language) => update({ language })}
          options={[
            { value: "kk", label: "Қазақша" },
            { value: "ru", label: "Русский" },
          ]}
        />
        <PopoverSelect
          ariaLabel={t.form.gradeLabel}
          value={String(draft.grade)}
          onChange={(value) => update({ grade: Number(value) })}
          options={grades.map((grade) => ({ value: String(grade), label: t.common.grade(grade) }))}
        />
        <SegmentedControl
          ariaLabel={t.form.contentMode}
          value={draft.mode}
          onChange={(mode) => update({ mode })}
          options={[
            { value: "ai", label: t.form.modeAi, icon: <SparkleIcon className="size-4" /> },
            { value: "empty", label: t.form.modeEmpty, icon: <PencilIcon className="size-4" /> },
          ]}
        />
      </div>

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
      {error && (
        <div role="alert" className="rounded-2xl bg-red/10 p-4 text-subhead text-red">
          {error}
        </div>
      )}
    </form>
  );
}

// Отдельная страница создания (по прямой ссылке): заголовок вида и та же короткая форма
export function CreateForm({ subject, kind }: { subject: Subject; kind: LessonKind }) {
  const t = useT();
  const isDeck = kind.type === "deck";
  const title = isDeck ? t.deckTypes[kind.id].name : t.games[kind.id].title;
  const icon = isDeck ? deckTypeIcon[kind.id] : gameIcon[kind.id];

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
        <CreatePanel subject={subject} kind={kind} />
      </Card>
    </>
  );
}
