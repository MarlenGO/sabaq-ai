import { Suspense } from "react";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { hasDb } from "@/lib/db";
import { getT } from "@/i18n/server";
import { Card } from "@/components/ui/Card";
import { Logo } from "@/components/ui/Logo";
import { AuthForms } from "@/components/auth/AuthForms";

// Страница входа и регистрации. Если уже вошли — сразу на главную.
export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const t = await getT();
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center px-4 pb-24 pt-12">
      <title>{t.auth.title}</title>
      <Logo />
      <Suspense fallback={<Card className="mt-8 h-96 w-full animate-pulse" />}>
        <Gate searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function Gate({ searchParams }: { searchParams: PageProps<"/login">["searchParams"] }) {
  if (await currentUser().catch(() => null)) redirect("/");
  const t = await getT();
  const { link } = await searchParams;
  if (!hasDb()) return <Card className="mt-8 w-full p-6 text-body text-red">{t.auth.noDb}</Card>;
  return <AuthForms linkExpired={link === "expired"} />;
}
