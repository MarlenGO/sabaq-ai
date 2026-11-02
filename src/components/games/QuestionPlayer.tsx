"use client";

import { useEffect, useState } from "react";
import type { QuizQuestion } from "@/types/topic-package";
import { schoolGrade } from "@/lib/labels";
import { Button } from "@/components/ui/Button";
import { CheckIcon, XIcon } from "@/components/ui/Icons";
import { RemoteImage } from "@/components/ui/RemoteImage";
import { EmptyGame } from "./GameStage";

// Один плеер на два шаблона:
//   test — спокойно, по одному вопросу, в конце оценка;
//   quiz — для проектора: таймер, цветные плитки, очки за скорость.

const QUIZ_SECONDS = 20;
const letters = ["A", "B", "C", "D"];
const tileColors = ["bg-accent", "bg-orange", "bg-green", "bg-purple"];

export function QuestionPlayer({ questions, variant }: { questions: QuizQuestion[]; variant: "test" | "quiz" }) {
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);
  const [points, setPoints] = useState(0);
  const [timeLeft, setTimeLeft] = useState(QUIZ_SECONDS);
  const [finished, setFinished] = useState(false);

  const timed = variant === "quiz";
  const timedOut = timed && timeLeft <= 0 && picked === null;
  const revealed = picked !== null || timedOut;

  useEffect(() => {
    if (!timed || revealed || finished) return;
    const timer = setInterval(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearInterval(timer);
  }, [timed, revealed, finished, index]);

  if (questions.length === 0) return <EmptyGame text="Сұрақтар жоқ. «Конструктор» бөлімінде қосыңыз." />;

  const restart = () => {
    setIndex(0);
    setPicked(null);
    setCorrect(0);
    setPoints(0);
    setTimeLeft(QUIZ_SECONDS);
    setFinished(false);
  };

  if (finished) {
    return (
      <div className="flex flex-col items-center gap-3 py-10 text-center">
        <p className="text-title3 text-label-2">Ойын аяқталды!</p>
        {timed ? (
          <p className="text-display font-bold text-accent">{points} ұпай</p>
        ) : (
          <p className="text-display font-bold text-accent">Баға: {schoolGrade(correct, questions.length)}</p>
        )}
        <p className="text-body text-label-2">
          {questions.length} сұрақтың {correct}-іне дұрыс жауап берілді
        </p>
        <Button size="lg" onClick={restart} className="mt-4">
          Қайта бастау
        </Button>
      </div>
    );
  }

  const q = questions[Math.min(index, questions.length - 1)];
  const isLast = index >= questions.length - 1;

  const pick = (option: number) => {
    if (revealed) return;
    setPicked(option);
    if (option === q.correctIndex) {
      setCorrect((c) => c + 1);
      // Быстрый ответ — больше очков: от 500 до 1000
      if (timed) setPoints((p) => p + 500 + Math.round((500 * timeLeft) / QUIZ_SECONDS));
    }
  };

  const next = () => {
    if (isLast) return setFinished(true);
    setIndex(index + 1);
    setPicked(null);
    setTimeLeft(QUIZ_SECONDS);
  };

  return (
    <div className="flex flex-col gap-5 pt-10">
      <div className="flex items-center gap-4">
        <span className="text-subhead font-semibold text-label-2">
          {index + 1} / {questions.length}
        </span>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-fill">
          <div
            className={`h-full rounded-full transition-all duration-1000 ease-linear ${timed ? "bg-orange" : "bg-accent"}`}
            style={{
              width: timed ? `${(Math.max(timeLeft, 0) / QUIZ_SECONDS) * 100}%` : `${((index + 1) / questions.length) * 100}%`,
            }}
          />
        </div>
        {timed && (
          <span className="min-w-16 text-right text-subhead font-semibold tabular-nums">
            {Math.max(timeLeft, 0)} с · {points}
          </span>
        )}
      </div>

      <h3 className={`font-bold ${timed ? "py-4 text-center text-large" : "text-title2"}`}>{q.question}</h3>
      {q.image && <RemoteImage image={q.image} className={timed ? "max-h-[38vh]" : "max-h-72"} />}

      <div className={`grid gap-3 ${timed ? "sm:grid-cols-2" : ""}`}>
        {q.options.map((option, i) => {
          const isCorrect = i === q.correctIndex;
          const isPicked = i === picked;
          const state = !revealed ? "idle" : isCorrect ? "correct" : isPicked ? "wrong" : "dim";

          if (timed) {
            return (
              <button
                key={i}
                type="button"
                onClick={() => pick(i)}
                className={`flex min-h-20 items-center gap-3 rounded-2xl px-5 py-4 text-left text-title3 font-semibold text-white transition ${
                  tileColors[i]
                } ${state === "dim" || state === "wrong" ? "opacity-30" : ""} ${state === "idle" ? "hover:brightness-110 active:scale-[0.98]" : ""}`}
              >
                <span className="text-title2 opacity-70">{letters[i]}</span>
                <span className="flex-1">{option}</span>
                {state === "correct" && <CheckIcon className="h-8 w-8" />}
              </button>
            );
          }

          return (
            <button
              key={i}
              type="button"
              onClick={() => pick(i)}
              className={`flex items-center gap-4 rounded-2xl border-2 px-4 py-3.5 text-left text-body transition ${
                state === "correct"
                  ? "border-green bg-green/10"
                  : state === "wrong"
                    ? "border-red bg-red/10"
                    : "border-transparent bg-surface shadow-card hover:border-accent/40"
              } ${state === "dim" ? "opacity-50" : ""}`}
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-fill text-subhead font-bold">
                {state === "correct" ? <CheckIcon className="text-green" /> : state === "wrong" ? <XIcon className="text-red" /> : letters[i]}
              </span>
              {option}
            </button>
          );
        })}
      </div>

      {revealed && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-body">
            {timedOut ? (
              <span className="font-semibold text-orange">Уақыт бітті!</span>
            ) : picked === q.correctIndex ? (
              <span className="font-semibold text-green">Дұрыс!</span>
            ) : (
              <span className="font-semibold text-red">Қате.</span>
            )}{" "}
            {q.explanation && <span className="text-label-2">{q.explanation}</span>}
          </p>
          <Button size="lg" onClick={next} className="shrink-0">
            {isLast ? "Нәтижені көру" : "Келесі сұрақ"}
          </Button>
        </div>
      )}
    </div>
  );
}
