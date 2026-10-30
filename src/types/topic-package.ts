// Пакет темы — главный контракт проекта.
// AI (позже Gemini) генерирует его один раз на тему, а слайды и игры
// собираются из него по шаблонам без AI. Фронт работает только с этим типом,
// поэтому пока бэкенда нет, вместо него подставляются моковые пакеты.

export type Language = "kk" | "ru";

export type Subject =
  | "physics"
  | "chemistry"
  | "biology"
  | "history"
  | "geography"
  | "math"
  | "other";

export interface Formula {
  /** Сама формула, например "ΣF = 0 ⇒ v = const" */
  expression: string;
  /** Обозначения: символ → что означает и в чём измеряется */
  variables: { symbol: string; meaning: string; unit?: string }[];
}

export interface Example {
  text: string;
  /** Поисковый запрос для картинки в Pexels/Unsplash, на английском */
  imageQuery: string;
}

export interface Term {
  term: string;
  explanation: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  /** Индекс правильного ответа в options */
  correctIndex: number;
  explanation?: string;
}

export interface TrueFalseStatement {
  statement: string;
  isTrue: boolean;
  explanation?: string;
}

export interface TopicPackage {
  /** Версия схемы: если поменяем структуру, старые пакеты из кэша можно будет распознать */
  schemaVersion: 1;
  id: string;
  topic: string;
  grade: number;
  subject: Subject;
  language: Language;
  /** Код цели обучения из программы РК, например "7.2.1.1" */
  curriculumCode?: string;
  definition: string;
  formula?: Formula;
  keyFacts: string[];
  examples: Example[];
  terms: Term[];
  quiz: QuizQuestion[];
  trueFalse: TrueFalseStatement[];
}
