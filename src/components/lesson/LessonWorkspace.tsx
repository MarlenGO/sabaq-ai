"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { topicPackageSchema, type TopicPackage } from "@/types/topic-package";
import type { GameId } from "@/games/registry";
import { useT } from "@/i18n/client";
import { getTemplate } from "@/slides/templates";
import { Card } from "@/components/ui/Card";
import { ArrowLeftIcon, CheckIcon, EyeIcon, GameIcon, PencilIcon, SlidesIcon } from "@/components/ui/Icons";
import { Button, buttonClass } from "@/components/ui/Button";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { SlideEditor } from "@/components/slides/SlideEditor";
import { SlidePreview } from "@/components/slides/SlidePreview";
import { DownloadPptxButton } from "@/components/slides/DownloadPptxButton";
import { TemplatePicker } from "@/components/slides/TemplatePicker";
import { DeckTypePicker, FillDeckButton } from "@/components/slides/DeckTypePicker";
import { GamesPanel } from "./GamesPanel";
import { AiProvider } from "./AiButton";

type Tab = "slides" | "games";
type Mode = "edit" | "preview";
type SaveState = "saved" | "saving" | "invalid" | "error";

const SAVE_DELAY_MS = 800;

interface LessonWorkspaceProps {
  initial: TopicPackage;
  /** Что учитель выбрал на главной: презентацию или игру. Показываем только это. */
  tab: Tab;
  /** Только просмотр (открыто из истории или чужой урок): без конструктора и настроек */
  readOnly: boolean;
  /** Чужой урок из библиотеки: вместо «Өзгерту» — «Көшіріп алу» */
  copyable?: boolean;
  /** Какую игру открыть сразу (из истории) */
  game?: GameId;
  /** Есть ли ключ AI — тогда в конструкторе видны кнопки «AI» */
  aiEnabled: boolean;
  /** Урок только что создан: «Артқа» спрашивает, оставить ли его в истории */
  isNew?: boolean;
}

