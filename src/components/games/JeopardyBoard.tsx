"use client";

import { useState } from "react";
import type { Jeopardy } from "@/types/topic-package";
import { Button } from "@/components/ui/Button";

// «Өз ойын»: тақта, сұрақты ашу, жауабын көрсету, екі команданың ұпайы.
// Очки за вопрос зависят от его места в рубрике: 1-й — 100, 5-й — 500.

const pointsOf = (index: number) => (index + 1) * 100;

export function JeopardyBoard({ jeopardy }: { jeopardy: Jeopardy }) {
  const [used, setUsed] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState<{ c: number; q: number } | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [teams, setTeams] = useState([0, 0]);

  const close = (winner?: number) => {
    if (!open) return;
    if (winner !== undefined) setTeams(teams.map((s, i) => (i === winner ? s + pointsOf(open.q) : s)));
    setUsed(new Set(used).add(`${open.c}-${open.q}`));
    setOpen(null);
    setShowAnswer(false);
  };

  const cols = jeopardy.categories.length;

  if (open) {
    const category = jeopardy.categories[open.c];
    const question = category.questions[open.q];
    return (
      <div className="flex min-h-80 flex-col items-center justify-center gap-6 rounded-2xl bg-linear-to-br from-indigo to-accent p-6 pt-14 text-center text-white">
        <p className="text-subhead font-semibold uppercase tracking-widest opacity-80">
          {category.title} · {pointsOf(open.q)}
        </p>
        <h3 className="max-w-2xl text-title1 font-bold">{question.question}</h3>
        {showAnswer ? (
          <>
            <p className="rounded-2xl bg-white/15 px-6 py-3 text-title2 font-bold">{question.answer}</p>
            <div className="flex flex-wrap justify-center gap-2">
              {teams.map((_, i) => (
                <Button key={i} onClick={() => close(i)} className="bg-white text-indigo hover:bg-white/90">
                  +{pointsOf(open.q)} — {i + 1}-команда
                </Button>
              ))}
              <Button variant="plain" onClick={() => close()} className="text-white">
                Ешкім
              </Button>
            </div>
          </>
        ) : (
          <Button size="lg" onClick={() => setShowAnswer(true)} className="bg-white text-indigo hover:bg-white/90">
            Жауабын көрсету
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
            <p className="text-footnote text-label-2">{i + 1}-команда</p>
            <p className="text-title2 font-bold tabular-nums">{score}</p>
          </div>
        ))}
      </div>

      <div className="overflow-x-auto">
        <div className="grid min-w-[36rem] gap-2" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
          {jeopardy.categories.map((category, c) => (
            <div key={c} className="flex flex-col gap-2">
              <div className="flex min-h-16 items-center justify-center rounded-xl bg-indigo px-2 py-2 text-center text-subhead font-bold text-white">
                {category.title}
              </div>
              {category.questions.map((_, q) => {
                const isUsed = used.has(`${c}-${q}`);
                return (
                  <button
                    key={q}
                    type="button"
                    disabled={isUsed}
                    onClick={() => setOpen({ c, q })}
                    className="h-16 rounded-xl bg-accent text-title2 font-bold text-white transition hover:brightness-110 active:scale-[0.97] disabled:bg-fill disabled:text-label-3"
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
