import Link from "next/link";
import type { ReactNode } from "react";
import { getT } from "@/i18n/server";
import { currentUser } from "@/lib/auth";
import { ClockIcon, GridIcon, PencilIcon } from "@/components/ui/Icons";
import { Logo } from "@/components/ui/Logo";
import { LanguageSwitch, TextSizeControl, ThemeToggle } from "@/components/ui/PreferenceControls";

// Полупрозрачная панель с размытием фона, как в Safari и Finder.
// Ссылки видны только вошедшему учителю; «Әкімші» — только админам.
export async function NavBar() {
  const t = await getT();
  const user = await currentUser().catch(() => null);
  return (
    <header className="sticky top-0 z-50 border-b border-separator bg-glass backdrop-blur-xl backdrop-saturate-150">
      <nav className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-2 px-4">
        <Link href="/" aria-label={t.nav.home}>
          <Logo />
        </Link>
        <div className="flex items-center gap-2">
          {user && (
            <>
              <NavLink href="/tools" label={t.nav.tools} icon={<GridIcon />} />
              <NavLink href="/history" label={t.nav.history} icon={<ClockIcon />} />
              {user.role === "admin" && <NavLink href="/admin" label={t.nav.admin} icon={<PencilIcon />} />}
            </>
          )}
          <LanguageSwitch />
          {/* На телефоне не помещается; размер текста нужен учителю за ноутбуком */}
          <span className="hidden sm:block">
            <TextSizeControl />
          </span>
          <ThemeToggle />
          {user && (
            // Выход — обычная форма: работает и без JavaScript
            <form action="/api/auth/logout" method="post">
              <button
                type="submit"
                title={`${user.name} — ${t.nav.logout}`}
                className="flex h-9 items-center rounded-full px-3 text-footnote font-medium text-label-2 transition hover:bg-fill"
              >
                {t.nav.logout}
              </button>
            </form>
          )}
        </div>
      </nav>
    </header>
  );
}

function NavLink({ href, label, icon }: { href: string; label: string; icon: ReactNode }) {
  return (
    <Link
      href={href}
      aria-label={label}
      title={label}
      className="flex h-9 items-center gap-1.5 rounded-full bg-fill px-3 text-footnote font-medium text-label transition hover:bg-accent/15"
    >
      {icon}
      <span className="hidden md:inline">{label}</span>
    </Link>
  );
}
