import Link from "next/link";
import { connection } from "next/server";
import { listFeatured, listLessons, type LessonSummary } from "@/lib/storage/lessons";
import { currentUser } from "@/lib/auth";
import { getT } from "@/i18n/server";
import { dateOf } from "@/lib/dates";
import { Card } from "@/components/ui/Card";

// «Менің сабақтарым»: последние уроки, чтобы вернуться к ним одним нажатием.
// connection() говорит Next.js читать базу при каждом запросе, а не один раз при сборке.
export async function RecentLessons() {
  await connection();
  const user = await currentUser();
  if (!user) return null;
  const [lessons, library] = await Promise.all([listLessons(user.id, 6), listFeatured()]);
  const t = await getT();
  return (
    <>
      {lessons.length > 0 && <MyLessons lessons={lessons} t={t} />}
      {library.length > 0 && <Library lessons={library} t={t} />}
    </>
  );
}

type T = Awaited<ReturnType<typeof getT>>;

function MyLessons({ lessons, t }: { lessons: LessonSummary[]; t: T }) {

  return (
    <section className="mt-16">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-title1 font-bold tracking-tight">{t.home.myLessons}</h2>
        <Link href="/history" className="text-subhead font-semibold text-accent hover:opacity-70">
          {t.home.allHistory}
        </Link>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {lessons.map((lesson) => (
          <Link key={lesson.id} href={`/lesson/${lesson.id}`} className="group">
            <Card className="h-full p-5 transition group-hover:ring-2 group-hover:ring-accent/40">
              <p className="text-body font-semibold">{lesson.topic}</p>
              <p className="mt-1 text-footnote text-label-2">
                {t.subjects[lesson.subject]} · {t.common.grade(lesson.grade)} ·{" "}
                {dateOf(lesson.updatedAt)}
              </p>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}

// Библиотека: образцовые уроки, которые отметили админы. Открыть, посмотреть и забрать себе копию.
function Library({ lessons, t }: { lessons: LessonSummary[]; t: T }) {
  return (
    <section className="mt-16">
      <h2 className="text-title1 font-bold tracking-tight">{t.library.title}</h2>
      <p className="mt-1.5 text-subhead text-label-2">{t.library.subtitle}</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {lessons.slice(0, 8).map((lesson) => (
          <Link key={lesson.id} href={`/lesson/${lesson.id}`} className="group">
            <Card className="h-full p-5 transition group-hover:ring-2 group-hover:ring-accent/40">
              <p className="text-body font-semibold">{lesson.topic}</p>
              <p className="mt-1 text-footnote text-label-2">
                {t.subjects[lesson.subject]} · {t.common.grade(lesson.grade)}
                {lesson.ownerName && ` · ${lesson.ownerName}`}
              </p>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
