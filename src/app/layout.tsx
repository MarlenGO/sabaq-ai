import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";
import { Nunito } from "next/font/google";
import { getLocale } from "@/i18n/server";
import { LocaleProvider } from "@/i18n/client";
import { NavBar } from "@/components/ui/NavBar";
import { installScript, preferencesScript } from "@/lib/preferences-script";
import "./globals.css";

// Шрифт сайта — Nunito: округлый и мягкий, легко читается.
// cyrillic-ext нужен для казахских букв ә, ғ, қ, ң, ө, ұ, ү, һ, і.
const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin", "cyrillic", "cyrillic-ext"],
});

export const metadata: Metadata = {
  title: "Sabaq AI",
  description: "Сабаққа арналған дайын презентация мен ойын бірнеше минутта",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning: скрипт ниже меняет атрибуты <html> до React,
    // и это ожидаемое расхождение с серверной версией
    <html lang="kk" className={`${nunito.variable} h-full`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: preferencesScript }} />
        <script dangerouslySetInnerHTML={{ __html: installScript }} />
      </head>
      <body className="min-h-full flex flex-col">
        {/* Язык сайта читается из cookie, а это данные запроса — поэтому внутри Suspense */}
        <Suspense>
          <WithLocale>{children}</WithLocale>
        </Suspense>
      </body>
    </html>
  );
}

async function WithLocale({ children }: { children: ReactNode }) {
  const locale = await getLocale();
  return (
    <LocaleProvider locale={locale}>
      {/* На компьютере меню слева закреплено, поэтому содержимое сдвинуто вправо на его ширину */}
      <div className="flex flex-1 flex-col lg:pl-64">
        <NavBar />
        {children}
      </div>
    </LocaleProvider>
  );
}
