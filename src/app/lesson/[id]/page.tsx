import { notFound } from "next/navigation";
import { getLesson } from "@/lib/storage/lessons";
import { LessonWorkspace } from "@/components/lesson/LessonWorkspace";

export default async function LessonPage({ params, searchParams }: PageProps<"/lesson/[id]">) {
  const { id } = await params;
  const { tab } = await searchParams;
  const lesson = await getLesson(id);
  if (!lesson) notFound();

  return <LessonWorkspace initial={lesson} initialTab={tab === "games" ? "games" : "slides"} />;
}
