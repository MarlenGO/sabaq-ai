"use client";

import { useState } from "react";
import type { Language, TrueFalseStatement } from "@/types/topic-package";
import { schoolGrade } from "@/lib/labels";
import { Button } from "@/components/ui/Button";
import { CheckIcon, XIcon } from "@/components/ui/Icons";
import { EmptyGame } from "./GameStage";
import { useT } from "@/i18n/client";

export function TrueFalsePlayer({
  items,
  language,
  onFirstAnswer,
}: {
  items: TrueFalseStatement[];
  language: Language;
  onFirstAnswer?: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState<boolean | null>(null);
  const [correct, setCorrect] = useState(0);
  const [finished, setFinished] = useState(false);
  const t = useT();
  // Кнопки — на языке урока: их видит класс
  const [yes, no] = language === "kk" ? ["Шын", "Жалған"] : ["Правда", "Ложь"];

  if (items.length === 0) return <EmptyGame text={t.games_ui.noStatements} />;

  if (finished) {
    return (
      <div className="flex flex-col items-center gap-3 py-10 text-center">
        <p className="text-title3 text-label-2">{t.common.gameOver}</p>
        <p className="text-display font-bold text-accent">{t.common.mark(schoolGrade(correct, items.length))}</p>
        <p className="text-body text-label-2">
          {t.games_ui.statementsOf(correct, items.length)}
        </p>
        <Button
          size="lg"
          className="mt-4"
          onClick={() => {
            setIndex(0);
            setAnswer(null);
            setCorrect(0);
            setFinished(false);
          }}
        >
          {t.common.restart}
        </Button>
      </div>
    );
  }

  const item = items[Math.min(index, items.length - 1)];
  const isLast = index >= items.length - 1;
  const revealed = answer !== null;
  const right = answer === item.isTrue;

  const next = () => {
    if (isLast) return setFinished(true);
    setIndex(index + 1);
    setAnswer(null);
  };

  const choose = (value: boolean) => {
    if (revealed) return;
    onFirstAnswer?.();
    setAnswer(value);
    if (value === item.isTrue) setCorrect((c) => c + 1);
  };

  return (
    <div className="flex flex-col gap-6 pt-10 text-center">
      <span className="text-subhead font-semibold text-label-2">
        {index + 1} / {items.length}
      </span>
      <h3 className="mx-auto max-w-2xl text-title1 font-bold">{item.statement}</h3>

      <div className="mx-auto grid w-full max-w-lg grid-cols-2 gap-3">
        {[true, false].map((value) => {
          const isAnswer = value === item.isTrue;
          return (
            <button
              key={String(value)}
              type="button"
              onClick={() => choose(value)}
              className={`flex h-20 items-center justify-center gap-2 rounded-2xl text-title2 font-bold text-white transition ${
                value ? "bg-green" : "bg-red"
              } ${revealed && !isAnswer ? "opacity-30" : ""} ${!revealed ? "hover:brightness-110 active:scale-[0.98]" : ""}`}
            >
              {value ? <CheckIcon /> : <XIcon />}
              {value ? yes : no}
            </button>
          );
        })}
      </div>

      {revealed && (
        <div className="flex flex-col items-center gap-3">
          <p className="text-body">
            <span className={`font-semibold ${right ? "text-green" : "text-red"}`}>{right ? t.common.correct : t.common.wrong}</span>{" "}
            {item.explanation && <span className="text-label-2">{item.explanation}</span>}
          </p>
          <Button size="lg" onClick={next}>
            {isLast ? t.common.seeResult : t.common.next}
          </Button>
        </div>
      )}
    </div>
  );
}
