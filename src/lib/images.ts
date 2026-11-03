// Поиск картинок в Wikimedia Commons (бесплатно, без ключа). Запрос идёт с нашего
// сервера: так Wikimedia видит понятный User-Agent, как просят их правила.
// Возвращаем только ссылки — сами картинки мы не храним.

export interface ImageResult {
  url: string;
  title: string;
  credit: string;
}

interface CommonsPage {
  title: string;
  imageinfo?: {
    thumburl?: string;
    extmetadata?: { Artist?: { value: string }; LicenseShortName?: { value: string } };
  }[];
}

const stripHtml = (html = "") => html.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();

/** Картинки по запросу; null — Wikimedia не ответила */
export async function searchImages(query: string, limit = 18): Promise<ImageResult[] | null> {
  const api = new URL("https://commons.wikimedia.org/w/api.php");
  api.search = new URLSearchParams({
    action: "query",
    format: "json",
    generator: "search",
    gsrnamespace: "6", // только файлы
    gsrsearch: `${query} filetype:bitmap`,
    gsrlimit: String(limit),
    prop: "imageinfo",
    iiprop: "url|extmetadata",
    iiurlwidth: "640",
    iiextmetadatafilter: "Artist|LicenseShortName",
  }).toString();

  const response = await fetch(api, {
    headers: { "User-Agent": "SabaqAI/0.1 (lesson builder for teachers in Kazakhstan)" },
    signal: AbortSignal.timeout(10_000),
  }).catch(() => null);
  if (!response?.ok) return null;

  const data = (await response.json()) as { query?: { pages?: Record<string, CommonsPage & { index?: number }> } };
  const pages = Object.values(data.query?.pages ?? {}).sort((a, b) => (a.index ?? 0) - (b.index ?? 0));

  const results: ImageResult[] = pages.flatMap((page) => {
    const info = page.imageinfo?.[0];
    if (!info?.thumburl) return [];
    const author = stripHtml(info.extmetadata?.Artist?.value).slice(0, 80);
    const license = stripHtml(info.extmetadata?.LicenseShortName?.value);
    return [
      {
        // Хвост ?utm_… Wikimedia добавляет для статистики, для картинки он не нужен
        url: info.thumburl.split("?")[0],
        title: page.title.replace(/^File:/, "").replace(/\.\w+$/, ""),
        credit: [author, license, "Wikimedia Commons"].filter(Boolean).join(" · "),
      },
    ];
  });

  return results;
}
