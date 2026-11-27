import { Suspense } from "react";
import { connection } from "next/server";
import { getT } from "@/i18n/server";
import { requireUser } from "@/lib/auth";
import { listDocuments } from "@/lib/storage/my-documents";
import { MyDocuments } from "@/components/documents/MyDocuments";

// «Менің құжаттарым»: все документы учителя с его правками — поиск, фильтр, открыть, удалить
export default async function Page() {
  const t = await getT();
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-24 pt-8 sm:px-8">
      <title>{t.myDocs.title}</title>
      <h1 className="text-large font-bold tracking-tight">{t.myDocs.title}</h1>
      <p className="mt-1 text-subhead text-label-2">{t.myDocs.subtitle}</p>
      <div className="mt-6">
        <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-fill" />}>
          <Documents />
        </Suspense>
      </div>
    </main>
  );
}

// Читает базу при каждом открытии (connection), поэтому внутри Suspense.
// Таблицы ещё нет (SQL не запущен) — показываем пустой список, а не ошибку
async function Documents() {
  await connection();
  const user = await requireUser();
  const documents = await listDocuments(user.id).catch(() => []);
  return <MyDocuments initial={documents} />;
}
