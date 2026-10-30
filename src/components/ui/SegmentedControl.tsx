"use client";

// Переключатель-сегменты из iOS: серая подложка, выбранный пункт — белая «таблетка».
interface SegmentedControlProps<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}

export function SegmentedControl<T extends string>({ options, value, onChange }: SegmentedControlProps<T>) {
  return (
    <div className="inline-flex rounded-[9px] bg-fill p-0.5">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`rounded-[7px] px-4 py-1 text-[13px] font-medium transition ${
            option.value === value ? "bg-surface shadow-sm" : "text-label-2 hover:text-label"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
