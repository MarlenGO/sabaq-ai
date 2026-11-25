import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Игра через QR: телефоны учеников открывают сайт по адресу ноутбука
  // в школьной Wi-Fi сети (192.168.x.x и т.п.). В режиме разработки Next.js
  // пускает такие адреса только из этого списка.
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*", "172.*.*.*"],
  cacheComponents: true,
  // Значок «N» слева снизу виден только при npm run dev и закрывает меню — прячем.
  // Ошибки сборки и страницы Next.js всё равно покажет.
  devIndicators: false,
  // Word-шаблон ҚМЖ читается с диска — на Vercel он должен попасть в серверную функцию
  outputFileTracingIncludes: { "/api/documents": ["./templates/**"] },
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
