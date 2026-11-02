"use client";

import { useEffect, useRef, useState } from "react";
import { imageSchema, type QuestionImage } from "@/types/topic-package";
import type { ImageResult } from "@/app/api/images/route";
import { Button } from "@/components/ui/Button";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { XIcon } from "@/components/ui/Icons";
import { RemoteImage } from "@/components/ui/RemoteImage";
import { fieldClass } from "@/components/ui/field";

// Окно выбора картинки к вопросу: поиск в Wikimedia Commons
// или ссылка на картинку из интернета. Сохраняется только ссылка.

export function ImagePicker({
  initialQuery,
  onPick,
  onClose,
}: {
  initialQuery: string;
  onPick: (image: QuestionImage) => void;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [tab, setTab] = useState<"search" | "link">("search");
  const [query, setQuery] = useState(initialQuery.slice(0, 100));
  const [results, setResults] = useState<ImageResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [link, setLink] = useState("");

  // Окно открывается сразу при появлении компонента
  useEffect(() => {
    dialog.current?.showModal();
  }, []);

  const search = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    const response = await fetch(`/api/images?q=${encodeURIComponent(query)}`).catch(() => null);
    const data = await response?.json().catch(() => null);
    setLoading(false);
    if (response?.ok) setResults(data.results);
    else setError(data?.error ?? "Іздеу мүмкін болмады.");
  };

  const linkImage = imageSchema.safeParse({ url: link.trim() });

  return (
    <dialog
      ref={dialog}
      onClose={onClose}
      className="m-auto w-[min(48rem,calc(100vw-2rem))] rounded-2xl bg-surface p-0 text-label shadow-card backdrop:bg-black/50"
    >
      <div className="flex max-h-[85vh] flex-col">
        <div className="flex items-center justify-between gap-3 border-b border-separator p-4">
          <SegmentedControl
            size="lg"
            ariaLabel="Сурет қайдан"
            value={tab}
            onChange={setTab}
            options={[
              { value: "search", label: "Іздеу" },
              { value: "link", label: "Сілтеме қою" },
            ]}
          />
          <button
            type="button"
            onClick={() => dialog.current?.close()}
            aria-label="Жабу"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-fill text-label-2 hover:text-label"
          >
            <XIcon />
          </button>
        </div>

        {tab === "search" ? (
          <div className="flex min-h-0 flex-1 flex-col gap-3 p-4">
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                search();
              }}
            >
              <input
                className={fieldClass}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Не іздейміз? Мысалы: Абай, жасуша, жанартау"
                aria-label="Сурет іздеу"
                autoFocus
              />
              <Button type="submit" size="lg" disabled={loading || !query.trim()}>
                {loading ? "…" : "Іздеу"}
              </Button>
            </form>
            {error && <p className="text-subhead text-red">{error}</p>}
            <div className="min-h-0 flex-1 overflow-y-auto">
              {results === null ? (
                <p className="py-10 text-center text-subhead text-label-2">
                  Сөзді жазып, «Іздеу» батырмасын басыңыз. Суреттер Wikimedia Commons тегін кітапханасынан алынады.
                </p>
              ) : results.length === 0 ? (
                <p className="py-10 text-center text-subhead text-label-2">Ештеңе табылмады. Басқа сөзбен іздеп көріңіз.</p>
              ) : (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {results.map((r) => (
                    <button
                      key={r.url}
                      type="button"
                      onClick={() => onPick({ url: r.url, credit: r.credit })}
                      title={r.title}
                      className="group overflow-hidden rounded-xl bg-fill ring-accent transition hover:ring-4"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={r.url} alt={r.title} referrerPolicy="no-referrer" loading="lazy" className="aspect-[4/3] w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3 p-4">
            <p className="text-subhead text-label-2">
              Интернеттен суретті тауып, оны тышқанның оң жағымен басып, «Сурет мекенжайын көшіру» (Копировать адрес
              изображения) таңдаңыз. Содан кейін осында қойыңыз.
            </p>
            <input
              className={fieldClass}
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://…"
              aria-label="Суреттің сілтемесі"
              inputMode="url"
            />
            {link.trim() && !linkImage.success && (
              <p className="text-subhead text-orange">Сілтеме https:// деп басталуы керек</p>
            )}
            {linkImage.success && <RemoteImage image={linkImage.data} className="max-h-60" />}
            <Button size="lg" disabled={!linkImage.success} onClick={() => linkImage.success && onPick(linkImage.data)}>
              Суретті қосу
            </Button>
          </div>
        )}
      </div>
    </dialog>
  );
}
