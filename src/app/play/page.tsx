"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { fieldClass } from "@/components/ui/field";
import { useT } from "@/i18n/client";

// Вход в игру по коду — для тех, у кого камера не читает QR
export default function JoinByCodePage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const t = useT();
  const valid = /^\d{6}$/.test(code);

  return (
    <main className="mx-auto w-full max-w-md flex-1 px-4 pb-16 pt-10">
      <Card className="flex flex-col gap-4 p-6">
        <h1 className="text-title1 font-bold">{t.play.joinTitle}</h1>
        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (valid) router.push(`/play/${code}`);
          }}
        >
          <label className="flex flex-col gap-1.5">
            <span className="text-subhead font-semibold">{t.play.codeLabel}</span>
            <input
              className={`${fieldClass} h-16 text-center text-large font-bold tracking-[0.3em]`}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              inputMode="numeric"
              autoComplete="off"
              placeholder="000000"
            />
          </label>
          <Button type="submit" size="lg" disabled={!valid}>
            {t.play.enter}
          </Button>
        </form>
      </Card>
    </main>
  );
}
