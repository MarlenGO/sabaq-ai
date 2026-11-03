import { randomBytes, randomInt } from "node:crypto";
import { roomSchema, type Player, type Room } from "@/types/room";
import { DbError, insert, isDuplicate, q, select, selectOne, update } from "@/lib/db";

// Игровые комнаты в базе: rooms (комната целиком в data), players (ученики)
// и answers (ответ — отдельная строка). Уникальный ключ (ученик, вопрос)
// в базе сам не даёт ответить дважды, даже если 30 человек жмут одновременно.

const isCode = (code: string) => /^\d{6}$/.test(code);
const isPlayerId = (id: string) => /^[a-f0-9]{16}$/.test(id);

interface RoomRow {
  code: string;
  owner_id: string | null;
  data: unknown;
}

interface PlayerRow {
  id: string;
  name: string;
  joined_at: string;
  shuffle: Pick<Player, "order" | "optionOrders"> | null;
  answers: { question: number; choice: number; correct: boolean; points: number }[];
}

const toRoom = (row: RoomRow | null) => {
  const parsed = row && roomSchema.safeParse(row.data);
  return parsed?.success ? parsed.data : null;
};

const toPlayer = (row: PlayerRow): Player => ({
  id: row.id,
  name: row.name,
  joinedAt: row.joined_at,
  answers: [...row.answers]
    .sort((a, b) => a.question - b.question)
    .map((a) => ({ index: a.question, choice: a.choice, correct: a.correct, points: a.points })),
  ...(row.shuffle ?? {}),
});

const PLAYER_FIELDS = "id,name,joined_at,shuffle,answers(question,choice,correct,points)";

export async function createRoom(data: Omit<Room, "code" | "status" | "createdAt">, ownerId: string): Promise<Room> {
  // Код из 6 цифр; если вдруг занят — пробуем другой
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = String(randomInt(100000, 1000000));
    const room: Room = { ...data, code, status: "open", createdAt: new Date().toISOString() };
    try {
      await insert("rooms", { code, owner_id: ownerId, lesson_id: data.lessonId, data: room, created_at: room.createdAt });
      return room;
    } catch (error) {
      if (!isDuplicate(error)) throw error;
    }
  }
  throw new DbError(500, "No free room code");
}

export async function getRoom(code: string): Promise<Room | null> {
  if (!isCode(code)) return null;
  return toRoom(await selectOne<RoomRow>("rooms", `code=eq.${q(code)}`));
}

/** Комната и её учитель — для проверки, что управлять игрой может только он */
export async function getRoomWithOwner(code: string) {
  if (!isCode(code)) return null;
  const row = await selectOne<RoomRow>("rooms", `code=eq.${q(code)}`);
  const room = toRoom(row);
  return room && row ? { room, ownerId: row.owner_id } : null;
}

/** Изменить комнату (ход «Жарыса», завершение). Меняет её только учитель — по одному действию за раз */
export async function updateRoom(code: string, change: (room: Room) => Room | null) {
  const room = await getRoom(code);
  const updated = room && change(room);
  if (!updated) return null;
  await update("rooms", `code=eq.${q(code)}`, { data: updated });
  return updated;
}

export function finishRoom(code: string) {
  return updateRoom(code, (room) => ({
    ...room,
    status: "finished",
    live: room.live && { ...room.live, phase: "finished" },
  }));
}

export async function addPlayer(code: string, name: string, extra: Pick<Player, "order" | "optionOrders"> = {}): Promise<Player> {
  const id = randomBytes(8).toString("hex");
  const shuffle = extra.order ? extra : null;
  const [row] = await insert<Omit<PlayerRow, "answers">>("players", { id, room_code: code, name, shuffle });
  return toPlayer({ ...row, answers: [] });
}

export async function getPlayer(code: string, id: string): Promise<Player | null> {
  if (!isCode(code) || !isPlayerId(id)) return null;
  const row = await selectOne<PlayerRow>("players", `id=eq.${q(id)}&room_code=eq.${q(code)}&select=${PLAYER_FIELDS}`);
  return row ? toPlayer(row) : null;
}

export async function listPlayers(code: string): Promise<Player[]> {
  if (!isCode(code)) return [];
  const rows = await select<PlayerRow>("players", `room_code=eq.${q(code)}&select=${PLAYER_FIELDS}&order=joined_at`);
  return rows.map(toPlayer);
}

/** Комнаты учителя (для истории), новые — первыми */
export async function listRooms(ownerId: string): Promise<Room[]> {
  const rows = await select<RoomRow>("rooms", `owner_id=eq.${q(ownerId)}&order=created_at.desc&limit=200`);
  return rows.map(toRoom).filter((r): r is Room => r !== null);
}

/** Записать ответ; null — если на этот вопрос ученик уже отвечал */
export async function saveAnswer(code: string, playerId: string, answer: Player["answers"][number]) {
  try {
    await insert("answers", {
      player_id: playerId,
      room_code: code,
      question: answer.index,
      choice: answer.choice,
      correct: answer.correct,
      points: answer.points,
    });
    return true;
  } catch (error) {
    if (isDuplicate(error)) return null;
    throw error;
  }
}
