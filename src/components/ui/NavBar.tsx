import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { TextSizeControl, ThemeToggle } from "@/components/ui/PreferenceControls";

// Полупрозрачная панель с размытием фона, как в Safari и Finder.
export function NavBar() {
  return (
    <header className="sticky top-0 z-50 border-b border-separator bg-glass backdrop-blur-xl backdrop-saturate-150">
      <nav className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 px-4">
        <Link href="/" aria-label="Sabaq AI — басты бет">
          <Logo />
        </Link>
        <div className="flex items-center gap-2">
          <TextSizeControl />
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}
