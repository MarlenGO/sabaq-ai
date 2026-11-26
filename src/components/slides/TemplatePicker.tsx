"use client";

import { templates, type SlideTemplate } from "@/slides/templates";
import { PopoverSelect } from "@/components/ui/Popover";
import { useT } from "@/i18n/client";

// Стиль презентации отличается только цветами (вид и украшения задаёт deckType),
// поэтому учитель выбирает просто цвет слайдов из всплывающего списка.
// Цвета образца — из самого шаблона (это данные слайда, а не цвета интерфейса).

function Swatch({ template }: { template: SlideTemplate }) {
  const { background, accent, text } = template.colors;
  return (
    <span
      aria-hidden
      className="relative inline-flex h-6 w-10 shrink-0 overflow-hidden rounded-md ring-1 ring-separator"
      style={{ background: `#${background}` }}
    >
      <span className="absolute inset-y-0 left-0 w-2" style={{ background: `#${accent}` }} />
      <span className="absolute left-3.5 top-2 h-0.5 w-4 rounded-full" style={{ background: `#${text}` }} />
      {template.detail && (
        <span className="absolute bottom-1.5 left-3.5 h-0.5 w-3 rounded-full" style={{ background: `#${template.detail}` }} />
      )}
    </span>
  );
}

export function TemplatePicker({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const t = useT();
  const name = (template: SlideTemplate) => t.templates[template.id]?.name ?? template.name;
  const current = templates.find((template) => template.id === value) ?? templates[0];
  return (
    <PopoverSelect
      value={current.id}
      onChange={onChange}
      ariaLabel={t.lesson.chooseTemplate}
      full
      trigger={
        <span className="flex items-center gap-2">
          <Swatch template={current} />
          {t.lesson.chooseTemplate}: {name(current)}
        </span>
      }
      options={templates.map((template) => ({
        value: template.id,
        ariaLabel: name(template),
        label: (
          <span className="flex items-center gap-3">
            <Swatch template={template} />
            {name(template)}
          </span>
        ),
      }))}
    />
  );
}
