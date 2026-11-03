"use client";

import { useRef, type ReactNode } from "react";
import { ExpandIcon } from "@/components/ui/Icons";
import { useT } from "@/i18n/client";

// Рамка для игры с кнопкой «на весь экран» — для проектора в классе.
// В полноэкранном режиме всё увеличивается (zoom), чтобы было видно с задних парт.
export function GameStage({ children }: { children: ReactNode }) {
  const stage = useRef<HTMLDivElement>(null);
  const t = useT();

  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else stage.current?.requestFullscreen();
  };

  return (
    <div
      ref={stage}
      className="relative rounded-2xl bg-bg p-4 sm:p-6 [&:fullscreen]:flex [&:fullscreen]:flex-col [&:fullscreen]:justify-center [&:fullscreen]:overflow-auto [&:fullscreen]:p-10 [&:fullscreen]:[zoom:1.35]"
    >
      <button
        type="button"
        onClick={toggleFullscreen}
        className="absolute right-3 top-3 z-10 flex h-9 items-center gap-1.5 rounded-full bg-surface px-3 text-footnote font-medium text-label-2 shadow-card transition hover:text-label"
      >
        <ExpandIcon />
        <span className="hidden sm:inline">{t.games_ui.fullscreen}</span>
      </button>
      {children}
    </div>
  );
}

export function EmptyGame({ text }: { text: string }) {
  return <p className="py-12 text-center text-body text-label-2">{text}</p>;
}
