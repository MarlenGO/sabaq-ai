"use client";

import { useTextSize, useTheme } from "@/lib/preferences";
import { MoonIcon, SunIcon } from "@/components/ui/Icons";
import { SegmentedControl } from "@/components/ui/SegmentedControl";

// Три буквы «А» разного размера: так понятно без слов, что это размер текста.
export function TextSizeControl() {
  const [size, setSize] = useTextSize();

  return (
    <SegmentedControl
      ariaLabel="Әріп өлшемі"
      value={size}
      onChange={setSize}
      options={[
        { value: "m", label: <span className="text-[0.8rem] leading-none">А</span>, ariaLabel: "Қалыпты әріп" },
        { value: "l", label: <span className="text-[1rem] leading-none">А</span>, ariaLabel: "Үлкен әріп" },
        { value: "xl", label: <span className="text-[1.2rem] leading-none">А</span>, ariaLabel: "Өте үлкен әріп" },
      ]}
    />
  );
}

export function ThemeToggle() {
  const [theme, setTheme] = useTheme();
  const isDark = theme === "dark";
  const label = isDark ? "Жарық режим" : "Қараңғы режим";

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
      <span className="hidden sm:inline">{theme === null ? "" : isDark ? "Жарық" : "Қараңғы"}</span>
    </button>
  );
}
