"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { QUIZ_SECONDS, type PublicQuestion, type PublicRoom, type RoomGame } from "@/types/room";
import { schoolGrade } from "@/lib/labels";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CheckIcon, XIcon } from "@/components/ui/Icons";
import { RemoteImage } from "@/components/ui/RemoteImage";
import { fieldClass } from "@/components/ui/field";
import { useT } from "@/i18n/client";

// Игра на телефоне ученика: ввести имя и ответить на вопросы в своём темпе.
// id ученика хранится в браузере, поэтому после обновления страницы
// игра продолжается с того же вопроса.

interface Answer {
  index: number;
  correct: boolean;
  points: number;
}

interface Feedback {
  choice: number;
  correct: boolean;
  correctIndex: number;
  explanation?: string;
  points: number;
}

const playerKey = (code: string) => `sabaq-room-${code}`;
const readPlayerId = (code: string) => {
  try {
    return localStorage.getItem(playerKey(code));
  } catch {
    return null;
  }
};

interface PlayResponse {
  room?: PublicRoom;
  player?: { id: string; name: string; answers: Answer[] } | null;
  error?: string;
}

async function loadRoom(code: string): Promise<PlayResponse | null> {
  const stored = readPlayerId(code);
  const response = await fetch(`/api/rooms/${code}/play${stored ? `?player=${stored}` : ""}`).catch(() => null);
  return response?.json().catch(() => null) ?? null;
}

export function StudentGame({ code }: { code: string }) {
  const [room, setRoom] = useState<PublicRoom | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [joining, setJoining] = useState(false);
  const t = useT();

  useEffect(() => {
    let active = true;
    loadRoom(code).then((data) => {
      if (!active) return;
      if (!data?.room) return setError(data?.error ?? t.play.reload);
      setRoom(data.room);
      if (data.player) {
        setPlayerId(data.player.id);
        setName(data.player.name);
        setAnswers(data.player.answers);
      }
    });
    return () => {
      active = false;
    };
    // t не в зависимостях: комнату грузим один раз, язык меняется только с перезагрузкой
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  if (error) {
    return (
      <Card className="p-6 text-center">
        <p className="text-body">{error}</p>
        <Link href="/play" className="mt-4 inline-block font-semibold text-accent">
          {t.play.otherCode}
        </Link>
      </Card>
    );
  }
  if (!room) return <Card className="h-64 animate-pulse" />;

  const join = async () => {
    setJoining(true);
    const response = await fetch(`/api/rooms/${code}/players`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    }).catch(() => null);
    const data = await response?.json().catch(() => null);
    setJoining(false);
    if (!response?.ok || !data?.playerId) return setError(data?.error ?? t.play.joinError);
    try {
      localStorage.setItem(playerKey(code), data.playerId);
    } catch {}
    setPlayerId(data.playerId);
  };

  if (!playerId) {
    if (room.status === "finished") return <Card className="p-6 text-center text-body">{t.play.gameFinished}</Card>;
    return (
      <Card className="flex flex-col gap-4 p-6">
        <div>
          <p className="text-footnote font-semibold uppercase tracking-wide text-label-2">{t.play.game} · {code}</p>
          <h1 className="mt-1 text-title1 font-bold">{room.title}</h1>
        </div>
        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (name.trim() && !joining) join();
          }}
        >
          <label className="flex flex-col gap-1.5">
            <span className="text-subhead font-semibold">{t.play.name}</span>
            <input
              className={`${fieldClass} h-14`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={30}
              autoComplete="name"
              placeholder={t.play.namePlaceholder}
            />
          </label>
          <Button type="submit" size="lg" disabled={!name.trim() || joining}>
            {joining ? t.play.joining : t.play.join}
          </Button>
        </form>
      </Card>
    );
  }

  const total = room.questions.length;
  const next = answers.length;
  const correct = answers.filter((a) => a.correct).length;
  const points = answers.reduce((sum, a) => sum + a.points, 0);

  if (next >= total || room.status === "finished") {
    return (
      <Card className="flex flex-col items-center gap-2 p-8 text-center">
        <p className="text-title3 text-label-2">{t.play.wellDone(name)}</p>
        <p className="text-display font-bold text-accent">
          {room.game === "quiz" ? t.common.points(points) : t.common.mark(schoolGrade(correct, total))}
        </p>
        <p className="text-body text-label-2">
          {t.play.answeredOf(correct, total)}
        </p>
        <p className="mt-3 text-subhead text-label-2">{t.play.onTeacherScreen}</p>
      </Card>
    );
  }

  return (
    <QuestionCard
      key={next}
      code={code}
      playerId={playerId}
      game={room.game}
      index={next}
      total={total}
      question={room.questions[next]}
      onDone={(answer) => setAnswers([...answers, answer])}
      onClosed={() => setRoom({ ...room, status: "finished" })}
    />
  );
}

