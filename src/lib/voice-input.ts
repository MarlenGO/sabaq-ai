import { useRef, useState, useSyncExternalStore } from "react";
import type { Language } from "@/types/topic-package";

// Голосовой ввод через встроенное в браузер распознавание речи.
// Работает в Chrome и Edge (в том числе на телефоне), в остальных
// браузерах кнопка микрофона просто не показывается.

interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start(): void;
  stop(): void;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getRecognition(): SpeechRecognitionCtor | undefined {
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

const noopSubscribe = () => () => {};

export function useVoiceInput(language: Language, onText: (text: string) => void) {
  const supported = useSyncExternalStore(noopSubscribe, () => getRecognition() !== undefined, () => false);
  const [listening, setListening] = useState(false);
  const recognition = useRef<SpeechRecognitionLike | null>(null);

  const start = () => {
    const Recognition = getRecognition();
    if (!Recognition) return;
    const r = new Recognition();
    r.lang = language === "kk" ? "kk-KZ" : "ru-RU";
    r.interimResults = false;
    r.onresult = (event) => {
      const text = event.results[0]?.[0]?.transcript;
      if (text) onText(text.trim());
    };
    r.onend = () => setListening(false);
    r.onerror = () => setListening(false);
    recognition.current = r;
    setListening(true);
    r.start();
  };

  const stop = () => recognition.current?.stop();

  return { supported, listening, start, stop };
}
