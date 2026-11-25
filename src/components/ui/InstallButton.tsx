"use client";

import { useSyncExternalStore } from "react";
import { MonitorDown } from "lucide-static";
import { useT } from "@/i18n/client";
import { INSTALL_EVENT } from "@/lib/preferences-script";
import { LucideIcon } from "@/components/ui/LucideIcon";

// «Орнату» — значок сайта на рабочем столе (PWA): сайт открывается своим окном,
// как программа. Кнопка видна, только когда браузер готов установить (Chrome, Edge)
// и сайт ещё не установлен; после установки исчезает сама.

interface InstallPrompt extends Event {
  prompt: () => Promise<void>;
}

declare global {
  interface Window {
    __sabaqInstall?: InstallPrompt | null;
  }
}

const subscribe = (onChange: () => void) => {
  addEventListener(INSTALL_EVENT, onChange);
  return () => removeEventListener(INSTALL_EVENT, onChange);
};

export function InstallButton() {
  const t = useT();
  const prompt = useSyncExternalStore(
    subscribe,
    () => window.__sabaqInstall ?? null,
    () => null,
  );
  if (!prompt) return null;

  return (
    <button
      type="button"
      onClick={async () => {
        await prompt.prompt();
        // Окно браузера показывается один раз: дальше кнопка не нужна
        window.__sabaqInstall = null;
        dispatchEvent(new Event(INSTALL_EVENT));
      }}
      title={t.nav.installHint}
      className="flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-accent/12 px-3 text-footnote font-semibold text-accent transition hover:bg-accent/20"
    >
      <LucideIcon svg={MonitorDown} className="size-4" />
      {t.nav.install}
    </button>
  );
}
