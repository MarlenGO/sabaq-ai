// Пробные презентации без браузера: npm run sample:pptx
// Собирает PPTX из мокового пакета во всех шаблонах в папку data/samples/.
// Удобно проверять, как раскладка выглядит в настоящем PowerPoint.
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { Resvg } from "@resvg/resvg-js";
import PptxGenJS from "pptxgenjs";
import { newtonFirstLaw7 } from "../src/data/mock-packages/newton-first-law-7";
import { buildPptx, pptxBytes } from "../src/slides/export-pptx";
import { ICON_PX, type Rasterize } from "../src/slides/icons";
import { templates } from "../src/slides/templates";

const outDir = path.join(process.cwd(), "data", "samples");

// В браузере иконки рисует canvas, а в Node — библиотека resvg
const rasterize: Rasterize = async (svg) => {
  const png = new Resvg(svg, { fitTo: { mode: "width", value: ICON_PX } }).render().asPng();
  return `image/png;base64,${Buffer.from(png).toString("base64")}`;
};

async function main() {
  await mkdir(outDir, { recursive: true });
  for (const template of templates) {
    const file = path.join(outDir, `sample-${template.id}.pptx`);
    const pptx = await buildPptx(PptxGenJS, newtonFirstLaw7, rasterize, template);
    await writeFile(file, await pptxBytes(pptx));
    console.log("✓", file);
  }
}

main();
