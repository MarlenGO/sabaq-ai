import type { CSSProperties } from "react";
import { SLIDE_W_PT, type Slide, type SlideElement } from "@/slides/layout";
import { iconDataUrl } from "@/slides/icons";
import type { SlideTemplate } from "@/slides/templates";

// «Художник» для браузера: рисует слайд из той же раскладки, что и PPTX.
// Размеры в cqw (процент ширины слайда): 1 пункт = 100 / 720 cqw,
// поэтому слайд одинаково выглядит в маленьком превью и на весь экран.

const pt = (size: number) => `${(size * 100) / SLIDE_W_PT}cqw`;
const hex = (color: string) => `#${color}`;

function boxStyle(el: SlideElement): CSSProperties {
  return { position: "absolute", left: `${el.x}%`, top: `${el.y}%`, width: `${el.w}%`, height: `${el.h}%` };
}

function Element({ el, template }: { el: SlideElement; template: SlideTemplate }) {
  if (el.type === "rect") {
    return (
      <div
        style={{
          ...boxStyle(el),
          background: hex(template.colors[el.fill]),
          borderRadius: el.rounded === "full" ? "50%" : el.rounded ? pt(10) : undefined,
        }}
      />
    );
  }

  if (el.type === "icon") {
    // eslint-disable-next-line @next/next/no-img-element -- иконка из data:-URL, оптимизация next/image не нужна
    return <img src={iconDataUrl(el.name, template.colors[el.color])} alt="" style={boxStyle(el)} />;
  }

  if (el.type === "image") {
    // В превью — пунктирная рамка-подсказка. В PPTX на этом месте будет
    // заглушка PowerPoint «нажмите на значок, чтобы вставить рисунок».
    const muted = hex(template.colors.muted);
    return (
      <div
        style={{
          ...boxStyle(el),
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: pt(6),
          border: `${pt(1.5)} dashed ${muted}`,
          borderRadius: pt(10),
          background: hex(template.colors.surface),
          color: muted,
          fontFamily: template.fonts.body,
          fontSize: pt(14),
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={iconDataUrl("image", template.colors.muted)} alt="" style={{ width: pt(40), height: pt(40) }} />
        {el.label}
      </div>
    );
  }

  if (el.type === "circle") {
    return <div style={{ ...boxStyle(el), background: hex(el.color), opacity: 1 - el.transparency / 100, borderRadius: "50%" }} />;
  }

  const paragraphs = Array.isArray(el.text) ? el.text : [el.text];
  return (
    <div
      style={{
        ...boxStyle(el),
        display: "flex",
        flexDirection: "column",
        justifyContent: el.valign === "middle" ? "center" : el.valign === "bottom" ? "flex-end" : "flex-start",
        textAlign: el.align ?? "left",
        color: hex(template.colors[el.color]),
        fontFamily: el.font === "heading" ? template.fonts.heading : template.fonts.body,
        fontSize: pt(el.fontSize),
        fontWeight: el.bold ? 700 : 400,
        lineHeight: 1.2,
        overflow: "hidden",
        overflowWrap: "anywhere",
      }}
    >
      {paragraphs.map((p, i) => (
        <p
          key={i}
          style={{
            marginTop: i > 0 ? pt(el.fontSize * 0.5) : 0,
            display: el.bullet ? "list-item" : undefined,
            marginLeft: el.bullet ? "1.1em" : undefined,
          }}
        >
          {p}
        </p>
      ))}
    </div>
  );
}

export function SlideCanvas({ slide, template }: { slide: Slide; template: SlideTemplate }) {
  return (
    <div className="@container">
      <div
        className="relative aspect-video overflow-hidden rounded-xl shadow-card"
        style={{ background: hex(template.colors.background) }}
      >
        {slide.elements.map((el, i) => (
          <Element key={i} el={el} template={template} />
        ))}
      </div>
    </div>
  );
}
