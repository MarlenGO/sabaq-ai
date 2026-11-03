import type PptxGenJS from "pptxgenjs";
import type { TopicPackage } from "@/types/topic-package";
import { buildSlides, SLIDE_H_PT, SLIDE_W_PT, type SlideElement } from "./layout";
import { iconSvg, rasterizeInBrowser, type Rasterize } from "./icons";
import { getTemplate, type SlideTemplate } from "./templates";

// «Художник» для PowerPoint: рисует те же элементы, что SlideCanvas, через pptxgenjs.
// Файл собирается прямо в браузере, сервер и AI для этого не нужны.

type Slide = ReturnType<PptxGenJS["addSlide"]>;

const pct = (n: number) => `${n}%` as const;
const boxOf = (el: SlideElement) => ({ x: pct(el.x), y: pct(el.y), w: pct(el.w), h: pct(el.h) });
const iconKey = (name: string, color: string) => `${name}-${color}`;

function draw(pptx: PptxGenJS, slide: Slide, el: SlideElement, template: SlideTemplate, icons: Map<string, string>) {
  const box = boxOf(el);

  if (el.type === "rect") {
    if (el.rounded === "full") {
      slide.addShape(pptx.ShapeType.ellipse, { ...box, fill: { color: template.colors[el.fill] }, line: { type: "none" } });
      return;
    }
    // Радиус 10 пт как в превью. pptxgenjs принимает его долей от короткой стороны
    // (проверено в PowerPoint: 0,5 — уже полукруглые края).
    const shortSidePt = Math.min((el.w / 100) * SLIDE_W_PT, (el.h / 100) * SLIDE_H_PT);
    slide.addShape(el.rounded ? pptx.ShapeType.roundRect : pptx.ShapeType.rect, {
      ...box,
      fill: { color: template.colors[el.fill] },
      line: { type: "none" },
      rectRadius: el.rounded ? Math.min(0.5, 10 / shortSidePt) : undefined,
    });
    return;
  }

  if (el.type === "circle") {
    slide.addShape(pptx.ShapeType.ellipse, {
      ...box,
      fill: { color: el.color, transparency: el.transparency },
      line: { type: "none" },
    });
    return;
  }

  if (el.type === "icon") {
    const data = icons.get(iconKey(el.name, template.colors[el.color]));
    if (data) slide.addImage({ ...box, data });
    return;
  }

  // Настоящее фото: обрезаем по рамке (cover) и подписываем автора — так просит лицензия Wikimedia.
  // Размеры для sizing pptxgenjs принимает в дюймах (слайд 10 × 5,625).
  if (el.type === "image" && el.src) {
    const inch = { x: (el.x / 100) * 10, y: (el.y / 100) * 5.625, w: (el.w / 100) * 10, h: (el.h / 100) * 5.625 };
    slide.addImage({ path: el.src, ...inch, sizing: { type: "cover", w: inch.w, h: inch.h } });
    if (el.credit) {
      slide.addText(el.credit, {
        x: inch.x,
        y: inch.y + inch.h - 0.22,
        w: inch.w,
        h: 0.22,
        fontSize: 7,
        color: "FFFFFF",
        fill: { color: "000000", transparency: 50 },
        align: "right",
        margin: 2,
      });
    }
    return;
  }

  // Место под картинку — заглушка из макета слайда (см. buildPptx), здесь рисовать нечего
  if (el.type === "image") return;

  const paragraphs = Array.isArray(el.text) ? el.text : [el.text];
  slide.addText(
    paragraphs.map((text, i) => ({
      text,
      options: {
        bullet: el.bullet || undefined,
        breakLine: i < paragraphs.length - 1,
        paraSpaceBefore: i > 0 ? el.fontSize * 0.5 : 0,
      },
    })),
    {
      ...box,
      fontFace: el.font === "heading" ? template.fonts.heading : template.fonts.body,
      fontSize: el.fontSize,
      color: template.colors[el.color],
      bold: el.bold,
      align: el.align ?? "left",
      valign: el.valign ?? "top",
      margin: 0,
      fit: "none",
    },
  );
}

