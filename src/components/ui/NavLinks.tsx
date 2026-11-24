"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LucideIcon } from "@/components/ui/LucideIcon";

export interface NavItem {
  href: string;
  label: string;
  /** SVG-строка из lucide-static */
  icon: string;
}

// Пункты меню с подсветкой текущего раздела. Страницы предметов относятся к «Пәндер».
function isActive(href: string, path: string) {
  if (href === "/") return path === "/" || path.startsWith("/subject") || path.startsWith("/lesson");
  return path === href || path.startsWith(`${href}/`);
}

export function NavLinks({ items, compact = false }: { items: NavItem[]; compact?: boolean }) {
  const path = usePathname();
  return items.map((item) => {
    const active = isActive(item.href, path);
    if (compact) {
      // Верхняя панель на телефоне: только иконки, подпись — от планшета
      return (
        <Link
          key={item.href}
          href={item.href}
          aria-label={item.label}
          title={item.label}
          aria-current={active ? "page" : undefined}
          className={`flex h-9 items-center gap-1.5 rounded-full px-2.5 text-footnote font-medium transition ${
            active ? "bg-accent/12 text-accent" : "text-label hover:bg-fill"
          }`}
        >
          <LucideIcon svg={item.icon} className="size-5" />
          <span className="hidden md:inline">{item.label}</span>
        </Link>
      );
    }
    return (
      <Link
        key={item.href}
        href={item.href}
        aria-current={active ? "page" : undefined}
        className={`flex h-12 items-center gap-3 rounded-2xl px-3.5 text-body font-semibold transition-colors ${
          active ? "bg-surface text-accent" : "text-label-2 hover:bg-fill hover:text-label"
        }`}
      >
        <LucideIcon svg={item.icon} className="size-5" />
        {item.label}
      </Link>
    );
  });
}
