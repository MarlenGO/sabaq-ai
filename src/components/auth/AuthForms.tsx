"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EyeIcon } from "@/components/ui/Icons";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { fieldClass } from "@/components/ui/field";
import { useT } from "@/i18n/client";

// Вход и регистрация на одной странице. Крупные поля, пароль можно показать,
// понятные сообщения об ошибках. После входа браузер помнит учителя год.

type Tab = "login" | "register";

export function AuthForms({ linkExpired }: { linkExpired: boolean }) {
  const t = useT();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("login");
  const [form, setForm] = useState({ name: "", login: "", password: "", invite: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(linkExpired ? t.auth.linkExpired : null);
  const [pending, setPending] = useState(false);
  const [busy, startTransition] = useTransition();
  const set = (patch: Partial<typeof form>) => {
    setForm({ ...form, ...patch });
    setError(null);
  };

  const submit = () =>
    startTransition(async () => {
      const body = tab === "login" ? { login: form.login, password: form.password } : form;
      const response = await fetch(`/api/auth/${tab}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).catch(() => null);
      const data = await response?.json().catch(() => null);
      if (!response?.ok) return setError(data?.error ?? t.common.netError);
      if (data?.status === "pending") return setPending(true);
      // Вошли: перечитываем страницу с сервера, чтобы панель увидела учителя
      router.replace("/");
      router.refresh();
    });

  if (pending) {
    return (
      <Card className="mt-8 flex w-full flex-col gap-3 p-6 text-center">
        <p className="text-title3 font-semibold">{t.auth.pendingTitle}</p>
        <p className="text-body text-label-2">{t.auth.pendingText}</p>
      </Card>
    );
  }

  const register = tab === "register";
  return (
    <Card className="mt-8 flex w-full flex-col gap-5 p-6">
      <div>
        <h1 className="text-title1 font-bold">{register ? t.auth.registerTitle : t.auth.loginTitle}</h1>
        <p className="mt-1 text-subhead text-label-2">{register ? t.auth.registerHint : t.auth.loginHint}</p>
      </div>
      <SegmentedControl
        size="lg"
        ariaLabel={t.auth.title}
        value={tab}
        onChange={(value) => {
          setTab(value);
          setError(null);
        }}
        options={[
          { value: "login", label: t.auth.loginTab },
          { value: "register", label: t.auth.registerTab },
        ]}
      />
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!busy) submit();
        }}
      >
        {register && (
          <Field label={t.auth.name}>
            <input className={fieldClass} value={form.name} onChange={(e) => set({ name: e.target.value })} autoComplete="name" required />
          </Field>
        )}
        <Field label={t.auth.login} hint={register ? t.auth.loginRule : undefined}>
          <input
            className={fieldClass}
            value={form.login}
            onChange={(e) => set({ login: e.target.value })}
            autoComplete="username"
            autoCapitalize="none"
            required
          />
        </Field>
        <Field label={t.auth.password} hint={register ? t.auth.passwordRule : undefined}>
          <div className="relative">
            <input
              className={`${fieldClass} pr-14`}
              type={showPassword ? "text" : "password"}
              value={form.password}
              onChange={(e) => set({ password: e.target.value })}
              autoComplete={register ? "new-password" : "current-password"}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? t.auth.hidePassword : t.auth.showPassword}
              title={showPassword ? t.auth.hidePassword : t.auth.showPassword}
              className={`absolute right-1.5 top-1.5 flex h-10 w-10 items-center justify-center rounded-lg transition hover:bg-fill ${
                showPassword ? "text-accent" : "text-label-2"
              }`}
            >
              <EyeIcon />
            </button>
          </div>
        </Field>
        {register && (
          <Field label={t.auth.invite} hint={t.auth.inviteHint}>
            <input className={fieldClass} value={form.invite} onChange={(e) => set({ invite: e.target.value })} autoCapitalize="characters" />
          </Field>
        )}
        {error && (
          <p role="alert" className="rounded-xl bg-red/10 px-4 py-3 text-subhead text-red">
            {error}
          </p>
        )}
        <Button type="submit" size="lg" disabled={busy}>
          {busy ? t.auth.wait : register ? t.auth.registerButton : t.auth.loginButton}
        </Button>
        {!register && <p className="text-center text-footnote text-label-2">{t.auth.forgot}</p>}
      </form>
    </Card>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-subhead font-semibold">{label}</span>
      {children}
      {hint && <span className="text-footnote text-label-2">{hint}</span>}
    </label>
  );
}