// Рабочее место урока: презентация или игры (что выбрано на главной) и переключатель
// «Конструктор / Алдын ала көру». Правки сохраняются на сервер сами
// через секунду после последнего изменения.
export function LessonWorkspace({ initial, tab, readOnly, copyable, game, aiEnabled, isNew = false }: LessonWorkspaceProps) {
  const [lesson, setLesson] = useState(initial);
  const t = useT();
  const [editMode, setMode] = useState<Mode>("preview");
  const mode: Mode = readOnly ? "preview" : editMode;
  const base = `/lesson/${lesson.id}`;
  const otherTab = tab === "slides" ? "games" : "slides";
  const [save, setSave] = useState<SaveState>("saved");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Предупреждение, если закрыть вкладку до сохранения
  useEffect(() => {
    if (save === "saved") return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [save]);

  const update = (next: TopicPackage) => {
    setLesson(next);
    clearTimeout(timer.current);
    // Пустые поля сервер не примет, поэтому ждём, пока учитель их заполнит
    if (!topicPackageSchema.safeParse(next).success) return setSave("invalid");
    setSave("saving");
    timer.current = setTimeout(async () => {
      const response = await fetch(`/api/lessons/${next.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      }).catch(() => null);
      setSave(response?.ok ? "saved" : "error");
    }, SAVE_DELAY_MS);
  };

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-24 pt-6 sm:px-8">
      <BackButton lessonId={lesson.id} askToKeep={isNew && !readOnly} />

      <header className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-large font-bold tracking-tight">{lesson.topic}</h1>
          <p className="mt-1 text-subhead text-label-2">
            {t.subjects[lesson.subject]} · {t.common.grade(lesson.grade)} · {t.languages[lesson.language]}
          </p>
        </div>
        {copyable ? (
          <CopyButton lessonId={lesson.id} tab={tab} />
        ) : readOnly ? (
          <Link href={`${base}?tab=${tab}`} className={buttonClass("tinted", "lg")}>
            <PencilIcon />
            {t.lesson.editButton}
          </Link>
        ) : (
          <SaveStatus state={save} />
        )}
      </header>

      {lesson.source === "empty" && !readOnly && (
        <Card className="mt-4 bg-accent/10 p-4 text-subhead shadow-none">
          <b>{t.lesson.empty}</b> {t.lesson.emptyText}
        </Card>
      )}

      {lesson.source === "demo" && (
        <Card className="mt-4 bg-orange/12 p-4 text-subhead shadow-none">
          <b>{t.lesson.demo}</b> {t.lesson.demoText}
        </Card>
      )}

      {readOnly ? (
        <p className="mt-6 flex items-center gap-2 rounded-2xl bg-fill px-4 py-3 text-subhead text-label-2">
          <EyeIcon />
          {t.lesson.readOnly}
        </p>
      ) : (
        <div className="sticky top-14 z-40 -mx-4 mt-6 flex flex-wrap items-center justify-between gap-3 border-b border-separator bg-bg/85 px-4 py-3 backdrop-blur-xl">
          <SegmentedControl
            size="lg"
            ariaLabel={t.common.mode}
            value={mode}
            onChange={setMode}
            options={[
              { value: "edit", label: t.common.edit, icon: <PencilIcon /> },
              { value: "preview", label: t.common.preview, icon: <EyeIcon /> },
            ]}
          />
          {/* Вторая часть урока — тихой ссылкой: к презентации можно добавить игру.
              Со страницы игры ссылку на презентацию не показываем — учитель делает игру */}
          {tab === "slides" && (
          <Link
            href={`${base}?tab=${otherTab}`}
            className="inline-flex h-11 items-center gap-1.5 rounded-xl px-3 text-subhead font-semibold text-accent hover:bg-accent/10"
          >
            {otherTab === "games" ? <GameIcon /> : <SlidesIcon />}
            {otherTab === "games" ? t.lesson.makeGame : t.lesson.makeSlides}
          </Link>
          )}
        </div>
      )}

      <AiProvider lessonId={lesson.id} enabled={aiEnabled && !readOnly}>
        <div className="mt-6">
          {tab === "slides" ? (
            <div className="flex flex-col gap-6">
              {mode === "edit" ? (
                <>
                  <SlideEditor pkg={lesson} onChange={update} />
                  <DownloadPptxButton pkg={lesson} />
                </>
              ) : (
                <>
                  {!readOnly && (
                    <section className="flex flex-col gap-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <h2 className="text-title3 font-semibold">{t.lesson.chooseType}</h2>
                          <p className="mt-0.5 text-footnote text-label-2">{t.lesson.typeHint}</p>
                        </div>
                        <FillDeckButton pkg={lesson} onChange={update} />
                      </div>
                      <DeckTypePicker
                        value={lesson.deckType ?? "lesson"}
                        onChange={(deckType) => update({ ...lesson, deckType })}
                      />
                    </section>
                  )}
                  {!readOnly && (
                    <section>
                      <h2 className="mb-3 text-title3 font-semibold">{t.lesson.chooseTemplate}</h2>
                      <TemplatePicker
                        pkg={lesson}
                        value={getTemplate(lesson.templateId, lesson.subject, lesson.deckType).id}
                        onChange={(templateId) => update({ ...lesson, templateId })}
                      />
                    </section>
                  )}
                  <DownloadPptxButton pkg={lesson} />
                  <SlidePreview pkg={lesson} />
                </>
              )}
            </div>
          ) : (
            <GamesPanel
              lesson={lesson}
              mode={mode}
              readOnly={readOnly}
              initialGame={game}
              onChange={update}
              onJeopardyReady={(jeopardy, updatedAt) => setLesson({ ...lesson, jeopardy, updatedAt })}
            />
          )}
        </div>
      </AiProvider>
    </main>
  );
}

// Урок из библиотеки → своя копия, и сразу открываем её для правки
function CopyButton({ lessonId, tab }: { lessonId: string; tab: Tab }) {
  const t = useT();
  const router = useRouter();
  const [busy, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const copy = () =>
    startTransition(async () => {
      const response = await fetch(`/api/lessons/${lessonId}/copy`, { method: "POST" }).catch(() => null);
      const data = await response?.json().catch(() => null);
      if (response?.ok && data?.id) router.push(`/lesson/${data.id}?tab=${tab}`);
      else setError(data?.error ?? t.common.netError);
    });
  return (
    <div className="flex flex-col items-start gap-1 sm:items-end">
      <Button size="lg" variant="tinted" onClick={copy} disabled={busy}>
        <PencilIcon />
        {t.library.copy}
      </Button>
      {error && <p className="text-footnote text-red">{error}</p>}
    </div>
  );
}

function SaveStatus({ state }: { state: SaveState }) {
  const t = useT();
  const view: Record<SaveState, { text: string; className: string }> = {
    saved: { text: t.lesson.saved, className: "text-green" },
    saving: { text: t.lesson.saving, className: "text-label-2" },
    invalid: { text: t.lesson.invalid, className: "text-orange" },
    error: { text: t.lesson.saveError, className: "text-red" },
  };
  const { text, className } = view[state];
  return (
    <p role="status" className={`flex items-center gap-1.5 text-subhead font-medium ${className}`}>
      {state === "saved" && <CheckIcon />}
      {text}
    </p>
  );
}

/**
 * «Артқа» — на предыдущую страницу. У только что созданного урока сначала спрашиваем,
 * сохранить ли его в истории: иначе история засоряется пустыми пробными проектами.
 */
function BackButton({ lessonId, askToKeep }: { lessonId: string; askToKeep: boolean }) {
  const t = useT();
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const [deleting, startDelete] = useTransition();

  const goBack = () => {
    // Открыли урок по прямой ссылке — «назад» некуда, идём на главную
    if (window.history.length > 1) router.back();
    else router.push("/");
  };
  const discard = () =>
    startDelete(async () => {
      await fetch(`/api/lessons/${lessonId}`, { method: "DELETE" }).catch(() => null);
      dialog.current?.close();
      goBack();
    });

  return (
    <>
      <button
        type="button"
        onClick={() => (askToKeep ? dialog.current?.showModal() : goBack())}
        className="inline-flex h-11 items-center gap-1.5 rounded-full pr-3 text-subhead font-semibold text-accent hover:opacity-70"
      >
        <ArrowLeftIcon />
        {t.lesson.back}
      </button>
      <dialog
        ref={dialog}
        aria-labelledby="keep-title"
        className="m-auto w-[min(28rem,calc(100vw-2rem))] rounded-3xl bg-surface p-6 text-label shadow-2xl backdrop:bg-black/40"
      >
        <h2 id="keep-title" className="text-title3 font-bold">
          {t.lesson.keepTitle}
        </h2>
        <p className="mt-2 text-body text-label-2">{t.lesson.keepText}</p>
        <div className="mt-6 flex flex-col gap-2">
          <Button type="button" size="lg" onClick={goBack} disabled={deleting}>
            {t.lesson.keep}
          </Button>
          <Button type="button" variant="tinted" size="lg" onClick={discard} disabled={deleting} className="text-red!">
            {t.lesson.discard}
          </Button>
          <Button type="button" variant="plain" size="lg" onClick={() => dialog.current?.close()} disabled={deleting}>
            {t.lesson.stay}
          </Button>
        </div>
      </dialog>
    </>
  );
}
