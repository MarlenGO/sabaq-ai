import { Suspense } from "react";
import { notFound } from "next/navigation";
import { subjectSchema } from "@/types/topic-package";
import { deckTypeOrder } from "@/slides/structures";
import { games } from "@/games/registry";
import { kindOf } from "@/data/catalog";
import { CreateForm } from "@/components/home/CreateForm";

// Создание: предмет и вид (презентация или игра) уже выбраны — осталось
// написать тему, выбрать класс и язык. Адрес: /subject/physics/lesson, /subject/physics/quiz
export const generateStaticParams = () =>
  subjectSchema.options.flatMap((subject) =>
    [...deckTypeOrder, ...games.map((g) => g.id)].map((kind) => ({ subject, kind })),
  );

type Params = PageProps<"/subject/[subject]/[kind]">["params"];

export default function CreatePage({ params }: { params: Params }) {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-24 pt-6 sm:px-6">
      <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-fill" />}>
        <Form params={params} />
      </Suspense>
    </main>
  );
}

async function Form({ params }: { params: Params }) {
  const { subject: rawSubject, kind: rawKind } = await params;
  const subject = subjectSchema.safeParse(rawSubject);
  const kind = kindOf(rawKind);
  if (!subject.success || !kind) notFound();
  return <CreateForm subject={subject.data} kind={kind} />;
}
