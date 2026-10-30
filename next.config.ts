import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Игра через QR: телефоны учеников открывают сайт по адресу ноутбука
  // в школьной Wi-Fi сети (192.168.x.x и т.п.). В режиме разработки Next.js
  // пускает такие адреса только из этого списка.
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*", "172.*.*.*"],
  cacheComponents: true,
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
