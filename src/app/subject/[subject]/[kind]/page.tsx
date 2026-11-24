import { Suspense } from "react";
import { notFound } from "next/navigation";
import { subjectSchema } from "@/types/topic-package";
import { createKindIds, kindOf } from "@/data/catalog";
import { CreateForm } from "@/components/home/CreateForm";
import { DocumentWorkspace } from "@/components/documents/DocumentWorkspace";

// Создание: предмет и вид (документ, презентация или игра) уже выбраны — осталось
// написать тему, выбрать класс и язык. Адрес: /subject/physics/lesson, /subject/physics/quiz.
// У документа страница шире: слева узкая форма, справа предпросмотр листа.
export const generateStaticParams = () =>
  subjectSchema.options.flatMap((subject) =>
    createKindIds.map((kind) => ({ subject, kind })),
  );

type Params = PageProps<"/subject/[subject]/[kind]">["params"];

export default function CreatePage({ params }: { params: Params }) {
  return (
    <main className="mx-auto w-full max-w-[96rem] flex-1 px-4 pb-24 pt-6 sm:px-8">
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
  if (kind.type === "doc") return <DocumentWorkspace subject={subject.data} kind={kind.id} />;
  return (
    <div className="mx-auto max-w-4xl">
      <CreateForm subject={subject.data} kind={kind} />
    </div>
  );
}
