import Link from "next/link";

// Полупрозрачная панель с размытием фона, как в Safari и Finder.
export function NavBar() {
  return (
    <header className="sticky top-0 z-50 border-b border-separator bg-glass backdrop-blur-xl backdrop-saturate-150">
      <nav className="mx-auto flex h-12 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="text-[17px] font-semibold tracking-tight">
          Sabaq AI
        </Link>
        <div className="flex items-center gap-5 text-[14px] text-label-2">
          <span>Презентация</span>
          <span>Ойын</span>
        </div>
      </nav>
    </header>
  );
}
