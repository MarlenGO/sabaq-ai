// Иконка из набора Lucide (lucide-static отдаёт готовую SVG-строку с цветом currentColor).
// Размер задаёт className у обёртки (например size-6), SVG растягивается под неё.
export function LucideIcon({ svg, className = "size-6" }: { svg: string; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 [&>svg]:h-full [&>svg]:w-full ${className}`}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
