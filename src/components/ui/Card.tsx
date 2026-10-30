import type { HTMLAttributes, ReactNode } from "react";

// Белая карточка с крупным скруглением и мягкой тенью.
export function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`rounded-2xl bg-surface shadow-card ${className}`} {...props} />;
}

// Сгруппированный список как в «Настройках» iPhone: строки с тонкими разделителями.
export function ListGroup({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section>
      {title && (
        <h3 className="mb-1.5 px-4 text-footnote font-medium uppercase tracking-wide text-label-2">{title}</h3>
      )}
      <Card className="divide-y divide-separator overflow-hidden">{children}</Card>
    </section>
  );
}

export function ListRow({ title, detail }: { title: string; detail?: string }) {
  return (
    <div className="px-4 py-3">
      <div className="text-subhead">{title}</div>
      {detail && <div className="mt-0.5 text-footnote text-label-2">{detail}</div>}
    </div>
  );
}
