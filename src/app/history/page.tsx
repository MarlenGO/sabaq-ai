import { Suspense } from "react";
import { connection } from "next/server";
import { buildHistory } from "@/lib/history";
import { HistoryList } from "@/components/history/HistoryList";
import { todayKeys } from "@/lib/dates";
import { getT } from "@/i18n/server";

export default async function HistoryPage() {
  const t = await getT();
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-24 pt-8">
      <title>{t.meta.history}</title>
      <h1 className="text-large font-bold tracking-tight">{t.history.title}</h1>
      <p className="mt-1 text-subhead text-label-2">{t.history.subtitle}</p>
      <div className="mt-6">
        <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-fill" />}>
          <History />
        </Suspense>
      </div>
    </main>
  );
}

// Читает файлы при каждом открытии страницы (connection), поэтому внутри Suspense
async function History() {
  await connection();
  const entries = await buildHistory();
  // «Бүгін» и «Кеше» считаем один раз здесь и передаём в браузер,
  // чтобы сервер и браузер подписали дни одинаково
  const { today, yesterday } = todayKeys();
  return <HistoryList entries={entries} today={today} yesterday={yesterday} />;
}
