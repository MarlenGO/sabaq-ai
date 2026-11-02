import type { ButtonHTMLAttributes } from "react";

// Виды кнопок из iOS: filled — главное действие, tinted — второстепенное,
// plain — текстовая ссылка, light — белая кнопка на цветном фоне.
type Variant = "filled" | "tinted" | "plain" | "light";
type Size = "md" | "lg";

const variants: Record<Variant, string> = {
  filled: "bg-accent text-white hover:bg-accent-pressed",
  tinted: "bg-accent/12 text-accent hover:bg-accent/20",
  plain: "text-accent hover:opacity-70",
  light: "bg-white text-indigo hover:bg-white/90",
};

const sizes: Record<Size, string> = {
  md: "h-11 rounded-xl px-5 text-subhead",
  // Крупная кнопка главного действия: в неё легко попасть
  lg: "h-14 rounded-2xl px-7 text-body",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export function Button({ variant = "filled", size = "md", className = "", ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 font-semibold transition active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40 ${sizes[size]} ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
