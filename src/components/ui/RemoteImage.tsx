import type { QuestionImage } from "@/types/topic-package";

// Картинка по ссылке с чужого сайта (Wikimedia или вставленная учителем).
// Обычный <img>, а не next/image: заранее неизвестно, с какого сайта ссылка.
// no-referrer — чтобы сайт картинки не узнавал, с какой страницы её открыли.
export function RemoteImage({
  image,
  className = "",
  showCredit = true,
}: {
  image: QuestionImage;
  className?: string;
  showCredit?: boolean;
}) {
  return (
    <figure className="flex flex-col items-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={image.url} alt="" referrerPolicy="no-referrer" loading="lazy" className={`rounded-xl object-contain ${className}`} />
      {showCredit && image.credit && (
        <figcaption className="mt-1 max-w-full truncate text-caption text-label-3">{image.credit}</figcaption>
      )}
    </figure>
  );
}
