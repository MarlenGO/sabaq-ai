// Логотип: раскрытая книга — «сабақ» — на квадрате цвета сайта.
// Цвет берётся из темы (accent), поэтому в тёмной теме знак светлее.
export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="9" className="fill-accent" />
      <path d="M6.5 10.5c3-.9 6-.6 8.5 1.1v11.4c-2.5-1.7-5.5-2-8.5-1.1z" className="fill-surface" />
      <path d="M25.5 10.5c-3-.9-6-.6-8.5 1.1v11.4c2.5-1.7 5.5-2 8.5-1.1z" className="fill-surface" fillOpacity="0.75" />
    </svg>
  );
}

export function Logo() {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark />
      <span className="hidden text-title3 font-extrabold tracking-tight min-[400px]:inline">Sabaq AI</span>
    </span>
  );
}
