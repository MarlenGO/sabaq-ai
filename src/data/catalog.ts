import {
  Atom,
  Award,
  BookA,
  BookOpenText,
  CircleCheck,
  ClipboardList,
  Dna,
  Earth,
  Feather,
  FlaskConical,
  Grid3x3,
  HeartHandshake,
  Landmark,
  Languages,
  ListChecks,
  Megaphone,
  Monitor,
  Presentation,
  School,
  Shapes,
  Sigma,
  Timer,
  Users,
  Zap,
} from "lucide-static";
import type { DeckType, Language, Subject } from "@/types/topic-package";
import type { GameId } from "@/games/registry";
import { deckTypeOrder } from "@/slides/structures";
import { games } from "@/games/registry";

// Каталог для главной и страницы предмета: как выглядит каждый предмет
// и что можно сделать (виды презентаций + игры). Названия — в словарях i18n.

/**
 * Плитка предмета: свой цвет и иконка. Из цвета страница сама делает
 * мягкий фон плитки и цвет иконки (color-mix), поэтому подходит и тёмной теме.
 */
export const subjectLook: Record<Subject, { icon: string; hue: string }> = {
  physics: { icon: Atom, hue: "#6a55c8" },
  math: { icon: Sigma, hue: "#3a6fc4" },
  informatics: { icon: Monitor, hue: "#2b8c8c" },
  chemistry: { icon: FlaskConical, hue: "#2a8fb8" },
  biology: { icon: Dna, hue: "#4a9a4f" },
  geography: { icon: Earth, hue: "#7f9a2e" },
  history: { icon: Landmark, hue: "#b5713a" },
  kazakh: { icon: BookOpenText, hue: "#c99418" },
  russian: { icon: BookA, hue: "#5f7598" },
  literature: { icon: Feather, hue: "#a5484a" },
  english: { icon: Languages, hue: "#c2456c" },
  other: { icon: Shapes, hue: "#6b7280" },
};

export const deckTypeIcon: Record<DeckType, string> = {
  lesson: Presentation,
  "open-lesson": Award,
  report: ClipboardList,
  talk: Megaphone,
  "class-hour": School,
  parents: Users,
  attestation: HeartHandshake,
};

export const gameIcon: Record<GameId, string> = {
  test: ListChecks,
  quiz: Timer,
  jeopardy: Grid3x3,
  "true-false": CircleCheck,
  race: Zap,
};

/** Что можно создать: вид презентации или игра. Адрес — /subject/<предмет>/<id> */
export type CreateKind = { type: "deck"; id: DeckType } | { type: "game"; id: GameId };

export function kindOf(id: string): CreateKind | null {
  if ((deckTypeOrder as string[]).includes(id)) return { type: "deck", id: id as DeckType };
  if (games.some((g) => g.id === id)) return { type: "game", id: id as GameId };
  return null;
}

/** Примеры тем по предмету: кнопки под полем «Тақырып» */
export const exampleTopics: Record<Subject, Record<Language, string[]>> = {
  physics: { kk: ["Ньютонның бірінші заңы", "Ом заңы", "Жарықтың сынуы"], ru: ["Первый закон Ньютона", "Закон Ома", "Преломление света"] },
  math: { kk: ["Пифагор теоремасы", "Квадрат теңдеулер", "Бөлшектер"], ru: ["Теорема Пифагора", "Квадратные уравнения", "Дроби"] },
  informatics: { kk: ["Алгоритм түрлері", "Python-да циклдар", "Компьютер құрылғылары"], ru: ["Виды алгоритмов", "Циклы в Python", "Устройство компьютера"] },
  chemistry: { kk: ["Периодтық жүйе", "Химиялық реакциялар", "Қышқылдар мен негіздер"], ru: ["Периодическая система", "Химические реакции", "Кислоты и основания"] },
  biology: { kk: ["Фотосинтез", "Жасуша құрылысы", "Қан айналым жүйесі"], ru: ["Фотосинтез", "Строение клетки", "Кровеносная система"] },
  geography: { kk: ["Қазақстанның өзендері", "Климат белдеулері", "Жер қыртысы"], ru: ["Реки Казахстана", "Климатические пояса", "Земная кора"] },
  history: { kk: ["Қазақ хандығының құрылуы", "Ұлы Жібек жолы", "Екінші дүниежүзілік соғыс"], ru: ["Образование Казахского ханства", "Великий Шёлковый путь", "Вторая мировая война"] },
  kazakh: { kk: ["Зат есім", "Етістік шақтары", "Сөз таптары"], ru: ["Имя существительное", "Времена глагола", "Части речи"] },
  russian: { kk: ["Зат есім", "Сын есім", "Тыныс белгілері"], ru: ["Имя существительное", "Имя прилагательное", "Знаки препинания"] },
  literature: { kk: ["Абай Құнанбайұлы", "Мағжан Жұмабаев", "Шоқан Уәлиханов"], ru: ["Абай Кунанбаев", "А. С. Пушкин", "Л. Н. Толстой"] },
  english: { kk: ["Present Simple", "My family", "Past Simple"], ru: ["Present Simple", "My family", "Past Simple"] },
  other: { kk: ["Отбасы құндылықтары", "Жол ережесі", "Салауатты өмір салты"], ru: ["Семейные ценности", "Правила дорожного движения", "Здоровый образ жизни"] },
};
