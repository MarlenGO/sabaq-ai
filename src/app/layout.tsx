import type { Metadata } from "next";
import { Inter } from "next/font/google";
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
        <NavBar />
        {children}
      </body>
    </html>
  );
}
