import QRCode from "qrcode";

// QR-код рисуем сами из матрицы точек: синхронно и чётко при любом размере.
// Цвета всегда чёрный на белом — так его читает любая камера, даже в тёмной теме.
export function QrCode({ text, className = "" }: { text: string; className?: string }) {
  const { modules } = QRCode.create(text, { errorCorrectionLevel: "M" });
  const size = modules.size;
  const margin = 2;
  const cells: string[] = [];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (modules.get(y, x)) cells.push(`M${x + margin} ${y + margin}h1v1h-1z`);
    }
  }
  const box = size + margin * 2;

  return (
    <svg viewBox={`0 0 ${box} ${box}`} className={className} role="img" aria-label="QR" shapeRendering="crispEdges">
      <rect width={box} height={box} fill="#fff" />
      <path d={cells.join("")} fill="#000" />
    </svg>
  );
}
