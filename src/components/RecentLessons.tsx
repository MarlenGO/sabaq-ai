import Link from "next/link";
import { connection } from "next/server";
import { listLessons } from "@/lib/storage/lessons";
import { getT } from "@/i18n/server";
import { dateOf } from "@/lib/dates";
import { Card } from "@/components/ui/Card";

// «Менің сабақтарым»: последние уроки, чтобы вернуться к ним одним нажатием.
// connection() говорит Next.js читать файлы при каждом запросе, а не один раз при сборке.
export async function RecentLessons() {
  await connection();
  const lessons = await listLessons(6);
  const t = await getT();
  if (lessons.length === 0) return null;

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
