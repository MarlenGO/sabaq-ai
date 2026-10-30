// Логотип: иконка в духе приложений iOS (скруглённый квадрат с градиентом),
// внутри раскрытая книга — «сабақ», и золотая искра — «готово само».
// Цвета здесь фиксированные: это фирменный знак, он одинаков в обеих темах.
export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <defs>
        <linearGradient id="sabaq-logo-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#0a84ff" />
          <stop offset="1" stopColor="#5e5ce6" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill="url(#sabaq-logo-bg)" />
      <path d="M6.5 11c3-.9 6-.6 8.5 1.1v11.4c-2.5-1.7-5.5-2-8.5-1.1z" fill="#fff" />
      <path d="M25.5 11c-3-.9-6-.6-8.5 1.1v11.4c2.5-1.7 5.5-2 8.5-1.1z" fill="#fff" fillOpacity="0.72" />
      <path d="M24 3.8l.9 2.2 2.2.9-2.2.9-.9 2.2-.9-2.2-2.2-.9 2.2-.9z" fill="#ffd60a" />
    </svg>
  );
}

export function Logo() {
  return (
    <span className="flex items-center gap-2">
      <LogoMark />
      <span className="text-title3 font-bold tracking-tight">
        Sabaq
        <span className="ml-1 bg-linear-to-r from-accent to-purple bg-clip-text text-transparent">AI</span>
      </span>
    </span>
  );
}
