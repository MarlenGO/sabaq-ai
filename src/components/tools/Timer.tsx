"use client";

import { useEffect, useRef, useState } from "react";
import { useT } from "@/i18n/client";
import { Button } from "@/components/ui/Button";
import { ExpandIcon } from "@/components/ui/Icons";

// Таймер для урока: крупные цифры для проектора, готовые минуты одним нажатием,
// ±1 минута прямо во время счёта, в конце — короткий сигнал.
// Время считаем от момента окончания (endAt), а не «минус секунда каждую секунду»:
// так таймер не отстаёт, даже если вкладка была свёрнута.

const presets = [1, 2, 3, 5, 7, 10, 15];
const MINUTE = 60_000;

export function Timer() {
  const t = useT();
  const [total, setTotal] = useState(5 * MINUTE);
  /** Сколько осталось, пока таймер стоит */
  const [left, setLeft] = useState(5 * MINUTE);
  /** Когда закончится, пока таймер идёт */
  const [endAt, setEndAt] = useState<number | null>(null);
  const [now, setNow] = useState(0);
  const [sound, setSound] = useState(true);
  const audio = useRef<AudioContext | null>(null);
  const box = useRef<HTMLDivElement>(null);

  const running = endAt !== null;
  const remaining = running ? Math.max(0, endAt - now) : left;
  const finished = !running && left === 0;
  const seconds = Math.ceil(remaining / 1000);
  const clock = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

  useEffect(() => {
    if (endAt === null) return;
    const id = setInterval(() => {
      const time = Date.now();
      setNow(time);
      if (time >= endAt) {
        clearInterval(id);
        setEndAt(null);
        setLeft(0);
        if (sound && audio.current) beep(audio.current);
      }
    }, 200);
    return () => clearInterval(id);
  }, [endAt, sound]);

  const choose = (minutes: number) => {
    setEndAt(null);
    setTotal(minutes * MINUTE);
    setLeft(minutes * MINUTE);
  };
  const start = () => {
    // Звук в браузере разрешён только после нажатия — готовим его здесь
    audio.current ??= new AudioContext();
    const time = Date.now();
    const from = finished ? total : left;
    setLeft(from);
    setNow(time);
    setEndAt(time + from);
  };
  const pause = () => {
    setLeft(remaining);
    setEndAt(null);
  };
  /** ±1 минута: и пока стоит, и во время счёта */
  const shift = (delta: number) => {
    if (running) {
      if (remaining + delta <= 0) return;
      setEndAt(endAt + delta);
      setTotal(Math.max(total, remaining + delta));
    } else {
      const next = Math.max(MINUTE, Math.ceil(left / MINUTE) * MINUTE + delta);
      setLeft(next);
      setTotal(next);
    }
  };

  const warning = running && seconds <= 10;
  const progress = total > 0 ? remaining / total : 0;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap gap-2" role="group" aria-label={t.tools.timer}>
        {presets.map((minutes) => (
          <button
            key={minutes}
            type="button"
            onClick={() => choose(minutes)}
            className={`h-11 min-w-16 rounded-full px-4 text-callout font-semibold transition ${
              !running && total === minutes * MINUTE ? "bg-accent text-white" : "bg-surface text-label shadow-card hover:bg-fill"
            }`}
          >
            {t.tools.minutes(minutes)}
          </button>
        ))}
      </div>

      <div ref={box} className="flex flex-col items-center gap-6 rounded-3xl bg-surface p-6 shadow-card sm:p-10 [&:fullscreen]:justify-center [&:fullscreen]:rounded-none">
        <div className="flex w-full items-center justify-center gap-3 sm:gap-6">
          <RoundButton label={t.tools.minusMinute} onClick={() => shift(-MINUTE)}>
            −1
          </RoundButton>
          <p
            role="timer"
            aria-live="off"
            className={`font-extrabold leading-none tracking-tight tabular-nums text-[min(22vw,9rem)] [:fullscreen_&]:text-[min(30vw,40vh)] ${
              finished ? "animate-pulse text-red" : warning ? "text-red" : "text-label"
            }`}
          >
            {clock}
          </p>
          <RoundButton label={t.tools.plusMinute} onClick={() => shift(MINUTE)}>
            +1
          </RoundButton>
        </div>

        <div className="h-2 w-full max-w-xl overflow-hidden rounded-full bg-fill">
          <div
            className={`h-full rounded-full transition-[width] duration-200 ${warning || finished ? "bg-red" : "bg-accent"}`}
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        {finished && <p className="text-title2 font-bold text-red">{t.common.timeUp}</p>}

        <div className="flex flex-wrap justify-center gap-3">
          {running ? (
            <Button size="lg" onClick={pause}>
              {t.tools.pause}
            </Button>
          ) : (
            <Button size="lg" onClick={start}>
              {left < total && !finished ? t.tools.resume : t.tools.start}
            </Button>
          )}
          <Button size="lg" variant="tinted" onClick={() => choose(total / MINUTE)}>
            {t.tools.reset}
          </Button>
          <Button size="lg" variant="tinted" onClick={() => box.current?.requestFullscreen?.()}>
            <ExpandIcon />
            {t.games_ui.fullscreen}
          </Button>
        </div>
      </div>

      <label className="flex min-h-11 cursor-pointer items-center gap-3 self-start text-callout">
        <input type="checkbox" checked={sound} onChange={(e) => setSound(e.target.checked)} className="size-5 accent-accent" />
        {t.tools.sound}
      </label>
    </div>
  );
}

function RoundButton({ label, onClick, children }: { label: string; onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="flex size-14 shrink-0 items-center justify-center rounded-full bg-fill text-title3 font-bold text-label transition hover:bg-accent/15 hover:text-accent"
    >
      {children}
    </button>
  );
}

/** Три коротких сигнала без звуковых файлов — браузер сам рисует звук */
function beep(context: AudioContext) {
  [0, 0.35, 0.7].forEach((delay) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.frequency.value = 880;
    const at = context.currentTime + delay;
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(0.4, at + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.25);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(at);
    oscillator.stop(at + 0.3);
  });
}
