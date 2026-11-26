"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { CleanupTarget } from "@/lib/admin";
import type { DbJunk } from "@/lib/admin-db";
import { useT } from "@/i18n/client";
import { TrashIcon } from "@/components/ui/Icons";

// «Тарихты тазалау»: спрашиваем, что именно удалится, удаляем и обновляем вкладку.
// На вкладке «БД» та же кнопка чистит мусор (`db`: свой адрес, подпись и вопрос).
export function CleanupButton(props: { target: CleanupTarget } | { target: DbJunk; db: true }) {
  const { target } = props;
  const isDb = "db" in props;
  const t = useT();
  const router = useRouter();
  const [busy, startTransition] = useTransition();
  const [result, setResult] = useState<string | null>(null);

  const run = () => {
    const question = isDb ? t.admin.db.confirm[props.target] : t.admin.cleanup.confirm[props.target];
    if (!window.confirm(question)) return;
    startTransition(async () => {
      const response = await fetch(isDb ? "/api/admin/db" : "/api/admin/cleanup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target }),
      }).catch(() => null);
      const data = await response?.json().catch(() => null);
      setResult(response?.ok ? t.admin.cleanup.done(data?.removed ?? 0) : (data?.error ?? t.common.netError));
      router.refresh();
    });
  };

  return (
    <div className="flex flex-wrap items-center justify-end gap-3">
      {result && <span className="text-subhead text-label-2">{result}</span>}
      <button
        type="button"
        onClick={run}
        disabled={busy}
        className="inline-flex h-11 items-center gap-2 rounded-full bg-red/10 px-4 text-subhead font-semibold text-red transition hover:bg-red/15 disabled:opacity-50"
      >
        <TrashIcon />
        {busy ? t.admin.cleanup.working : isDb ? t.admin.db.clean : t.admin.cleanup.button}
      </button>
    </div>
  );
}
