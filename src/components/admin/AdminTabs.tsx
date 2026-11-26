"use client";

import Link from "next/link";
import { useState } from "react";

// Вкладки админки. Страница каждой вкладки собирается на сервере (запросы к базе),
// поэтому нажатую вкладку подсвечиваем сразу, не дожидаясь ответа — иначе кажется,
// что нажатие не сработало. Когда пришла новая страница (current сменился), подсветка — по ней.
export function AdminTabs({ tabs, current, label }: { tabs: { id: string; name: string }[]; current: string; label: string }) {
  const [clicked, setClicked] = useState<{ id: string; from: string } | null>(null);
  const active = clicked && clicked.from === current ? clicked.id : current;

  return (
    <nav aria-label={label} className="mt-6 flex flex-wrap gap-2">
      {tabs.map(({ id, name }) => (
        <Link
          key={id}
          href={`/admin?tab=${id}`}
          onClick={() => setClicked({ id, from: current })}
          aria-current={id === current ? "page" : undefined}
          className={`flex h-11 items-center rounded-full px-5 text-subhead font-semibold transition ${
            id === active ? "bg-accent text-white" : "bg-fill text-label hover:bg-accent/15"
          }`}
        >
          {name}
        </Link>
      ))}
    </nav>
  );
}
