import { StudentGame } from "@/components/play/StudentGame";

export default async function PlayPage({ params }: PageProps<"/play/[code]">) {
  const { code } = await params;
  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-4 pb-16 pt-6">
      <StudentGame code={code} />
    </main>
  );
}
