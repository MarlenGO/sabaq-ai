"use client";

import { useState } from "react";
import type { TopicPackage } from "@/types/topic-package";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EyeIcon, PencilIcon } from "@/components/ui/Icons";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { SlideEditor } from "@/components/slides/SlideEditor";
import { SlidePreview } from "@/components/slides/SlidePreview";
import { useT } from "@/i18n/client";

type Mode = "edit" | "preview";

// Переключатель «Конструктор / Алдын ала көру» на примере мокового пакета.
// Тот же переключатель будет на странице редактора после генерации.
export function ExampleWorkbench({ initial }: { initial: TopicPackage }) {
  const [pkg, setPkg] = useState(initial);
  const [mode, setMode] = useState<Mode>("preview");
  const changed = pkg !== initial;
  const t = useT();

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-separator p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <SegmentedControl
          size="lg"
          ariaLabel={t.common.mode}
          value={mode}
          onChange={setMode}
          options={[
            { value: "edit", label: t.common.edit, icon: <PencilIcon /> },
            { value: "preview", label: t.common.preview, icon: <EyeIcon /> },
          ]}
        />
        {changed && (
          <Button variant="plain" onClick={() => setPkg(initial)} className="self-start sm:self-auto">
            {t.home.exampleReset}
          </Button>
        )}
      </div>

      <div className="p-4 sm:p-6">
        {mode === "edit" ? <SlideEditor pkg={pkg} onChange={setPkg} /> : <SlidePreview pkg={pkg} />}
      </div>
    </Card>
  );
}