// Имя файла: тема без символов, которые Windows не разрешает в именах
export function pptxFileName(topic: string) {
  const safe = topic.replace(/[\\/:*?"<>|]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 80);
  return `${safe || "Sabaq"}.pptx`;
}

// Собрать презентацию. Класс PptxGenJS и способ превращать иконки в PNG
// передаются снаружи, чтобы этот же код работал и в браузере,
// и в скрипте scripts/sample-pptx.ts.
export async function buildPptx(
  PptxGenJSClass: typeof PptxGenJS,
  pkg: TopicPackage,
  rasterize: Rasterize,
  template?: SlideTemplate,
) {
  const pptx = new PptxGenJSClass();
  pptx.layout = "LAYOUT_16x9";
  pptx.title = pkg.topic;

  const t = template ?? getTemplate(pkg.templateId, pkg.subject);
  const slides = buildSlides(pkg, t);

  // Каждую иконку каждого цвета превращаем в PNG один раз
  const icons = new Map<string, string>();
  for (const el of slides.flatMap((s) => s.elements)) {
    if (el.type !== "icon") continue;
    const color = t.colors[el.color];
    const key = iconKey(el.name, color);
    if (!icons.has(key)) icons.set(key, await rasterize(iconSvg(el.name, color)));
  }

  slides.forEach((spec, index) => {
    // Заглушки нужны только там, где фото ещё не выбрано
    const images = spec.elements.filter(
      (el): el is Extract<SlideElement, { type: "image" }> => el.type === "image" && !el.src,
    );
    let slide: Slide;
    if (images.length > 0) {
      // Заглушку «вставить рисунок» PowerPoint умеет только через макет слайда,
      // поэтому для таких слайдов заводим свой макет с местами под картинки.
      const masterName = `${t.id}-pictures-${index}`;
      pptx.defineSlideMaster({
        title: masterName,
        background: { color: t.colors.background },
        objects: images.map((el, i) => ({
          placeholder: {
            options: { name: `picture-${i + 1}`, type: "pic" as const, ...boxOf(el) },
            text: el.prompt,
          },
        })),
      });
      slide = pptx.addSlide({ masterName });
    } else {
      slide = pptx.addSlide();
    }
    slide.background = { color: t.colors.background };
    for (const el of spec.elements) draw(pptx, slide, el, t, icons);
  });

  return pptx;
}

// Готовый файл в байтах. Заодно обходим ошибку pptxgenjs 4.0.1: у заглушки
// под картинку она теряет атрибут type="pic", и PowerPoint считает её
// обычным «объектом». Все наши заглушки — под картинки, поэтому дописываем
// type="pic" каждой заглушке без типа (у заголовков и прочих тип уже есть).
export async function pptxBytes(pptx: PptxGenJS): Promise<Uint8Array> {
  const raw = (await pptx.write({ outputType: "uint8array" })) as Uint8Array;
  const { default: JSZip } = await import("jszip");
  const zip = await JSZip.loadAsync(raw);
  const xmlFiles = Object.keys(zip.files).filter((name) => /^ppt\/(slides|slideLayouts)\/[^/]+\.xml$/.test(name));
  for (const name of xmlFiles) {
    const file = zip.file(name);
    if (!file) continue;
    const xml = await file.async("string");
    const fixed = xml.replace(/<p:ph(\s+)idx="/g, '<p:ph type="pic"$1idx="');
    if (fixed !== xml) zip.file(name, fixed);
  }
  return zip.generateAsync({ type: "uint8array", compression: "DEFLATE" });
}

export async function exportPptx(pkg: TopicPackage) {
  // pptxgenjs большой, поэтому грузим его только по нажатию кнопки
  const { default: PptxGenJSClass } = await import("pptxgenjs");
  const pptx = await buildPptx(PptxGenJSClass, pkg, rasterizeInBrowser);
  const bytes = await pptxBytes(pptx);

  const blob = new Blob([bytes as BlobPart], {
    type: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = pptxFileName(pkg.topic);
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
