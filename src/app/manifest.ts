import type { MetadataRoute } from "next";

// Описание сайта как приложения: по нему Chrome и Edge предлагают «Орнату» —
// значок на рабочем столе, сайт открывается отдельным окном без адресной строки.
// Значки рисует scripts/make-icons.mjs из логотипа.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Sabaq AI",
    short_name: "Sabaq AI",
    description: "Сабаққа арналған дайын презентация, ойын және құжаттар",
    start_url: "/",
    display: "standalone",
    background_color: "#eef1eb",
    theme_color: "#2e6a4f",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
