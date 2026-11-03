import Link from "next/link";
import { getT } from "@/i18n/server";
import { ClockIcon } from "@/components/ui/Icons";
import { Logo } from "@/components/ui/Logo";
import { LanguageSwitch, TextSizeControl, ThemeToggle } from "@/components/ui/PreferenceControls";

// Полупрозрачная панель с размытием фона, как в Safari и Finder.
export async function NavBar() {
  const t = await getT();
  return (
    <header className="sticky top-0 z-50 border-b border-separator bg-glass backdrop-blur-xl backdrop-saturate-150">
      <nav className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-2 px-4">
        <Link href="/" aria-label={t.nav.home}>
          <Logo />
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/history"
            aria-label={t.nav.history}
            title={t.nav.history}
            className="flex h-9 items-center gap-1.5 rounded-full bg-fill px-3 text-footnote font-medium text-label transition hover:bg-accent/15"
          >
            <ClockIcon />
            <span className="hidden sm:inline">{t.nav.history}</span>
          </Link>
          <LanguageSwitch />
          {/* На телефоне не помещается; размер текста нужен учителю за ноутбуком */}
          <span className="hidden sm:block">
            <TextSizeControl />
          </span>
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}
