"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { CleanupTarget } from "@/lib/admin";
import { useT } from "@/i18n/client";
import { TrashIcon } from "@/components/ui/Icons";

// «Тарихты тазалау»: спрашиваем, что именно удалится, удаляем и обновляем вкладку.
export function CleanupButton({ target }: { target: CleanupTarget }) {
  const t = useT();
  const router = useRouter();
  const [busy, startTransition] = useTransition();
  const [result, setResult] = useState<string | null>(null);

  const run = () => {
    if (!window.confirm(t.admin.cleanup.confirm[target])) return;
    startTransition(async () => {
      const response = await fetch("/api/admin/cleanup", {
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
        {busy ? t.admin.cleanup.working : t.admin.cleanup.button}
      </button>
    </div>
  );
}
