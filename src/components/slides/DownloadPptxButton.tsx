"use client";

import { useState } from "react";
import type { TopicPackage } from "@/types/topic-package";
import { exportPptx, pptxFileName } from "@/slides/export-pptx";
import { getTemplate } from "@/slides/templates";
import { track } from "@/lib/track";
import { Button } from "@/components/ui/Button";
import { useT } from "@/i18n/client";

export function DownloadPptxButton({ pkg }: { pkg: TopicPackage }) {
  const [state, setState] = useState<"idle" | "working" | "done" | "error">("idle");
  const t = useT();

  const download = async () => {
    setState("working");
    try {
      await exportPptx(pkg);
      setState("done");
      track({ type: "pptx", lessonId: pkg.id, templateId: getTemplate(pkg.templateId, pkg.subject).id });
    } catch (error) {
      console.error(error);
      setState("error");
    }
  };

  return (
    <div className="flex flex-col items-start gap-1.5">
      <Button size="lg" onClick={download} disabled={state === "working"}>
        <svg viewBox="0 0 24 24" width="1.25em" height="1.25em" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 4v11M7 10.5l5 5 5-5M5 20h14" />
        </svg>
        {state === "working" ? t.pptx.working : t.pptx.download}
      </Button>
      {state === "done" && (
        <span className="text-footnote text-label-2">
          {t.pptx.done(pptxFileName(pkg.topic))}
        </span>
      )}
      {state === "error" && <span className="text-footnote text-red">{t.pptx.error}</span>}
    </div>
  );
}
