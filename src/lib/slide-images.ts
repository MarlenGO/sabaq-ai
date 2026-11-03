import type { TopicPackage } from "@/types/topic-package";
import { searchImages } from "@/lib/images";
import { isDataSlide, slideData, structureOf } from "@/slides/structures";

// Картинки на слайды сами: для слайдов «текст + рисунок» и «большой рисунок»
// ищем фото в Wikimedia. Запрос — английский imageQuery из примеров темы
// (его пишет AI), а если примеров не хватает — сама тема урока.
// Не нашлось — остаётся место под картинку, учитель вставит своё.
export async function fillSlideImages(lesson: TopicPackage): Promise<TopicPackage> {
  const slots = structureOf(lesson).filter(
    (s) => isDataSlide(s) && (s.kind === "text-image" || s.kind === "big-image") && !hasImage(lesson, s.id),
  );
  if (slots.length === 0) return lesson;

  const queries = slots.map((_, i) => lesson.examples[i]?.imageQuery ?? lesson.topic);
  const found = await Promise.all(queries.map((query) => searchImages(query, 3).catch(() => null)));

  const deck = { ...lesson.deck };
  slots.forEach((spec, i) => {
    const picture = found[i]?.[0];
    if (!picture || !isDataSlide(spec)) return;
    if (spec.kind !== "text-image" && spec.kind !== "big-image") return;
    deck[spec.id] = { ...slideData(lesson, spec), image: { url: picture.url, credit: picture.credit } };
  });
  return { ...lesson, deck };
}

const hasImage = (lesson: TopicPackage, id: string) => Boolean((lesson.deck?.[id] as { image?: unknown } | undefined)?.image);
