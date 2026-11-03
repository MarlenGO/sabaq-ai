"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type ReactNode } from "react";
import type { AdminUser, Invite } from "@/lib/admin";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PlusIcon } from "@/components/ui/Icons";
import { fieldClass } from "@/components/ui/field";
import { useT } from "@/i18n/client";

// Учителя: кто ждёт одобрения, кто работает; действия одной кнопкой.
// После каждого действия перечитываем страницу с сервера (router.refresh).

async function call(url: string, method: string, body?: unknown) {
  const response = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  }).catch(() => null);
  const data = await response?.json().catch(() => null);
  return { ok: Boolean(response?.ok), data };
}

interface Props {
  users: AdminUser[];
  invites: Invite[];
  defaultLimit: number;
  selfId: string;
  dates: Record<string, string>;
}

export function AdminUsers({ users, invites, defaultLimit, selfId, dates }: Props) {
  const t = useT();
  const router = useRouter();
  const [busy, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [link, setLink] = useState<{ name: string; url: string } | null>(null);

  const run = (task: () => Promise<{ ok: boolean; data: { error?: string } | null }>) =>
    startTransition(async () => {
      setError(null);
      const result = await task();
      if (!result.ok) setError(result.data?.error ?? t.common.netError);
      router.refresh();
    });
  const patch = (id: string, body: object) => run(() => call(`/api/admin/users/${id}`, "PATCH", body));

  return (
    <div className="flex flex-col gap-6">
      {error && (
        <p role="alert" className="rounded-xl bg-red/10 px-4 py-3 text-subhead text-red">
          {error}
        </p>
      )}

      {link && (
        <Card className="flex flex-col gap-3 bg-green/10 p-5 shadow-none">
          <p className="text-body font-semibold">{t.admin.linkFor(link.name)}</p>
          <p className="text-subhead text-label-2">{t.admin.linkHint}</p>
          <input readOnly value={link.url} className={`${fieldClass} font-mono text-footnote`} onFocus={(e) => e.target.select()} />
          <div className="flex gap-2">
            <Button onClick={() => navigator.clipboard?.writeText(link.url)}>{t.admin.copyLink}</Button>
            <Button variant="plain" onClick={() => setLink(null)}>
              {t.common.close}
            </Button>
          </div>
        </Card>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-title2 font-bold">
          {t.admin.users} <span className="text-label-2">· {users.length}</span>
        </h2>
        {users.map((user) => {
          const self = user.id === selfId;
          return (
            <Card key={user.id} className="flex flex-col gap-3 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-body font-semibold">
                    {user.name} {self && <span className="text-label-2">({t.admin.you})</span>}
                  </p>
                  <p className="text-footnote text-label-2">
                    {user.login} · {t.admin.registered} {dates[user.created_at]}
                    {user.last_seen_at && ` · ${t.admin.lastSeen} ${dates[user.last_seen_at]}`}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <Badge tone={user.role === "admin" ? "purple" : "gray"}>{t.admin.roles[user.role]}</Badge>
                  <Badge tone={user.status === "active" ? "green" : user.status === "pending" ? "orange" : "red"}>
                    {t.admin.statuses[user.status]}
                  </Badge>
                </div>
              </div>
              <p className="text-subhead text-label-2">
                {t.admin.lessonsCount(user.lessons)} · {t.admin.aiToday(user.aiToday, user.limit)}
              </p>
              <div className="flex flex-wrap gap-2">
                {user.status === "pending" && (
                  <Button disabled={busy} onClick={() => patch(user.id, { status: "active" })}>
                    {t.admin.approve}
                  </Button>
                )}
                {user.status !== "pending" && !self && (
                  <Button
                    variant="tinted"
                    disabled={busy}
                    onClick={() =>
                      (user.status === "blocked" || window.confirm(t.admin.confirmBlock(user.name))) &&
                      patch(user.id, { status: user.status === "blocked" ? "active" : "blocked" })
                    }
                  >
                    {user.status === "blocked" ? t.admin.unblock : t.admin.block}
                  </Button>
                )}
                {!self && (
                  <Button
                    variant="tinted"
                    disabled={busy}
                    onClick={() => patch(user.id, { role: user.role === "admin" ? "teacher" : "admin" })}
                  >
                    {user.role === "admin" ? t.admin.makeTeacher : t.admin.makeAdmin}
                  </Button>
                )}
                <Button
                  variant="tinted"
                  disabled={busy || user.status !== "active"}
                  onClick={() =>
                    startTransition(async () => {
                      const result = await call(`/api/admin/users/${user.id}/link`, "POST");
                      if (result.ok && result.data?.url) setLink({ name: user.name, url: result.data.url });
                      else setError(result.data?.error ?? t.common.netError);
                    })
                  }
                >
                  {t.admin.loginLink}
                </Button>
                <Button
                  variant="tinted"
                  disabled={busy}
                  onClick={() => {
                    const password = window.prompt(t.admin.newPassword(user.name));
                    if (password && password.length >= 4) patch(user.id, { password });
                  }}
                >
                  {t.admin.resetPassword}
                </Button>
                {user.role === "teacher" && (
                  <Button
                    variant="tinted"
                    disabled={busy}
                    onClick={() => {
                      const answer = window.prompt(t.admin.limitPrompt(defaultLimit), String(user.limit ?? defaultLimit));
                      if (answer === null) return;
                      const value = answer.trim() === "" ? null : Number(answer);
                      if (value === null || (Number.isInteger(value) && value >= 0)) patch(user.id, { daily_limit: value });
                    }}
                  >
                    {t.admin.limit}
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <CreateUser busy={busy} run={run} />
        <Invites invites={invites} busy={busy} run={run} />
      </div>
    </div>
  );
}

type Run = (task: () => Promise<{ ok: boolean; data: { error?: string } | null }>) => void;

// Админ сам заводит учителя: например, маме — логин «mama» и короткий пароль
function CreateUser({ busy, run }: { busy: boolean; run: Run }) {
  const t = useT();
  const empty = { name: "", login: "", password: "", role: "teacher" as "teacher" | "admin" };
  const [form, setForm] = useState(empty);
  return (
    <Card className="flex flex-col gap-3 p-5">
      <h2 className="text-title3 font-semibold">{t.admin.createUser}</h2>
      <p className="text-footnote text-label-2">{t.admin.createHint}</p>
      <form
        className="flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          run(async () => {
            const result = await call("/api/admin/users", "POST", form);
            if (result.ok) setForm(empty);
            return result;
          });
        }}
      >
        <input className={fieldClass} placeholder={t.auth.name} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <input
          className={fieldClass}
          placeholder={t.auth.login}
          value={form.login}
          autoCapitalize="none"
          onChange={(e) => setForm({ ...form, login: e.target.value })}
          required
        />
        <input
          className={fieldClass}
          placeholder={t.auth.password}
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          minLength={4}
          required
        />
        <select className={fieldClass} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as "teacher" | "admin" })}>
          <option value="teacher">{t.admin.roles.teacher}</option>
          <option value="admin">{t.admin.roles.admin}</option>
        </select>
        <Button type="submit" disabled={busy}>
          <PlusIcon />
          {t.admin.create}
        </Button>
      </form>
    </Card>
  );
}

function Invites({ invites, busy, run }: { invites: Invite[]; busy: boolean; run: Run }) {
  const t = useT();
  const [code, setCode] = useState("");
  return (
    <Card className="flex flex-col gap-3 p-5">
      <h2 className="text-title3 font-semibold">{t.admin.invites}</h2>
      <p className="text-footnote text-label-2">{t.admin.invitesHint}</p>
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          run(async () => {
            const result = await call("/api/admin/invites", "POST", { code: code.trim() || undefined });
            if (result.ok) setCode("");
            return result;
          });
        }}
      >
        <input className={fieldClass} placeholder={t.admin.inviteAuto} value={code} onChange={(e) => setCode(e.target.value)} />
        <Button type="submit" disabled={busy}>
          {t.admin.create}
        </Button>
      </form>
      <ul className="flex flex-col divide-y divide-separator">
        {invites.map((invite) => (
          <li key={invite.code} className="flex items-center justify-between gap-2 py-2">
            <span>
              <b className="font-mono">{invite.code}</b>{" "}
              <span className="text-footnote text-label-2">{t.admin.inviteUses(invite.uses)}</span>
            </span>
            <Button
              variant="plain"
              className="text-red"
              disabled={busy}
              onClick={() =>
                window.confirm(t.common.confirmDelete(invite.code)) &&
                run(() => call(`/api/admin/invites/${encodeURIComponent(invite.code)}`, "DELETE"))
              }
            >
              {t.common.delete}
            </Button>
          </li>
        ))}
      </ul>
    </Card>
  );
}

const tones = {
  green: "bg-green/15 text-green",
  orange: "bg-orange/15 text-orange",
  red: "bg-red/15 text-red",
  purple: "bg-purple/15 text-purple",
  gray: "bg-fill text-label-2",
};

export function Badge({ tone, children }: { tone: keyof typeof tones; children: ReactNode }) {
  return <span className={`rounded-full px-2.5 py-1 text-footnote font-semibold ${tones[tone]}`}>{children}</span>;
}
