import Link from "next/link";
import { cookies } from "next/headers";
import { subjectSchema } from "@/types/topic-package";
import { CalendarDays, FolderOpen, History, LayoutGrid, LogOut, ShieldCheck, Wrench } from "lucide-static";
import { getT } from "@/i18n/server";
import { currentUser } from "@/lib/auth";
import { InstallButton } from "@/components/ui/InstallButton";
import { Logo } from "@/components/ui/Logo";
import { LucideIcon } from "@/components/ui/LucideIcon";
import { LanguageSwitch, SUBJECT_COOKIE, SubjectPicker, TextSizeControl, ThemeToggle } from "@/components/ui/PreferenceControls";
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
        { href: "/documents", label: t.nav.myDocs, icon: FolderOpen },
        { href: "/plan", label: t.nav.plan, icon: CalendarDays },
        { href: "/tools", label: t.nav.tools, icon: Wrench },
        { href: "/history", label: t.nav.history, icon: History },
      ]
    : [];
  // На телефоне «Әкімші» — обычной ссылкой в панели, на компьютере — значком рядом с именем
  const admin: NavItem[] = user?.role === "admin" ? [{ href: "/admin", label: t.nav.admin, icon: ShieldCheck }] : [];
  const saved = subjectSchema.safeParse((await cookies()).get(SUBJECT_COOKIE)?.value);

  // Выход — обычная форма: работает и без JavaScript. В меню слева — заметная кнопка
  // на всю ширину (скруглённый квадрат, текст как у имени), в панели на телефоне — маленькая.
  const logout = (wide: boolean) =>
    user && (
      <form action="/api/auth/logout" method="post">
        <button
          type="submit"
          title={`${user.name} — ${t.nav.logout}`}
          className={
            wide
              ? "flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-fill text-subhead font-semibold text-label transition hover:bg-red/10 hover:text-red"
              : "flex h-10 items-center rounded-full px-3 text-subhead font-medium text-label-2 transition hover:bg-fill hover:text-label"
          }
        >
          {wide && <LucideIcon svg={LogOut} className="size-5" />}
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
            <NavLinks items={[...items, ...admin]} compact />
            <LanguageSwitch alignRight />
            <ThemeToggle />
            {logout(false)}
          </div>
        </nav>
      </header>

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-bg px-4 py-6 lg:flex">
        {/* Рядом с логотипом — «Орнату» (значок на рабочем столе), пока сайт не установлен */}
        <div className="flex items-center justify-between gap-2 pl-3">
          <Link href="/" aria-label={t.nav.home}>
            <Logo />
          </Link>
          {user && <InstallButton />}
        </div>
        <nav className="mt-8 flex flex-col gap-1">
          <NavLinks items={items} />
        </nav>
        {/* Внизу: предмет; размер текста, язык, тема; имя и значок админки; выход */}
        <div className="mt-auto flex flex-col gap-3 px-2">
          {user && <SubjectPicker initial={saved.success ? saved.data : ""} />}
          {/* Тема и админка — квадраты одного размера у правого края, один под другим */}
          <div className="flex items-center gap-2">
            <TextSizeControl up grow />
            <LanguageSwitch up grow />
            <ThemeToggle large />
          </div>
          {user && (
            <div className="flex items-center justify-between gap-2">
              <p className="truncate px-1 text-subhead font-semibold">{user.name}</p>
              {user.role === "admin" && (
                <Link
                  href="/admin"
                  aria-label={t.nav.admin}
                  title={t.nav.admin}
                  className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-fill text-label transition hover:bg-accent/15 hover:text-accent"
                >
                  <LucideIcon svg={ShieldCheck} className="size-5" />
                </Link>
              )}
            </div>
          )}
          {logout(true)}
        </div>
      </aside>
    </>
  );
}
