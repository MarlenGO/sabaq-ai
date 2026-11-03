import { notFound } from "next/navigation";
import { getLesson } from "@/lib/storage/lessons";
import { games, type GameId } from "@/games/registry";
import { LessonWorkspace } from "@/components/lesson/LessonWorkspace";

// ?tab=slides|games — что открыть, ?view=1 — только просмотр (из истории),
// ?game=quiz — какую игру показать сразу
export default async function LessonPage({ params, searchParams }: PageProps<"/lesson/[id]">) {
  const { id } = await params;
  const { tab, view, game } = await searchParams;
  const lesson = await getLesson(id);
  if (!lesson) notFound();

  const gameId = games.find((g) => g.id === game)?.id as GameId | undefined;
  return (
    <LessonWorkspace
      initial={lesson}
      tab={tab === "games" || gameId ? "games" : "slides"}
      readOnly={view === "1"}
      game={gameId}
    />
  );
}
