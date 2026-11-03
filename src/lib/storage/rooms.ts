import { randomBytes, randomInt } from "node:crypto";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { playerSchema, roomSchema, type Player, type Room } from "@/types/room";

// Комнаты в файлах: data/rooms/<код>/room.json и players/<id>.json.
// У каждого ученика свой файл, поэтому 30 человек, отвечающих одновременно,
// не затирают ответы друг друга. Как и lessons.ts, при переходе на базу
// данных заменяется только этот файл.

const DIR = path.join(process.cwd(), "data", "rooms");

const isCode = (code: string) => /^\d{6}$/.test(code);
const isPlayerId = (id: string) => /^[a-f0-9]{16}$/.test(id);
const roomDir = (code: string) => path.join(DIR, code);
const roomFile = (code: string) => path.join(roomDir(code), "room.json");
const playerFile = (code: string, id: string) => path.join(roomDir(code), "players", `${id}.json`);

async function readJson(file: string): Promise<unknown> {
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch {
    return null;
  }
}

// Ответы одного ученика пишутся по очереди: если он дважды быстро нажмёт,
// второе сохранение дождётся первого и не потеряет его.
const locks = new Map<string, Promise<unknown>>();
function withLock<T>(key: string, task: () => Promise<T>): Promise<T> {
  const previous = locks.get(key) ?? Promise.resolve();
  const next = previous.catch(() => {}).then(task);
  locks.set(key, next);
  next.finally(() => locks.get(key) === next && locks.delete(key));
  return next;
}

export async function createRoom(data: Omit<Room, "code" | "status" | "createdAt">): Promise<Room> {
  await mkdir(DIR, { recursive: true });
  const existing = new Set(await readdir(DIR).catch(() => [] as string[]));
  let code = "";
  do code = String(randomInt(100000, 1000000));
  while (existing.has(code));

  const room: Room = { ...data, code, status: "open", createdAt: new Date().toISOString() };
  await mkdir(path.join(roomDir(code), "players"), { recursive: true });
  await writeFile(roomFile(code), JSON.stringify(room, null, 2), "utf8");
  return room;
}

export async function getRoom(code: string): Promise<Room | null> {
  if (!isCode(code)) return null;
  const parsed = roomSchema.safeParse(await readJson(roomFile(code)));
  return parsed.success ? parsed.data : null;
}

export async function finishRoom(code: string) {
  const room = await getRoom(code);
  if (!room) return null;
  const finished = { ...room, status: "finished" as const };
  await writeFile(roomFile(code), JSON.stringify(finished, null, 2), "utf8");
  return finished;
}

export async function addPlayer(code: string, name: string): Promise<Player> {
  const player: Player = { id: randomBytes(8).toString("hex"), name, joinedAt: new Date().toISOString(), answers: [] };
  await writeFile(playerFile(code, player.id), JSON.stringify(player), "utf8");
  return player;
}

export async function getPlayer(code: string, id: string): Promise<Player | null> {
  if (!isCode(code) || !isPlayerId(id)) return null;
  const parsed = playerSchema.safeParse(await readJson(playerFile(code, id)));
  return parsed.success ? parsed.data : null;
}

export async function listPlayers(code: string): Promise<Player[]> {
  if (!isCode(code)) return [];
  const files = await readdir(path.join(roomDir(code), "players")).catch(() => [] as string[]);
  const players = await Promise.all(files.map((f) => getPlayer(code, f.replace(/\.json$/, ""))));
  return players.filter((p): p is Player => p !== null);
}

/** Все комнаты (для истории) */
export async function listRooms(): Promise<Room[]> {
  const codes = await readdir(DIR).catch(() => [] as string[]);
  const rooms = await Promise.all(codes.map((code) => getRoom(code)));
  return rooms.filter((r): r is Room => r !== null);
}

/** Записать ответ; null — если на этот вопрос ученик уже отвечал */
export function saveAnswer(code: string, playerId: string, answer: Player["answers"][number]) {
  return withLock(`${code}/${playerId}`, async () => {
    const player = await getPlayer(code, playerId);
    if (!player || player.answers.some((a) => a.index === answer.index)) return null;
    const updated = { ...player, answers: [...player.answers, answer] };
    await writeFile(playerFile(code, playerId), JSON.stringify(updated), "utf8");
    return updated;
  });
}
