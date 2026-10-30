"use client";

import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import type { Language } from "@/types/topic-package";
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
  output: Output;
}

const emptyDraft: Draft = { topic: "", grade: 7, language: "kk", output: "slides" };

const grades = Array.from({ length: 11 }, (_, i) => i + 1);

const exampleTopics: Record<Language, string[]> = {
  kk: ["Ньютонның бірінші заңы", "Фотосинтез", "Абай Құнанбайұлы", "Жасуша құрылысы"],
  ru: ["Первый закон Ньютона", "Фотосинтез", "Абай Кунанбаев", "Строение клетки"],
};

// Пошаговая форма: каждый шаг с номером и понятным вопросом.
// Всё введённое сохраняется автоматически (см. useStoredState).
export function TopicForm() {
  const router = useRouter();
  const [draft, setDraft] = useStoredState("sabaq-draft", emptyDraft);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const update = (patch: Partial<Draft>) => {
    setDraft({ ...draft, ...patch });
    setError(null);
  };

  const voice = useVoiceInput(draft.language, (text) => update({ topic: text }));
  const hasTopic = draft.topic.trim().length >= 2;

  const submit = async () => {
    setLoading(true);
    setError(null);
    const response = await fetch("/api/lessons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic: draft.topic, grade: draft.grade, language: draft.language }),
    }).catch(() => null);
    const data = await response?.json().catch(() => null);
    if (response?.ok && data?.id) {
      router.push(`/lesson/${data.id}?tab=${draft.output === "slides" ? "slides" : "games"}`);
      return; // кнопка остаётся в состоянии «жасап жатырмын», пока открывается урок
    }
    setLoading(false);
    setError(data?.error ?? "Байланыс үзілді. Интернетті тексеріп, қайталап көріңіз.");
  };

  return (
    <Card className="p-5 sm:p-8">
      <form
        className="flex flex-col gap-8"
        onSubmit={(e) => {
          e.preventDefault();
          if (!loading) submit();
        }}
      >
        <Step n={1} title="Сабақтың тақырыбын жазыңыз">
          <div className="relative">
            <input
              value={draft.topic}
              onChange={(e) => update({ topic: e.target.value })}
              placeholder={exampleTopics[draft.language][0]}
              aria-label="Сабақтың тақырыбы"
              className="h-14 w-full rounded-2xl bg-fill pl-5 pr-16 text-body outline-none placeholder:text-label-3 focus:ring-4 focus:ring-accent/25"
            />
            {voice.supported && (
              <button
                type="button"
                onClick={voice.listening ? voice.stop : voice.start}
                aria-label={voice.listening ? "Тыңдауды тоқтату" : "Дауыспен айту"}
                title="Дауыспен айту"
                className={`absolute right-2 top-2 flex h-10 w-10 items-center justify-center rounded-xl transition ${
                  voice.listening ? "animate-pulse bg-red text-white" : "text-accent hover:bg-accent/12"
                }`}
              >
                <MicIcon />
              </button>
            )}
          </div>
          {voice.listening && <p className="mt-2 text-subhead text-red">Тыңдап тұрмын… тақырыпты айтыңыз</p>}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-footnote text-label-2">Мысалы:</span>
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

        <Step n={2} title="Сынып пен тілді таңдаңыз">
          <div role="radiogroup" aria-label="Сынып" className="flex flex-wrap gap-2">
            {grades.map((grade) => {
              const selected = grade === draft.grade;
              return (
                <button
                  key={grade}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  aria-label={`${grade}-сынып`}
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
              ariaLabel="Тіл"
              value={draft.language}
              onChange={(language) => update({ language })}
              options={[
                { value: "kk", label: "Қазақша" },
                { value: "ru", label: "Русский" },
              ]}
            />
          </div>
        </Step>

        <Step n={3} title="Не жасаймыз?">
          <div role="radiogroup" aria-label="Нәтиже" className="grid gap-3 sm:grid-cols-2">
            <OutputTile
              selected={draft.output === "slides"}
              onSelect={() => update({ output: "slides" })}
              icon={<SlidesIcon />}
              tint="bg-accent"
              title="Презентация"
              text="Дайын слайдтар, PowerPoint-ке жүктеуге болады"
            />
            <OutputTile
              selected={draft.output === "game"}
              onSelect={() => update({ output: "game" })}
              icon={<GameIcon />}
              tint="bg-purple"
              title="Ойын"
              text="Викторина, «жұбын тап» — оқушылар телефоннан ойнайды"
            />
          </div>
        </Step>

        <div className="flex flex-col gap-3">
          <Button type="submit" size="lg" disabled={!hasTopic || loading} className="w-full">
            <SparkleIcon className={loading ? "animate-spin" : ""} />
            {loading
              ? "Жасап жатырмын… 10–20 секунд"
              : draft.output === "slides"
                ? "Дайын слайд жасау"
                : "Дайын ойын жасау"}
          </Button>
          <p className="text-center text-footnote text-label-2">
            {hasTopic
              ? "Барлығы автоматты түрде сақталады — бетті жауып қойсаңыз да жоғалмайды"
              : "Бастау үшін тақырыпты жазыңыз немесе мысалды басыңыз"}
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
