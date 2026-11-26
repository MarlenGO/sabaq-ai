"use client";

import { useRouter } from "next/navigation";
import type { Subject } from "@/types/topic-package";
import { subjectOrder } from "@/lib/labels";
import { useTextSize, useTheme } from "@/lib/preferences";
import { setLocale, useLocale, useT } from "@/i18n/client";
import { ALargeSmall } from "lucide-static";
import { MoonIcon, SunIcon } from "@/components/ui/Icons";
import { LucideIcon } from "@/components/ui/LucideIcon";
import { PopoverSelect } from "@/components/ui/Popover";

// Размер текста — значок «Аа» на кнопке, в списке буква «А» своего размера и подпись словами.
export function TextSizeControl({ up = false, grow = false }: { up?: boolean; grow?: boolean }) {
  const [size, setSize] = useTextSize();
  const t = useT();
  const option = (value: "m" | "l" | "xl", em: string, label: string) => ({
    value,
    label: (
      <span className="flex items-center gap-2.5">
        <span className="w-5 text-center font-bold leading-none" style={{ fontSize: em }}>
          А
        </span>
        {label}
      </span>
    ),
  });

  return (
    <PopoverSelect
      up={up}
      grow={grow}
      ariaLabel={t.nav.textSize}
      trigger={<LucideIcon svg={ALargeSmall} className={grow ? "size-6" : "size-5"} />}
      value={size ?? "m"}
      onChange={setSize}
      options={[option("m", "0.85em", t.nav.textM), option("l", "1em", t.nav.textL), option("xl", "1.2em", t.nav.textXl)]}
    />
  );
}

// Тема — только значок: луна включает тёмную, солнце — светлую.
// large — квадрат 44px, как соседние кнопки в меню слева
export function ThemeToggle({ large = false }: { large?: boolean }) {
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
      className={`flex shrink-0 items-center justify-center bg-fill text-label transition hover:bg-accent/15 ${large ? "size-11 rounded-xl" : "size-9 rounded-full"}`}
    >
      {/* До загрузки настроек показываем пустое место того же размера */}
      {theme === null ? <span className="h-[1.25em] w-[1.25em]" /> : isDark ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}

// Язык сайта: подписи на своём языке, чтобы их узнал и тот, кто не понимает текущий
export function LanguageSwitch({ up = false, alignRight = false, grow = false }: { up?: boolean; alignRight?: boolean; grow?: boolean }) {
  const locale = useLocale();
  const t = useT();
  return (
    <PopoverSelect
      up={up}
      grow={grow}
      alignRight={alignRight}
      ariaLabel={t.nav.language}
      value={locale}
      onChange={setLocale}
      trigger={locale === "kk" ? "ҚАЗ" : "РУС"}
      options={[
        { value: "kk", label: "Қазақша" },
        { value: "ru", label: "Русский" },
      ]}
    />
  );
}

// «Менің пәнім»: выбранный предмет открывается сразу вместо сетки предметов
// (cookie sabaq-subject, переадресация с «/» — в src/proxy.ts)
export const SUBJECT_COOKIE = "sabaq-subject";

export function SubjectPicker({ initial }: { initial: Subject | "" }) {
  const t = useT();
  const router = useRouter();
  return (
    <PopoverSelect<Subject | "all">
      full
      up
      ariaLabel={t.nav.mySubject}
      value={initial || "all"}
      onChange={(value) => {
        if (value === "all") document.cookie = `${SUBJECT_COOKIE}=; path=/; max-age=0`;
        else document.cookie = `${SUBJECT_COOKIE}=${value}; path=/; max-age=31536000; samesite=lax`;
        router.push(value === "all" ? "/" : `/subject/${value}`);
        router.refresh();
      }}
      options={[
        { value: "all", label: t.nav.allSubjects },
        ...subjectOrder.map((subject) => ({ value: subject, label: t.subjects[subject] })),
      ]}
    />
  );
}
