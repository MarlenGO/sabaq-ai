"use client";

import { useState } from "react";
import type { QuestionImage } from "@/types/topic-package";
import { Button } from "@/components/ui/Button";
import { RemoteImage } from "@/components/ui/RemoteImage";
import { ImagePicker } from "./ImagePicker";

// Картинка к вопросу в конструкторе: «Сурет қосу» или превью с «Ауыстыру / Өшіру».
// compact — маленькая кнопка для строк «Өз ойын».
export function ImageField({
  image,
  query,
  onChange,
  compact = false,
}: {
  image?: QuestionImage;
  /** С чего начать поиск — обычно текст вопроса */
  query: string;
  onChange: (image: QuestionImage | undefined) => void;
  compact?: boolean;
}) {
  const [picking, setPicking] = useState(false);

  const picker = picking && (
    <ImagePicker
      initialQuery={query}
      onClose={() => setPicking(false)}
      onPick={(picked) => {
        onChange(picked);
        setPicking(false);
      }}
    />
  );

  if (compact) {
    return (
      <>
        <button
          type="button"
          onClick={() => setPicking(true)}
          title={image ? "Суретті ауыстыру" : "Сурет қосу"}
          aria-label={image ? "Суретті ауыстыру" : "Сурет қосу"}
          className="mt-1 flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-fill text-accent transition hover:ring-2 hover:ring-accent/40"
        >
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image.url} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover" />
          ) : (
            <PhotoIcon />
          )}
        </button>
        {picker}
      </>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {image ? (
        <>
          <RemoteImage image={image} className="max-h-32" showCredit={false} />
          <div className="flex gap-2">
            <Button variant="tinted" onClick={() => setPicking(true)}>
              Ауыстыру
            </Button>
            <Button variant="plain" className="text-red" onClick={() => onChange(undefined)}>
              Суретті алып тастау
            </Button>
          </div>
        </>
      ) : (
        <Button variant="tinted" onClick={() => setPicking(true)}>
          <PhotoIcon />
          Сурет қосу
        </Button>
      )}
      {picker}
    </div>
  );
}

const PhotoIcon = () => (
  <svg viewBox="0 0 24 24" width="1.25em" height="1.25em" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="4" width="18" height="16" rx="2.5" />
    <circle cx="9" cy="10" r="1.8" />
    <path d="M21 16l-5-5-9 9" />
  </svg>
);
