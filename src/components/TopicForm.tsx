"use client";

import { useState } from "react";
import type { Language } from "@/types/topic-package";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SegmentedControl } from "@/components/ui/SegmentedControl";

const grades = Array.from({ length: 11 }, (_, i) => i + 1);

// Форма «тема + класс + язык». Кнопки генерации заработают на этапе 3,
// пока форма только хранит введённые значения.
export function TopicForm() {
  const [topic, setTopic] = useState("");
  const [grade, setGrade] = useState(7);
  const [language, setLanguage] = useState<Language>("kk");

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-medium text-label-2">Сабақтың тақырыбы</span>
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Мысалы: Ньютонның бірінші заңы"
            className="h-11 rounded-xl bg-fill px-4 text-[17px] outline-none placeholder:text-label-3 focus:ring-4 focus:ring-accent/25"
          />
        </label>

        <div className="flex flex-wrap items-end gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium text-label-2">Сынып</span>
            <select
              value={grade}
              onChange={(e) => setGrade(Number(e.target.value))}
              className="h-11 rounded-xl bg-fill px-4 text-[17px] outline-none focus:ring-4 focus:ring-accent/25"
            >
              {grades.map((g) => (
                <option key={g} value={g}>
                  {g}-сынып
                </option>
              ))}
            </select>
          </label>

          <div className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium text-label-2">Тіл</span>
            <div className="flex h-11 items-center">
              <SegmentedControl
                value={language}
                onChange={setLanguage}
                options={[
                  { value: "kk", label: "Қазақша" },
                  { value: "ru", label: "Русский" },
                ]}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 pt-1 sm:flex-row">
          <Button disabled={!topic.trim()} className="sm:flex-1">
            Дайын слайд жасау
          </Button>
          <Button variant="tinted" disabled={!topic.trim()} className="sm:flex-1">
            Дайын ойын жасау
          </Button>
        </div>
      </div>
    </Card>
  );
}
