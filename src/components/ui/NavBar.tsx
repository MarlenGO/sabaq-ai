import Link from "next/link";
import { History, LayoutGrid, ShieldCheck, Wrench } from "lucide-static";
import { getT } from "@/i18n/server";
import { currentUser } from "@/lib/auth";
import { Logo } from "@/components/ui/Logo";
import { LanguageSwitch, TextSizeControl, ThemeToggle } from "@/components/ui/PreferenceControls";
import { NavLinks, type NavItem } from "@/components/ui/NavLinks";

// Навигация. На компьютере — меню слева на том же фоне, что и страница (без рамок),
// на телефоне и планшете — панель сверху. Ссылки видны только вошедшему учителю;
// «Әкімші» — только админам.
export async function NavBar() {
  const t = await getT();
  const user = await currentUser().catch(() => null);
  const items: NavItem[] = user
    ? [
        { href: "/", label: t.nav.subjects, icon: LayoutGrid },
        { href: "/tools", label: t.nav.tools, icon: Wrench },
        { href: "/history", label: t.nav.history, icon: History },
        ...(user.role === "admin" ? [{ href: "/admin", label: t.nav.admin, icon: ShieldCheck }] : []),
      ]
    : [];

  // Выход — обычная форма: работает и без JavaScript
  const logout = user && (
    <form action="/api/auth/logout" method="post">
      <button
        type="submit"
        title={`${user.name} — ${t.nav.logout}`}
        className="flex h-10 items-center rounded-full px-3 text-subhead font-medium text-label-2 transition hover:bg-fill hover:text-label"
      >
        {t.nav.logout}
      </button>
    </form>
  );

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-separator bg-glass backdrop-blur-xl lg:hidden">
        <nav className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-2 px-4">
          <Link href="/" aria-label={t.nav.home}>
            <Logo />
          </Link>
          <div className="flex items-center gap-1.5">
            <NavLinks items={items} compact />
            <LanguageSwitch />
            <ThemeToggle />
            {logout}
          </div>
        </nav>
      </header>

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-bg px-4 py-6 lg:flex">
        <Link href="/" aria-label={t.nav.home} className="px-3">
          <Logo />
        </Link>
        <nav className="mt-8 flex flex-col gap-1">
          <NavLinks items={items} />
        </nav>
        <div className="mt-auto flex flex-col gap-3 px-2">
          {user && <p className="truncate px-1 text-subhead font-semibold">{user.name}</p>}
          <TextSizeControl />
          <div className="flex items-center gap-2">
            <LanguageSwitch />
            <ThemeToggle />
          </div>
          {logout}
        </div>
      </aside>
    </>
  );
}
