"use client";

import { useState } from "react";
import type { Jeopardy, TopicPackage } from "@/types/topic-package";
import { games, type GameId } from "@/games/registry";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SparkleIcon } from "@/components/ui/Icons";
import { GameStage } from "@/components/games/GameStage";
import { JeopardyEditor, QuizEditor, TrueFalseEditor } from "@/components/games/GameEditors";
import { JeopardyBoard } from "@/components/games/JeopardyBoard";
import { QuestionPlayer } from "@/components/games/QuestionPlayer";
import { TrueFalsePlayer } from "@/components/games/TrueFalsePlayer";

interface GamesPanelProps {
  lesson: TopicPackage;
  mode: "edit" | "preview";
  onChange: (lesson: TopicPackage) => void;
  /** «Өз ойын» генерируется отдельно и сохраняется на сервере сам */
  onJeopardyReady: (jeopardy: Jeopardy, updatedAt: string) => void;
}

export function GamesPanel({ lesson, mode, onChange, onJeopardyReady }: GamesPanelProps) {
  const [gameId, setGameId] = useState<GameId>("test");
  const game = games.find((g) => g.id === gameId) ?? games[0];

  return (
    <div className="flex flex-col gap-5">
      <div role="radiogroup" aria-label="Ойын түрі" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {games.map((g) => {
          const selected = g.id === gameId;
          return (
            <button
              key={g.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => setGameId(g.id)}
              className={`flex items-start gap-3 rounded-2xl border-2 p-3.5 text-left transition ${
                selected ? "border-accent bg-accent/6" : "border-transparent bg-surface shadow-card hover:border-separator"
              }`}
            >
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white ${g.tint}`}>
                {g.icon}
              </span>
              <span>
                <span className="block text-callout font-semibold">{g.title}</span>
                <span className="mt-0.5 block text-footnote text-label-2">{g.description}</span>
              </span>
            </button>
          );
        })}
      </div>

      {game.data === "jeopardy" && !lesson.jeopardy ? (
        <JeopardyGenerator lessonId={lesson.id} onReady={onJeopardyReady} />
      ) : mode === "edit" ? (
        <GameEditor lesson={lesson} gameData={game.data} onChange={onChange} />
      ) : (
        // key: при смене игры плеер начинается заново
        <GameStage key={game.id}>
          {game.id === "test" && <QuestionPlayer questions={lesson.quiz} variant="test" />}
          {game.id === "quiz" && <QuestionPlayer questions={lesson.quiz} variant="quiz" />}
          {game.id === "true-false" && <TrueFalsePlayer items={lesson.trueFalse} language={lesson.language} />}
          {game.id === "jeopardy" && lesson.jeopardy && <JeopardyBoard jeopardy={lesson.jeopardy} />}
        </GameStage>
      )}
    </div>
  );
}

function GameEditor({
  lesson,
  gameData,
  onChange,
}: {
  lesson: TopicPackage;
  gameData: "quiz" | "trueFalse" | "jeopardy";
  onChange: (lesson: TopicPackage) => void;
}) {
  if (gameData === "quiz") return <QuizEditor questions={lesson.quiz} onChange={(quiz) => onChange({ ...lesson, quiz })} />;
  if (gameData === "trueFalse")
    return (
      <TrueFalseEditor
        items={lesson.trueFalse}
        language={lesson.language}
        onChange={(trueFalse) => onChange({ ...lesson, trueFalse })}
      />
    );
  if (!lesson.jeopardy) return null;
  return <JeopardyEditor jeopardy={lesson.jeopardy} onChange={(jeopardy) => onChange({ ...lesson, jeopardy })} />;
}

function JeopardyGenerator({
  lessonId,
  onReady,
}: {
  lessonId: string;
  onReady: (jeopardy: Jeopardy, updatedAt: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    setLoading(true);
    setError(null);
    const response = await fetch(`/api/lessons/${lessonId}/jeopardy`, { method: "POST" }).catch(() => null);
    const data = await response?.json().catch(() => null);
    setLoading(false);
    if (response?.ok && data?.jeopardy) onReady(data.jeopardy, data.updatedAt);
    else setError(data?.error ?? "Байланыс үзілді. Қайталап көріңіз.");
  };

  return (
    <Card className="flex flex-col items-center gap-4 p-8 text-center">
      <p className="max-w-md text-body text-label-2">
        «Өз ойын» үшін 5 тақырып бойынша 25 сұрақ керек. Оларды бір рет жасап, кейін өзгертуге болады.
      </p>
      <Button size="lg" onClick={generate} disabled={loading}>
        <SparkleIcon />
        {loading ? "Жасап жатырмын…" : "Сұрақтарды жасау"}
      </Button>
      {error && <p className="text-subhead text-red">{error}</p>}
    </Card>
  );
}
