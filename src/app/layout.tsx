import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";
import { Inter } from "next/font/google";
import { getLocale } from "@/i18n/server";
import { LocaleProvider } from "@/i18n/client";
import { NavBar } from "@/components/ui/NavBar";
import { preferencesScript } from "@/lib/preferences-script";
import "./globals.css";

// Запасной шрифт для устройств без SF Pro (Windows, Android).
// cyrillic-ext нужен для казахских букв ә, ғ, қ, ң, ө, ұ, ү, һ, і.
const inter = Inter({
  variable: "--font-inter",
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
    <html lang="kk" className={`${inter.variable} h-full`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: preferencesScript }} />
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
      <NavBar />
      {children}
    </LocaleProvider>
  );
}
