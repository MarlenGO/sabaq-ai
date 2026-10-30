// Показывается мгновенно, пока сервер читает урок. Серые блоки повторяют
// форму будущей страницы, поэтому ничего не «прыгает» после загрузки.
export default function LessonLoading() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 animate-pulse px-4 pt-6" aria-busy="true">
      <div className="h-5 w-28 rounded-full bg-fill" />
      <div className="mt-6 h-10 w-2/3 rounded-xl bg-fill" />
      <div className="mt-3 h-5 w-48 rounded-full bg-fill" />
      <div className="mt-8 h-12 w-full max-w-md rounded-xl bg-fill" />
      <div className="mt-6 aspect-video w-full rounded-2xl bg-fill" />
    </main>
  );
}
