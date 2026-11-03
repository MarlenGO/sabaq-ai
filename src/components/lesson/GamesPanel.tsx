"use client";

import { useRef, useState } from "react";
import { track } from "@/lib/track";
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
import { RoomHost } from "@/components/games/RoomHost";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import type { RoomGame } from "@/types/room";
import { useT } from "@/i18n/client";

const ScreenIcon = () => (
  <svg viewBox="0 0 24 24" width="1.25em" height="1.25em" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
    <rect x="3" y="4" width="18" height="12" rx="2" />
    <path d="M8 20h8M12 16v4" />
  </svg>
);

const QrIcon = () => (
  <svg viewBox="0 0 24 24" width="1.25em" height="1.25em" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <path d="M14 14h3v3M21 14v.01M14 21h.01M17 21h4v-4" />
  </svg>
);

interface GamesPanelProps {
  lesson: TopicPackage;
  mode: "edit" | "preview";
  /** Только просмотр: без конструктора, QR и записи в историю */
  readOnly: boolean;
  initialGame?: GameId;
  onChange: (lesson: TopicPackage) => void;
  /** «Өз ойын» генерируется отдельно и сохраняется на сервере сам */
  onJeopardyReady: (jeopardy: Jeopardy, updatedAt: string) => void;
}

export function GamesPanel({ lesson, mode, readOnly, initialGame, onChange, onJeopardyReady }: GamesPanelProps) {
  const [gameId, setGameId] = useState<GameId>(initialGame ?? "test");
  const [playMode, setPlayMode] = useState<"screen" | "qr">("screen");
  const t = useT();
  const game = games.find((g) => g.id === gameId) ?? games[0];
  const viaQr = !readOnly && game.qr && playMode === "qr";

  // В историю пишем игру на экране один раз, при первом ответе
  // (просто открыть и посмотреть — это ещё не игра)
  const logged = useRef(new Set<GameId>());
  const logPlay = () => {
    if (readOnly || logged.current.has(game.id)) return;
    logged.current.add(game.id);
    track({ type: "game", lessonId: lesson.id, game: game.id });
  };

  return (
    <div className="flex flex-col gap-5">
      {/* В режиме просмотра из истории выбор игры не нужен: показываем ту, что была */}
      <div
        role="radiogroup"
        aria-label={t.games_ui.kind}
        className={`grid gap-3 sm:grid-cols-2 lg:grid-cols-4 ${readOnly && initialGame ? "hidden" : ""}`}
      >
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
                <span className="block text-callout font-semibold">{t.games[g.id].title}</span>
                <span className="mt-0.5 block text-footnote text-label-2">{t.games[g.id].description}</span>
              </span>
            </button>
          );
        })}
      </div>

      {readOnly && initialGame && <h2 className="text-title3 font-semibold">{t.games[game.id].title}</h2>}

      {mode === "preview" && !readOnly && (
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-subhead font-semibold">{t.games_ui.how}</span>
          {game.qr ? (
            <SegmentedControl
              size="lg"
              ariaLabel={t.games_ui.howLabel}
              value={playMode}
              onChange={setPlayMode}
              options={[
                { value: "screen", label: t.games_ui.screen, icon: <ScreenIcon /> },
                { value: "qr", label: t.games_ui.qr, icon: <QrIcon /> },
              ]}
            />
          ) : (
            <span className="text-subhead text-label-2">{t.games_ui.screenOnly}</span>
          )}
          <span className="w-full text-footnote text-label-2">
            {viaQr
              ? t.games_ui.qrHint
              : t.games_ui.screenHint}
          </span>
        </div>
      )}

      {game.data === "jeopardy" && !lesson.jeopardy && readOnly ? (
        <Card className="p-8 text-center text-body text-label-2">{t.games_ui.jeopardyMissing}</Card>
      ) : game.data === "jeopardy" && !lesson.jeopardy ? (
        <JeopardyGenerator lessonId={lesson.id} onReady={onJeopardyReady} />
      ) : mode === "edit" ? (
        <GameEditor lesson={lesson} gameData={game.data} onChange={onChange} />
      ) : viaQr ? (
        <GameStage key={`qr-${game.id}`}>
          <div className="pt-10">
            <RoomHost lessonId={lesson.id} game={game.id as RoomGame} />
          </div>
        </GameStage>
      ) : (
        // key: при смене игры плеер начинается заново
        <GameStage key={game.id}>
          {game.id === "test" && <QuestionPlayer questions={lesson.quiz} variant="test" onFirstAnswer={logPlay} />}
          {game.id === "quiz" && <QuestionPlayer questions={lesson.quiz} variant="quiz" onFirstAnswer={logPlay} />}
          {game.id === "true-false" && (
            <TrueFalsePlayer items={lesson.trueFalse} language={lesson.language} onFirstAnswer={logPlay} />
          )}
          {game.id === "jeopardy" && lesson.jeopardy && <JeopardyBoard jeopardy={lesson.jeopardy} onFirstAnswer={logPlay} />}
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
  const t = useT();

  const generate = async () => {
    setLoading(true);
    setError(null);
    const response = await fetch(`/api/lessons/${lessonId}/jeopardy`, { method: "POST" }).catch(() => null);
    const data = await response?.json().catch(() => null);
    setLoading(false);
    if (response?.ok && data?.jeopardy) onReady(data.jeopardy, data.updatedAt);
    else setError(data?.error ?? t.common.netError);
  };

  return (
    <Card className="flex flex-col items-center gap-4 p-8 text-center">
      <p className="max-w-md text-body text-label-2">
        {t.games_ui.jeopardyIntro}
      </p>
      <Button size="lg" onClick={generate} disabled={loading}>
        <SparkleIcon />
        {loading ? t.games_ui.working : t.games_ui.jeopardyMake}
      </Button>
      {error && <p className="text-subhead text-red">{error}</p>}
    </Card>
  );
}