const tileColors = ["bg-accent", "bg-orange", "bg-green", "bg-purple"];
const letters = ["A", "B", "C", "D"];

function QuestionCard(props: {
  code: string;
  playerId: string;
  game: RoomGame;
  index: number;
  total: number;
  question: PublicQuestion;
  onDone: (answer: Answer) => void;
  onClosed: () => void;
}) {
  const { code, playerId, game, index, total, question } = props;
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [sending, setSending] = useState(false);
  const [timeLeft, setTimeLeft] = useState(QUIZ_SECONDS);
  const shownAt = useRef(0);
  const timed = game === "quiz";
  const t = useT();

  const submit = useCallback(
    async (choice: number) => {
      setSending(true);
      const response = await fetch(`/api/rooms/${code}/answers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, index, choice, ms: Math.round(performance.now() - shownAt.current) }),
      }).catch(() => null);
      const data = await response?.json().catch(() => null);
      setSending(false);
      if (data?.code === "teacherFinished") return props.onClosed();
      if (response?.ok) setFeedback({ choice, ...data });
    },
    [code, playerId, index, props],
  );

  // Таймер викторины: по истечении времени отправляем «нет ответа»
  useEffect(() => {
    shownAt.current = performance.now();
    if (!timed) return;
    const tick = setInterval(() => setTimeLeft((s) => Math.max(0, s - 1)), 1000);
    const timeout = setTimeout(() => submit(-1), QUIZ_SECONDS * 1000);
    return () => {
      clearInterval(tick);
      clearTimeout(timeout);
    };
    // Таймер запускается один раз на вопрос (компонент пересоздаётся через key)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const answered = feedback !== null;
  const trueFalse = game === "true-false";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <span className="text-subhead font-semibold text-label-2">
          {index + 1} / {total}
        </span>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-fill">
          <div
            className={`h-full rounded-full transition-all duration-1000 ease-linear ${timed ? "bg-orange" : "bg-accent"}`}
            style={{ width: timed && !answered ? `${(timeLeft / QUIZ_SECONDS) * 100}%` : `${((index + 1) / total) * 100}%` }}
          />
        </div>
        {timed && !answered && <span className="w-10 text-right text-subhead font-semibold tabular-nums">{timeLeft} {t.common.seconds}</span>}
      </div>

      <Card className="flex flex-col gap-3 p-5">
        <h2 className="text-title2 font-bold">{question.prompt}</h2>
        {question.image && <RemoteImage image={question.image} className="max-h-60" />}
      </Card>

      <div className={`grid gap-3 ${trueFalse ? "grid-cols-2" : ""}`}>
        {question.options.map((option, i) => {
          const isCorrect = feedback?.correctIndex === i;
          const isPicked = feedback?.choice === i;
          const dim = answered && !isCorrect;
          const colored = timed || trueFalse;
          const color = trueFalse ? (i === 0 ? "bg-green" : "bg-red") : tileColors[i];
          return (
            <button
              key={i}
              type="button"
              disabled={answered || sending}
              onClick={() => submit(i)}
              className={`flex min-h-16 items-center gap-3 rounded-2xl px-4 py-3 text-left text-body font-semibold transition active:scale-[0.98] ${
                colored ? `${color} text-white` : "bg-surface shadow-card"
              } ${trueFalse ? "justify-center text-title3" : ""} ${dim ? "opacity-30" : ""} ${
                answered && isCorrect && !colored ? "ring-2 ring-green" : ""
              } ${isPicked && !feedback?.correct && !colored ? "ring-2 ring-red" : ""}`}
            >
              {!trueFalse && <span className={colored ? "opacity-70" : "text-label-2"}>{letters[i]}</span>}
              <span className="flex-1">{option}</span>
              {answered && isCorrect && <CheckIcon />}
              {isPicked && !feedback?.correct && <XIcon />}
            </button>
          );
        })}
      </div>

      {feedback && (
        <Card className="flex flex-col gap-3 p-4">
          <p className="text-body">
            {feedback.choice === -1 ? (
              <b className="text-orange">{t.common.timeUp}</b>
            ) : feedback.correct ? (
              <b className="text-green">{t.common.correct}{timed && ` +${feedback.points}`}</b>
            ) : (
              <b className="text-red">{t.common.wrong}</b>
            )}{" "}
            {feedback.explanation && <span className="text-label-2">{feedback.explanation}</span>}
          </p>
          <Button size="lg" onClick={() => props.onDone({ index, correct: feedback.correct, points: feedback.points })}>
            {index + 1 >= total ? t.play.seeMyResult : t.common.nextQuestion}
          </Button>
        </Card>
      )}
    </div>
  );
}
