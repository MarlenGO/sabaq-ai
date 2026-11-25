// Рисует значки приложения (для «Орнату» — сайт на рабочем столе) из логотипа:
// книга на зелёном квадрате. Запуск: node scripts/make-icons.mjs
import fs from "node:fs";
import { Resvg } from "@resvg/resvg-js";

// Цвета светлой темы из globals.css: accent и белый лист
const book = (fill) => `
  <path d="M6.5 10.5c3-.9 6-.6 8.5 1.1v11.4c-2.5-1.7-5.5-2-8.5-1.1z" fill="${fill}"/>
  <path d="M25.5 10.5c-3-.9-6-.6-8.5 1.1v11.4c2.5-1.7 5.5-2 8.5-1.1z" fill="${fill}" fill-opacity="0.75"/>`;
// Обычный значок — скруглённый квадрат; maskable — квадрат во весь размер,
// книга меньше (система сама обрежет кругом или «капелькой»)
const regular = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="7" fill="#2e6a4f"/>${book("#ffffff")}</svg>`;
const maskable = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" fill="#2e6a4f"/><g transform="translate(3.2 3.2) scale(0.8)">${book("#ffffff")}</g></svg>`;

const png = (svg, size) => new Resvg(svg, { fitTo: { mode: "width", value: size } }).render().asPng();
fs.writeFileSync("public/icon-192.png", png(regular, 192));
fs.writeFileSync("public/icon-512.png", png(regular, 512));
fs.writeFileSync("public/icon-maskable-512.png", png(maskable, 512));
fs.writeFileSync("src/app/apple-icon.png", png(maskable, 180));
console.log("ok");
