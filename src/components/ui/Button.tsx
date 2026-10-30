import type { ButtonHTMLAttributes } from "react";

// Три вида кнопок из iOS: filled — главное действие, tinted — второстепенное,
// plain — текстовая ссылка.
type Variant = "filled" | "tinted" | "plain";

const variants: Record<Variant, string> = {
  filled: "bg-accent text-white hover:bg-accent-pressed",
  tinted: "bg-accent/12 text-accent hover:bg-accent/20",
  plain: "text-accent hover:opacity-70",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export function Button({ variant = "filled", className = "", ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex h-11 items-center justify-center rounded-xl px-5 text-[15px] font-semibold transition active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40 ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
