import Link from "next/link";
import { notFound } from "next/navigation";
import { questionStats, sortResults, toResult } from "@/lib/rooms";
import { getRoomWithOwner, listPlayers } from "@/lib/storage/rooms";
import { requireUser } from "@/lib/auth";
import { Card } from "@/components/ui/Card";
import { ArrowLeftIcon } from "@/components/ui/Icons";
import { CsvButton, QuestionStats, ResultsTable } from "@/components/games/ResultsTable";
import { dateTimeOf } from "@/lib/dates";
import { getT } from "@/i18n/server";

// Результаты прошедшей QR-игры: можно снова посмотреть таблицу и скачать её в Excel
export default async function PastGamePage({ params }: PageProps<"/history/game/[code]">) {
  const { code } = await params;
  const user = await requireUser();
  const found = await getRoomWithOwner(code);
  // Чужие результаты не показываем (админу — можно)
  if (!found || (found.ownerId !== user.id && user.role !== "admin")) notFound();
  const room = found.room;
  const t = await getT();

  const players = await listPlayers(code);
  const results = sortResults(players.map(toResult));
  const total = room.questions.length;
  const when = dateTimeOf(room.createdAt);

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-24 pt-6">
      <Link href="/history" className="inline-flex items-center gap-1.5 text-subhead font-medium text-accent hover:opacity-70">
        <ArrowLeftIcon />
        {t.history.title}
      </Link>
      <h1 className="mt-4 text-large font-bold tracking-tight">{room.title}</h1>
      <p className="mt-1 text-subhead text-label-2">
        {t.history.viaQr(t.games[room.game].title)} · {when}
        {room.status === "open" && ` · ${t.history.stillOpen}`}
      </p>

      <Card className="mt-6 flex flex-col p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-title3 font-semibold">
            {t.history.results} <span className="text-label-2">· {t.room.students(results.length)}</span>
          </h2>
          <div className="flex flex-wrap gap-2">
            <CsvButton code={code} game={room.game} total={total} results={results} />
            <Link
              href={`/lesson/${room.lessonId}?view=1&game=${room.game}`}
              className="inline-flex h-11 items-center rounded-xl px-4 text-subhead font-semibold text-accent hover:opacity-70"
            >
              {t.history.openLesson}
            </Link>
          </div>
        </div>
        {results.length === 0 ? (
          <p className="py-14 text-center text-body text-label-2">{t.history.nobodyPlayed}</p>
        ) : (
          <div className="mt-4">
            <ResultsTable results={results} total={total} game={room.game} />
          </div>
        )}
      </Card>
      {results.length > 0 && (
        <div className="mt-6">
          <QuestionStats stats={questionStats(room, players)} />
        </div>
      )}
    </main>
  );
}
