"use client";

import { fontSchema, type SlideFont } from "@/types/topic-package";
import { PopoverSelect } from "@/components/ui/Popover";
import { useT } from "@/i18n/client";

// Шрифт слайдов: «как в дизайне» или один из шрифтов с казахскими буквами,
// которые есть в Windows/Office у учителя (иначе PowerPoint подменит шрифт).
// Каждый вариант написан своим шрифтом — так видно, как он выглядит.

const BY_DESIGN = "design";

export function FontPicker({ value, onChange }: { value?: SlideFont; onChange: (font: SlideFont | undefined) => void }) {
  const t = useT();
  const current = value ?? BY_DESIGN;
  const name = (font: string) => (font === BY_DESIGN ? t.lesson.fontByDesign : font);
  return (
    <PopoverSelect
      value={current}
      onChange={(font) => onChange(font === BY_DESIGN ? undefined : (font as SlideFont))}
      ariaLabel={t.lesson.chooseFont}
      full
      trigger={
        <span style={value ? { fontFamily: value } : undefined}>
          {t.lesson.chooseFont}: {name(current)}
        </span>
      }
      options={[BY_DESIGN, ...fontSchema.options].map((font) => ({
        value: font,
        ariaLabel: name(font),
        label: (
          <span className="text-body" style={font === BY_DESIGN ? undefined : { fontFamily: font }}>
            {name(font)}
            {font !== BY_DESIGN && <span className="ml-2 text-label-2">Әә Ғғ Ққ Ңң Өө</span>}
          </span>
        ),
      }))}
    />
  );
}
