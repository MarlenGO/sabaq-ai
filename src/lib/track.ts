// Отметить событие в истории. «Выстрелил и забыл»: если запись не удалась,
// учителю это не мешает, поэтому ошибки молча пропускаем.
export function track(event: { type: "pptx"; lessonId: string; templateId: string } | { type: "game"; lessonId: string; game: string }) {
  fetch("/api/activity", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(event),
    keepalive: true,
  }).catch(() => {});
}
