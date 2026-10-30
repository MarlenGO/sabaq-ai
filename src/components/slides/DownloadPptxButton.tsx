"use client";

import { useState } from "react";
import type { TopicPackage } from "@/types/topic-package";
import { exportPptx, pptxFileName } from "@/slides/export-pptx";
import { Button } from "@/components/ui/Button";

export function DownloadPptxButton({ pkg }: { pkg: TopicPackage }) {
  const [state, setState] = useState<"idle" | "working" | "done" | "error">("idle");

  const download = async () => {
    setState("working");
    try {
      await exportPptx(pkg);
      setState("done");
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
        {state === "working" ? "Дайындап жатырмын…" : "PPTX жүктеу"}
      </Button>
      <span className={`text-footnote ${state === "error" ? "text-red" : "text-label-2"}`}>
        {state === "done"
          ? `«${pptxFileName(pkg.topic)}» файлы «Жүктеулер» (Downloads) қалтасына сақталды`
          : state === "error"
            ? "Файл жасалмады. Қайталап көріңіз"
            : "PowerPoint-те ашып, қалауыңызша түзетуге болады"}
      </span>
    </div>
  );
}
