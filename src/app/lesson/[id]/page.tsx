import { Suspense } from "react";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { canWrite, getLessonFor } from "@/lib/storage/lessons";
import { games, type GameId } from "@/games/registry";
import { LessonWorkspace } from "@/components/lesson/LessonWorkspace";
import { hasAiKey } from "@/lib/ai/gemini";

// ?tab=slides|games — что открыть, ?view=1 — только просмотр (из истории),
// ?game=quiz — какую игру показать сразу. Чужой урок (из библиотеки) —
// только просмотр с кнопкой «Көшіріп алу».
export default function LessonPage(props: PageProps<"/lesson/[id]">) {
  return (
    <Suspense fallback={<div className="mx-auto mt-8 h-96 w-full max-w-5xl animate-pulse rounded-2xl bg-fill" />}>
      <Lesson {...props} />
    </Suspense>
  );
}

async function Lesson({ params, searchParams }: PageProps<"/lesson/[id]">) {
  const user = await requireUser();
  const { id } = await params;
  const { tab, view, game } = await searchParams;
  const record = await getLessonFor(user, id);
  if (!record) notFound();
  const own = canWrite(user, record);

  const gameId = games.find((g) => g.id === game)?.id as GameId | undefined;
  return (
    <LessonWorkspace
      initial={record.lesson}
      tab={tab === "games" || gameId ? "games" : "slides"}
      readOnly={view === "1" || !own}
      copyable={!own}
      game={gameId}
      aiEnabled={hasAiKey()}
    />
  );
}
