# Sabaq AI

Сервис для учителей: по теме урока создаёт презентацию и игру для класса. Языки — казахский и русский.

## Разделы

- **Презентации** — генерация по теме, редактор слайдов, экспорт в PowerPoint.
- **Игры** — тест, викторина, «Правда или ложь», «Өз ойын», «Жарыс». Ученики подключаются с телефона по QR-коду.
- **История** — проведённые уроки и результаты учеников.
- **Библиотека** — готовые уроки.
- **Құралдар** — виртуальные опыты, формулы, перевод единиц.
- **Админка** — пользователи, лимиты, статистика.

## Стек

Next.js, React, TypeScript, Tailwind CSS, Google Gemini, Supabase (PostgreSQL), Zod.

## Запуск

Нужен Node.js 20+.

```bash
git clone https://github.com/MarlenGO/sabaq-ai.git
cd sabaq-ai
npm install
npm run dev
```

Переменные окружения — в `.env.local` по образцу `.env.example`: `GEMINI_API_KEY`, `SUPABASE_URL`, `SUPABASE_SECRET_KEY`. Схема базы — `supabase/schema.sql`.
