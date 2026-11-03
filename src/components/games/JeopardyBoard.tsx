"use client";

import { useState } from "react";
import type { Jeopardy } from "@/types/topic-package";
import { Button } from "@/components/ui/Button";
import { RemoteImage } from "@/components/ui/RemoteImage";
import { useT } from "@/i18n/client";

// «Өз ойын»: тақта, сұрақты ашу, жауабын көрсету, екі команданың ұпайы.
// Очки за вопрос зависят от его места в рубрике: 1-й — 100, 5-й — 500.

const pointsOf = (index: number) => (index + 1) * 100;

export function JeopardyBoard({ jeopardy, onFirstAnswer }: { jeopardy: Jeopardy; onFirstAnswer?: () => void }) {
  const [used, setUsed] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState<{ c: number; q: number } | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [teams, setTeams] = useState([0, 0]);
  const t = useT();

  const close = (winner?: number) => {
    if (!open) return;
    if (winner !== undefined) setTeams(teams.map((s, i) => (i === winner ? s + pointsOf(open.q) : s)));
    setUsed(new Set(used).add(`${open.c}-${open.q}`));
    setOpen(null);
    setShowAnswer(false);
  };

  if (open) {
    const category = jeopardy.categories[open.c];
    const question = category.questions[open.q];
    return (
      <div className="flex min-h-80 flex-col items-center justify-center gap-6 rounded-2xl bg-linear-to-br from-indigo to-accent p-6 pt-14 text-center text-white">
        <p className="text-subhead font-semibold uppercase tracking-widest opacity-80">
          {category.title} · {pointsOf(open.q)}
        </p>
        {question.image && <RemoteImage image={question.image} className="max-h-[40vh] bg-white/10" />}
        <h3 className="max-w-2xl text-title1 font-bold">{question.question}</h3>
        {showAnswer ? (
          <>
            <p className="rounded-2xl bg-white/15 px-6 py-3 text-title2 font-bold">{question.answer}</p>
            <div className="flex flex-wrap justify-center gap-2">
              {teams.map((_, i) => (
                <Button key={i} variant="light" onClick={() => close(i)}>
                  +{pointsOf(open.q)} — {t.games_ui.team(i + 1)}
                </Button>
              ))}
              <Button variant="light" onClick={() => close()}>
                {t.games_ui.nobody}
              </Button>
            </div>
          </>
        ) : (
          <Button size="lg" variant="light" onClick={() => setShowAnswer(true)}>
            {t.games_ui.showAnswer}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 pt-10">
      <div className="flex justify-center gap-3">
        {teams.map((score, i) => (
          <div key={i} className="rounded-2xl bg-surface px-5 py-2 text-center shadow-card">
            <p className="text-footnote text-label-2">{t.games_ui.team(i + 1)}</p>
            <p className="text-title2 font-bold tabular-nums">{score}</p>
          </div>
        ))}
      </div>

      {/* Как в телевизионной «Своей игре»: каждая тема — строка, слева название, справа цены */}
      <div className="overflow-x-auto">
        <div className="flex min-w-[36rem] flex-col gap-2">
          {jeopardy.categories.map((category, c) => (
            <div key={c} className="grid grid-cols-[minmax(9rem,1.6fr)_repeat(5,minmax(0,1fr))] gap-2">
              <div className="flex min-h-16 items-center rounded-xl bg-indigo px-4 py-2 text-subhead font-bold text-white">
                {category.title}
              </div>
              {category.questions.map((_, q) => {
                const isUsed = used.has(`${c}-${q}`);
                return (
                  <button
                    key={q}
                    type="button"
                    disabled={isUsed}
                    onClick={() => {
                      onFirstAnswer?.();
                      setOpen({ c, q });
                    }}
                    className="min-h-16 rounded-xl bg-accent text-title2 font-bold text-white transition hover:brightness-110 active:scale-[0.97] disabled:bg-fill disabled:text-label-3"
                  >
                    {isUsed ? "" : pointsOf(q)}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
