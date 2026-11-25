import { NextResponse, type NextRequest } from "next/server";

// Быстрая проверка до открытия страницы: нет cookie входа — сразу на /login.
// Это только «первый фильтр»: настоящую проверку сессии делают страницы и API
// через currentUser() (lib/auth.ts). Ученики (/play) и вход (/login) открыты всем.
// Имя cookie — как SESSION_COOKIE в lib/auth.ts (тот файл здесь не импортируем:
// он тянет node:crypto и базу, а proxy должен быть лёгким).
//
// Выбран «Менің пәнім» (cookie sabaq-subject, меню слева внизу) — главная «/» сразу
// открывает этот предмет. Сетку всех предметов показывает «/?all=1» (стрелка «назад»).
export function proxy(request: NextRequest) {
  if (request.cookies.has("sabaq-session")) {
    const subject = request.cookies.get("sabaq-subject")?.value;
    const { pathname, searchParams } = request.nextUrl;
    if (pathname === "/" && !searchParams.has("all") && subject && /^[a-z]+$/.test(subject)) {
      return NextResponse.redirect(new URL(`/subject/${subject}`, request.url));
    }
    return NextResponse.next();
  }
  const url = new URL("/login", request.url);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    // Всё, кроме API (проверяют сами), входа, игры учеников, служебных файлов Next.js и картинок
    "/((?!api|login|play|_next/static|_next/image|favicon.ico|.*\\.(?:png|svg|jpg|jpeg|webp|ico)$).*)",
  ],
};
