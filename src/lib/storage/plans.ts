import { randomBytes } from "node:crypto";
import { insert, q, remove, select, selectOne, update } from "@/lib/db";
import { planInputSchema, type Plan, type PlanInput } from "@/types/plan";

// КТП учителей (таблица plans): уроки целиком в lessons jsonb.
// Каждый учитель видит и меняет только свои планы — owner_id в каждом запросе.

interface PlanRow {
  id: string;
  title: string;
  subject: string;
  grade: number;
  language: string;
  lessons: unknown;
  updated_at: string;
}

const COLUMNS = "select=id,title,subject,grade,language,lessons,updated_at";

/** Строка базы → план; старую или испорченную строку пропускаем */
function toPlan(row: PlanRow): Plan | null {
  const parsed = planInputSchema.safeParse(row);
  return parsed.success ? { ...parsed.data, id: row.id, updatedAt: row.updated_at } : null;
}

export async function listPlans(ownerId: string): Promise<Plan[]> {
  const rows = await select<PlanRow>("plans", `owner_id=eq.${q(ownerId)}&${COLUMNS}&order=updated_at.desc`);
  return rows.map(toPlan).filter((plan) => plan !== null);
}

export async function getPlan(ownerId: string, id: string): Promise<Plan | null> {
  const row = await selectOne<PlanRow>("plans", `id=eq.${q(id)}&owner_id=eq.${q(ownerId)}&${COLUMNS}`);
  return row ? toPlan(row) : null;
}

export async function createPlan(ownerId: string, input: PlanInput): Promise<string> {
  const id = randomBytes(6).toString("hex");
  await insert("plans", { id, owner_id: ownerId, ...input });
  return id;
}

/** Сохранить план целиком (автосохранение страницы). false — плана нет или он чужой */
export async function savePlan(ownerId: string, id: string, input: PlanInput): Promise<boolean> {
  const rows = await update("plans", `id=eq.${q(id)}&owner_id=eq.${q(ownerId)}`, {
    ...input,
    updated_at: new Date().toISOString(),
  });
  return rows.length > 0;
}

/** Отметить, что по уроку сделан ҚМЖ */
export async function markKmzh(ownerId: string, id: string, lessonId: string): Promise<boolean> {
  const plan = await getPlan(ownerId, id);
  if (!plan) return false;
  const at = new Date().toISOString();
  const lessons = plan.lessons.map((lesson) => (lesson.id === lessonId ? { ...lesson, kmzhAt: at } : lesson));
  const { title, subject, grade, language } = plan;
  return savePlan(ownerId, id, { title, subject, grade, language, lessons });
}

export const deletePlan = (ownerId: string, id: string) => remove("plans", `id=eq.${q(id)}&owner_id=eq.${q(ownerId)}`);
