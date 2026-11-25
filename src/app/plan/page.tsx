import { Suspense } from "react";
import { connection } from "next/server";
import { getT } from "@/i18n/server";
import { requireUser } from "@/lib/auth";
import { listPlans } from "@/lib/storage/plans";
import { PlanPage } from "@/components/plan/PlanPage";

// «Жоспар»: КТП учителя — загрузка файла, проверка, список уроков и ҚМЖ одной кнопкой
export default async function Page() {
  const t = await getT();
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-24 pt-8 sm:px-8">
      <title>{t.plan.title}</title>
      <h1 className="text-large font-bold tracking-tight">{t.plan.title}</h1>
      <p className="mt-1 text-subhead text-label-2">{t.plan.subtitle}</p>
      <div className="mt-6">
        <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-fill" />}>
          <Plans />
        </Suspense>
      </div>
    </main>
  );
}

// Планы читаются из базы при каждом открытии (connection), поэтому внутри Suspense
async function Plans() {
  await connection();
  const user = await requireUser();
  return <PlanPage initialPlans={await listPlans(user.id)} />;
}
