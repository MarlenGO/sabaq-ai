"use client";

import { useEffect, useRef, useState } from "react";
import { imageSchema, type QuestionImage } from "@/types/topic-package";
import type { ImageResult } from "@/app/api/images/route";
import { Button } from "@/components/ui/Button";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { XIcon } from "@/components/ui/Icons";
import { RemoteImage } from "@/components/ui/RemoteImage";
import { fieldClass } from "@/components/ui/field";
import { useT } from "@/i18n/client";

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
  const t = useT();

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
    else setError(data?.error ?? t.image.searchError);
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
            ariaLabel={t.image.source}
            value={tab}
            onChange={setTab}
            options={[
              { value: "search", label: t.image.search },
              { value: "link", label: t.image.link },
            ]}
          />
          <button
            type="button"
            onClick={() => dialog.current?.close()}
            aria-label={t.common.close}
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
                placeholder={t.image.searchPlaceholder}
                aria-label={t.image.searchLabel}
                autoFocus
              />
              <Button type="submit" size="lg" disabled={loading || !query.trim()}>
                {loading ? "…" : t.image.search}
              </Button>
            </form>
            {error && <p className="text-subhead text-red">{error}</p>}
            <div className="min-h-0 flex-1 overflow-y-auto">
              {results === null ? (
                <p className="py-10 text-center text-subhead text-label-2">
                  {t.image.searchHint}
                </p>
              ) : results.length === 0 ? (
                <p className="py-10 text-center text-subhead text-label-2">{t.image.nothing}</p>
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
              {t.image.linkHint}
            </p>
            <input
              className={fieldClass}
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://…"
              aria-label={t.image.linkLabel}
              inputMode="url"
            />
            {link.trim() && !linkImage.success && (
              <p className="text-subhead text-orange">{t.image.linkHttps}</p>
            )}
            {linkImage.success && <RemoteImage image={linkImage.data} className="max-h-60" />}
            <Button size="lg" disabled={!linkImage.success} onClick={() => linkImage.success && onPick(linkImage.data)}>
              {t.image.addThis}
            </Button>
          </div>
        )}
      </div>
    </dialog>
  );
}
