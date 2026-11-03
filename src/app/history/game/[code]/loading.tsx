export default function PastGameLoading() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 animate-pulse px-4 pt-6" aria-busy="true">
      <div className="h-5 w-20 rounded-full bg-fill" />
      <div className="mt-5 h-10 w-2/3 rounded-xl bg-fill" />
      <div className="mt-6 h-72 rounded-2xl bg-fill" />
    </main>
  );
}
