"use client";

import { useState } from "react";
import type { TopicPackage } from "@/types/topic-package";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EyeIcon, PencilIcon } from "@/components/ui/Icons";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { PackageEditor } from "./PackageEditor";
import { SlidePreview } from "./SlidePreview";

type Mode = "edit" | "preview";

// Переключатель «Конструктор / Алдын ала көру» на примере мокового пакета.
// Тот же переключатель будет на странице редактора после генерации.
export function ExampleWorkbench({ initial }: { initial: TopicPackage }) {
  const [pkg, setPkg] = useState(initial);
  const [mode, setMode] = useState<Mode>("preview");
  const changed = pkg !== initial;

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-separator p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <SegmentedControl
          size="lg"
          ariaLabel="Режим"
          value={mode}
          onChange={setMode}
          options={[
            { value: "edit", label: "Конструктор", icon: <PencilIcon /> },
            { value: "preview", label: "Алдын ала көру", icon: <EyeIcon /> },
          ]}
        />
        {changed && (
          <Button variant="plain" onClick={() => setPkg(initial)} className="self-start sm:self-auto">
            Бастапқы күйге қайтару
          </Button>
        )}
      </div>

      <div className="p-4 sm:p-6">
        {mode === "edit" ? <PackageEditor pkg={pkg} onChange={setPkg} /> : <SlidePreview pkg={pkg} />}
      </div>
    </Card>
  );
}
