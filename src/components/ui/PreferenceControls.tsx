"use client";

import { useTextSize, useTheme } from "@/lib/preferences";
import { setLocale, useLocale, useT } from "@/i18n/client";
import { MoonIcon, SunIcon } from "@/components/ui/Icons";
import { SegmentedControl } from "@/components/ui/SegmentedControl";

// Три буквы «А» разного размера: так понятно без слов, что это размер текста.
export function TextSizeControl() {
  const [size, setSize] = useTextSize();
  const t = useT();

  return (
    <SegmentedControl
      ariaLabel={t.nav.textSize}
      value={size}
      onChange={setSize}
      options={[
        { value: "m", label: <span className="text-[0.8rem] leading-none">А</span>, ariaLabel: t.nav.textM },
        { value: "l", label: <span className="text-[1rem] leading-none">А</span>, ariaLabel: t.nav.textL },
        { value: "xl", label: <span className="text-[1.2rem] leading-none">А</span>, ariaLabel: t.nav.textXl },
      ]}
    />
  );
}

export function ThemeToggle() {
  const [theme, setTheme] = useTheme();
  const t = useT();
  const isDark = theme === "dark";
  const label = isDark ? t.nav.toLight : t.nav.toDark;

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={label}
      title={label}
      className="flex h-9 items-center gap-1.5 rounded-full bg-fill px-3 text-footnote font-medium text-label transition hover:bg-accent/15"
    >
      {/* До загрузки настроек показываем пустое место того же размера */}
      {theme === null ? <span className="h-[1.25em] w-[1.25em]" /> : isDark ? <SunIcon /> : <MoonIcon />}
      <span className="hidden sm:inline">{theme === null ? "" : isDark ? t.nav.light : t.nav.dark}</span>
    </button>
  );
}

// Язык сайта: подписи на своём языке, чтобы их узнал и тот, кто не понимает текущий
export function LanguageSwitch() {
  const locale = useLocale();
  const t = useT();
  return (
    <SegmentedControl
      ariaLabel={t.nav.language}
      value={locale}
      onChange={setLocale}
      options={[
        { value: "kk", label: "ҚАЗ", ariaLabel: "Қазақша" },
        { value: "ru", label: "РУС", ariaLabel: "Русский" },
      ]}
    />
  );
}
