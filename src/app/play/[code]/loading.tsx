// Мгновенная заглушка, пока открывается игра на телефоне
export default function PlayLoading() {
  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-4 pt-6" aria-busy="true">
      <div className="h-64 animate-pulse rounded-2xl bg-fill" />
    </main>
  );
}
