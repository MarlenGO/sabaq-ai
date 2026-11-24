import { Suspense } from "react";
import { notFound } from "next/navigation";
import { subjectSchema } from "@/types/topic-package";
import { SubjectMenu } from "@/components/home/SubjectMenu";

// Страница предмета: строка «Презентация» (виды презентаций) и строка «Ойындар».
// Нажали на карточку — /subject/<предмет>/<вид или игра>, там тема и класс.

// Предметов немного — страницы собираются заранее, при сборке сайта
export const generateStaticParams = () => subjectSchema.options.map((subject) => ({ subject }));

export default function SubjectPage({ params }: PageProps<"/subject/[subject]">) {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-24 pt-6 sm:px-6">
      {/* Адрес страницы — «данные запроса», в Next.js 16 их читают внутри Suspense */}
      <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-fill" />}>
        <Menu params={params} />
      </Suspense>
    </main>
  );
}

async function Menu({ params }: { params: PageProps<"/subject/[subject]">["params"] }) {
  const subject = subjectSchema.safeParse((await params).subject);
  if (!subject.success) notFound();
  return <SubjectMenu subject={subject.data} />;
}
