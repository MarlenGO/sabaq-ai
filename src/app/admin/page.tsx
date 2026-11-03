import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { connection } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { loadErrors, loadLibrary, loadStats, loadUsage, loadUsers } from "@/lib/admin";
import { dateOf, dateTimeOf } from "@/lib/dates";
import { getT } from "@/i18n/server";
import { Card } from "@/components/ui/Card";
import { AdminUsers } from "@/components/admin/AdminUsers";
import { AdminLibrary } from "@/components/admin/AdminLibrary";
import type { DeckType, Subject } from "@/types/topic-package";
import type { GameId } from "@/games/registry";

// Админка: учителя, расход AI, ошибки, статистика, библиотека. Только для роли admin.
const tabs = ["users", "ai", "errors", "stats", "library"] as const;
type Tab = (typeof tabs)[number];
type T = Awaited<ReturnType<typeof getT>>;

export default async function AdminPage({ searchParams }: PageProps<"/admin">) {
  const t = await getT();
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-24 pt-8">
      <title>{t.admin.title}</title>
      <h1 className="text-large font-bold tracking-tight">{t.admin.title}</h1>
      <Suspense fallback={<div className="mt-6 h-96 animate-pulse rounded-2xl bg-fill" />}>
        <Admin searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function Admin({ searchParams }: { searchParams: PageProps<"/admin">["searchParams"] }) {
  await connection();
  const admin = await requireAdmin();
  const t = await getT();
  const { tab: raw } = await searchParams;
  const tab: Tab = tabs.includes(raw as Tab) ? (raw as Tab) : "users";

  return (
    <>
      <nav aria-label={t.admin.title} className="mt-6 flex flex-wrap gap-2">
        {tabs.map((id) => (
          <Link
            key={id}
            href={`/admin?tab=${id}`}
            aria-current={id === tab ? "page" : undefined}
            className={`flex h-11 items-center rounded-full px-5 text-subhead font-semibold transition ${
              id === tab ? "bg-accent text-white" : "bg-fill text-label hover:bg-accent/15"
            }`}
          >
            {t.admin.tabs[id]}
          </Link>
        ))}
      </nav>
      <div className="mt-6">
        {tab === "users" && <UsersTab selfId={admin.id} />}
        {tab === "ai" && <AiTab t={t} />}
        {tab === "errors" && <ErrorsTab t={t} />}
        {tab === "stats" && <StatsTab t={t} />}
        {tab === "library" && <AdminLibrary lessons={await loadLibrary()} />}
      </div>
    </>
  );
}

async function UsersTab({ selfId }: { selfId: string }) {
  const { users, invites, defaultLimit } = await loadUsers();
  // Даты форматируем на сервере: так они совпадут с тем, что увидит браузер
  const dates = Object.fromEntries(
    users.flatMap((u) => [u.created_at, u.last_seen_at]).flatMap((d) => (d ? [[d, dateOf(d)]] : [])),
  );
  return <AdminUsers users={users} invites={invites} defaultLimit={defaultLimit} selfId={selfId} dates={dates} />;
}

async function AiTab({ t }: { t: T }) {
  const usage = await loadUsage();
  const max = Math.max(1, ...usage.days.map((d) => d.ok + d.failed));
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <Tile label={t.admin.aiTodayTotal} value={usage.today} />
        <Tile label={t.admin.aiWeek} value={usage.week} />
        <Tile label={t.admin.aiFailedWeek} value={usage.failedWeek} tone={usage.failedWeek > 0 ? "text-red" : undefined} />
      </div>
      <Card className="p-5">
        <h2 className="text-title3 font-semibold">{t.admin.byDay}</h2>
        <div className="mt-4 flex h-44 items-end gap-3">
          {usage.days.map((d) => (
            <div key={d.day} className="flex flex-1 flex-col items-center gap-1.5">
              <span className="text-footnote font-semibold tabular-nums">{d.ok}</span>
              <div className="flex w-full flex-col justify-end overflow-hidden rounded-lg bg-fill" style={{ height: "7rem" }}>
                <div className="w-full bg-red" style={{ height: `${(d.failed / max) * 100}%` }} />
                <div className="w-full bg-accent" style={{ height: `${(d.ok / max) * 100}%` }} />
              </div>
              <span className="text-caption text-label-2">{dateOf(d.day).slice(0, 5)}</span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-footnote text-label-2">{t.admin.byDayHint}</p>
      </Card>
      <Card className="p-5">
        <h2 className="text-title3 font-semibold">{t.admin.byTeacher}</h2>
        {usage.byUser.length === 0 ? (
          <p className="mt-3 text-body text-label-2">{t.admin.nothingYet}</p>
        ) : (
          <ul className="mt-3 flex flex-col divide-y divide-separator">
            {usage.byUser.map((u) => (
              <li key={u.id} className="flex items-center justify-between gap-3 py-2.5">
                <span className="text-body font-semibold">{u.name}</span>
                <span className="text-subhead text-label-2 tabular-nums">{t.admin.todayWeek(u.today, u.limit, u.week)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
      {usage.byKind.length > 0 && (
        <Card className="p-5">
          <h2 className="text-title3 font-semibold">{t.admin.byKind}</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {usage.byKind.map((k) => (
              <li key={k.kind} className="rounded-full bg-fill px-4 py-2 text-subhead">
                {t.admin.kinds[k.kind as keyof T["admin"]["kinds"]] ?? k.kind}: <b>{k.n}</b>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

async function ErrorsTab({ t }: { t: T }) {
  const errors = await loadErrors();
  if (errors.length === 0) return <Card className="p-8 text-center text-body text-label-2">{t.admin.noErrors}</Card>;
  return (
    <div className="flex flex-col gap-3">
      <p className="text-body text-label-2">{t.admin.errorsHint}</p>
      {errors.map((e, i) => (
        <Card key={i} className="flex flex-col gap-1 p-4">
          <p className="text-footnote text-label-2">
            {dateTimeOf(e.at)} · {e.name} · {t.admin.kinds[e.kind] ?? e.kind}
          </p>
          <p className="font-mono text-subhead text-red">{e.error ?? "—"}</p>
        </Card>
      ))}
    </div>
  );
}

async function StatsTab({ t }: { t: T }) {
  const s = await loadStats();
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <Tile label={t.admin.statUsers} value={s.activeTeachers} hint={s.pending ? t.admin.statPending(s.pending) : undefined} />
        <Tile label={t.admin.statLessons} value={s.lessons} hint={t.admin.statWeek(s.lessonsWeek)} />
        <Tile label={t.admin.statPptx} value={s.pptx} />
        <Tile label={t.admin.statQr} value={s.qrGames} />
        <Tile label={t.admin.statPlayers} value={s.players} />
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        <Bars title={t.admin.statTypes} rows={s.byType.map((r) => ({ label: t.deckTypes[r.key as DeckType]?.name ?? r.key, n: r.n }))} />
        <Bars title={t.admin.statSubjects} rows={s.bySubject.map((r) => ({ label: t.subjects[r.key as Subject] ?? r.key, n: r.n }))} />
        <Bars title={t.admin.statGames} rows={s.byGame.map((r) => ({ label: t.games[r.key as GameId]?.title ?? r.key, n: r.n }))} />
      </div>
    </div>
  );
}

function Tile({ label, value, hint, tone }: { label: string; value: number; hint?: string; tone?: string }) {
  return (
    <Card className="p-5">
      <p className="text-subhead text-label-2">{label}</p>
      <p className={`mt-1 text-large font-bold tabular-nums ${tone ?? ""}`}>{value}</p>
      {hint && <p className="mt-0.5 text-footnote text-label-2">{hint}</p>}
    </Card>
  );
}

function Bars({ title, rows }: { title: string; rows: { label: string; n: number }[] }): ReactNode {
  const max = Math.max(1, ...rows.map((r) => r.n));
  return (
    <Card className="p-5">
      <h2 className="text-title3 font-semibold">{title}</h2>
      <ul className="mt-3 flex flex-col gap-2.5">
        {rows.slice(0, 8).map((r) => (
          <li key={r.label} className="flex flex-col gap-1">
            <span className="flex justify-between text-subhead">
              <span>{r.label}</span>
              <b className="tabular-nums">{r.n}</b>
            </span>
            <span className="h-2 overflow-hidden rounded-full bg-fill">
              <span className="block h-full rounded-full bg-accent" style={{ width: `${(r.n / max) * 100}%` }} />
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
