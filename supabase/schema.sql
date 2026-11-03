-- Схема базы Sabaq AI. Выполнить один раз: Supabase → SQL Editor → New query →
-- вставить весь файл → Run. Повторный запуск безопасен (if not exists).
--
-- Доступ к таблицам только с сервера сайта по секретному ключу (SUPABASE_SECRET_KEY).
-- RLS включён и правил нет: публичный ключ из браузера не прочитает ничего.

create extension if not exists pgcrypto;

-- Учителя и админы. login — email или простой логин (например, «mama»)
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  login text not null unique,
  name text not null,
  password_hash text not null,
  role text not null default 'teacher' check (role in ('admin', 'teacher')),
  status text not null default 'pending' check (status in ('pending', 'active', 'blocked')),
  -- Генераций AI в день; null — по умолчанию (у админов без лимита)
  daily_limit integer,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz
);

-- Вход в браузере: в cookie лежит случайный токен, здесь — только его хэш
create table if not exists sessions (
  token_hash text primary key,
  user_id uuid not null references users on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists sessions_user on sessions (user_id);

-- Одноразовая ссылка для входа (для мамы: открыть один раз на её компьютере)
create table if not exists login_links (
  token_hash text primary key,
  user_id uuid not null references users on delete cascade,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

-- Коды приглашения: с кодом учитель сразу активен, без кода ждёт одобрения
create table if not exists invites (
  code text primary key,
  created_by uuid references users on delete set null,
  uses integer not null default 0,
  max_uses integer,
  created_at timestamptz not null default now()
);

-- Уроки: весь пакет темы в data, рядом — поля для списков и поиска
create table if not exists lessons (
  id text primary key,
  owner_id uuid not null references users on delete cascade,
  cache_key text,
  topic text not null,
  grade integer not null,
  language text not null,
  subject text not null,
  source text not null,
  deck_type text,
  featured boolean not null default false,
  data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists lessons_owner on lessons (owner_id, updated_at desc);
create index if not exists lessons_cache on lessons (owner_id, cache_key);
create index if not exists lessons_featured on lessons (featured) where featured;

-- Кэш AI: одна тема генерируется один раз на всех учителей, у каждого — своя копия урока
create table if not exists ai_cache (
  key text primary key,
  content jsonb not null,
  created_at timestamptz not null default now()
);

-- Игры через QR: комната (вопросы, ход «Жарыса») и ученики
create table if not exists rooms (
  code text primary key,
  owner_id uuid references users on delete cascade,
  lesson_id text,
  data jsonb not null,
  created_at timestamptz not null default now()
);
create index if not exists rooms_owner on rooms (owner_id, created_at desc);

create table if not exists players (
  id text primary key,
  room_code text not null references rooms on delete cascade,
  name text not null,
  shuffle jsonb,
  joined_at timestamptz not null default now()
);
create index if not exists players_room on players (room_code);

-- Ответ на вопрос — отдельная строка; unique не даёт ответить дважды,
-- даже если ученик быстро нажал два раза
create table if not exists answers (
  player_id text not null references players on delete cascade,
  room_code text not null references rooms on delete cascade,
  question integer not null,
  choice integer not null,
  correct boolean not null,
  points integer not null,
  at timestamptz not null default now(),
  primary key (player_id, question)
);
create index if not exists answers_room on answers (room_code);

-- Журнал: скачанные презентации и игры на экране (для истории)
create table if not exists activity (
  id bigint generated always as identity primary key,
  user_id uuid not null references users on delete cascade,
  data jsonb not null,
  at timestamptz not null default now()
);
create index if not exists activity_user on activity (user_id, at desc);

-- Каждый запрос к AI: для лимита в день, расхода и списка ошибок в админке
create table if not exists ai_usage (
  id bigint generated always as identity primary key,
  user_id uuid references users on delete set null,
  kind text not null,
  ok boolean not null,
  error text,
  at timestamptz not null default now()
);
create index if not exists ai_usage_user on ai_usage (user_id, at desc);
create index if not exists ai_usage_at on ai_usage (at desc);

alter table users enable row level security;
alter table sessions enable row level security;
alter table login_links enable row level security;
alter table invites enable row level security;
alter table lessons enable row level security;
alter table ai_cache enable row level security;
alter table rooms enable row level security;
alter table players enable row level security;
alter table answers enable row level security;
alter table activity enable row level security;
alter table ai_usage enable row level security;
