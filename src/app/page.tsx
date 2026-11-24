import { Suspense } from "react";
import { RecentLessons } from "@/components/RecentLessons";
import { SubjectGrid } from "@/components/home/SubjectGrid";

// Главная: предметы карточками, ниже — свои уроки и библиотека.
// Создание начинается со страницы предмета (/subject/[предмет]).
export default function Home() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-24 pt-8 sm:px-6">
      <SubjectGrid />
      <Suspense>
        <RecentLessons />
      </Suspense>
    </main>
  );
}
