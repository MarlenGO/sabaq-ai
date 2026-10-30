import { networkInterfaces } from "node:os";

// GET /api/network — адреса этого компьютера в локальной сети.
// Если сайт открыт как localhost, телефоны учеников до него не достучатся,
// поэтому в QR-код кладём адрес вида http://192.168.1.5:3000.
// Сначала Wi-Fi, виртуальные адаптеры (Hyper-V, VirtualBox, WSL) пропускаем.
export async function GET(request: Request) {
  const port = new URL(request.url).port || "3000";
  const candidates = Object.entries(networkInterfaces())
    .filter(([name]) => !/vethernet|virtualbox|vmware|wsl|loopback|docker/i.test(name))
    .flatMap(([name, addresses]) =>
      (addresses ?? [])
        .filter((a) => a.family === "IPv4" && !a.internal && !a.address.startsWith("169.254."))
        .map((a) => ({ name, address: a.address })),
    )
    .sort((a, b) => Number(isWifi(b.name)) - Number(isWifi(a.name)));

  return Response.json({ urls: candidates.map((c) => `http://${c.address}:${port}`) });
}

const isWifi = (name: string) => /wi-?fi|wireless|wlan|беспровод/i.test(name);
