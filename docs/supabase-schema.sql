-- ============================================================================
-- Too Match — Schema de Supabase
-- ============================================================================
-- Cómo correrlo:
--   1. Ve a https://supabase.com/dashboard → tu proyecto
--   2. Menú izquierdo → SQL Editor → "+ New query"
--   3. Pega TODO el contenido de este archivo
--   4. Pulsa "Run"
--
-- Si más adelante cambias el schema, vuelve a correr solo los CREATE/ALTER
-- nuevos. Las CREATE POLICY usan DROP + CREATE así que son idempotentes.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- profiles  — un perfil por usuario, ligado a auth.users
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,

  -- Nombre para mostrar (auto-generado del email si no se indica)
  display_name        text,

  -- Onboarding (texto libre)
  self_description    text,
  partner_description text,

  -- Valores (pills, hasta 4)
  values text[] not null default '{}',

  -- Identidad y orientación
  gender  text check (gender  in ('male','female','other')),
  seeking text check (seeking in ('male','female','both')),

  -- Edad y rango buscado
  age     int check (age     between 18 and 99),
  age_min int not null default 18 check (age_min between 18 and 99),
  age_max int not null default 99 check (age_max between 18 and 99),

  -- Geografía
  distance_km int not null default 50 check (distance_km between 1 and 500),
  city        text,

  -- Fotos (paths de Supabase Storage; la primera es la principal)
  photos text[] not null default '{}',

  -- Estado del flujo
  onboarding_completed boolean not null default false,
  day_number           int     not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Añadir display_name a perfiles existentes sin esa columna
alter table public.profiles
  add column if not exists display_name text;


-- ----------------------------------------------------------------------------
-- Trigger para mantener updated_at fresco en cada UPDATE
-- ----------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();


-- ----------------------------------------------------------------------------
-- Row Level Security — profiles
-- Los usuarios ven su propio perfil + el de sus matches.
-- ----------------------------------------------------------------------------
alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own"     on public.profiles;
drop policy if exists "profiles_select_matched" on public.profiles;
create policy "profiles_select_matched" on public.profiles
  for select using (
    auth.uid() = user_id
    OR exists (
      select 1 from public.matches m
      where (m.user1_id = auth.uid() and m.user2_id = user_id)
         or (m.user2_id = auth.uid() and m.user1_id = user_id)
    )
  );

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = user_id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);


-- ============================================================================
-- Storage: bucket profile-photos
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('profile-photos', 'profile-photos', true)
on conflict (id) do nothing;

drop policy if exists "users_own_photos_insert"    on storage.objects;
create policy "users_own_photos_insert" on storage.objects
  for insert with check (
    bucket_id = 'profile-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "users_own_photos_delete" on storage.objects;
create policy "users_own_photos_delete" on storage.objects
  for delete using (
    bucket_id = 'profile-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "anyone_read_profile_photos" on storage.objects;
create policy "anyone_read_profile_photos" on storage.objects
  for select using (bucket_id = 'profile-photos');


-- ============================================================================
-- matches  — pareja de usuarios emparejados
-- ============================================================================
create table if not exists public.matches (
  id                 uuid primary key default gen_random_uuid(),
  user1_id           uuid not null references auth.users(id) on delete cascade,
  user2_id           uuid not null references auth.users(id) on delete cascade,
  compatibility_score int  not null default 50 check (compatibility_score between 0 and 100),
  unmatched_by       uuid references auth.users(id),
  unmatch_reason     text,
  notified_at        timestamptz,   -- cuándo se envió el email de notificación (null = pendiente)
  created_at         timestamptz not null default now(),
  constraint no_self_match check (user1_id != user2_id)
);

create index if not exists matches_user1_idx on public.matches (user1_id);
create index if not exists matches_user2_idx on public.matches (user2_id);

alter table public.matches enable row level security;

drop policy if exists "matches_select_participant" on public.matches;
create policy "matches_select_participant" on public.matches
  for select using (auth.uid() = user1_id or auth.uid() = user2_id);

drop policy if exists "matches_insert_own" on public.matches;
create policy "matches_insert_own" on public.matches
  for insert with check (auth.uid() = user1_id);

drop policy if exists "matches_update_participant" on public.matches;
create policy "matches_update_participant" on public.matches
  for update using (auth.uid() = user1_id or auth.uid() = user2_id);


-- ============================================================================
-- messages  — mensajes de cada conversación
-- ============================================================================
create table if not exists public.messages (
  id         uuid primary key default gen_random_uuid(),
  match_id   uuid not null references public.matches(id) on delete cascade,
  sender_id  uuid not null references auth.users(id) on delete cascade,
  content    text not null check (char_length(content) > 0),
  created_at timestamptz not null default now()
);

create index if not exists messages_match_idx on public.messages (match_id, created_at);

alter table public.messages enable row level security;

drop policy if exists "messages_select_participant" on public.messages;
create policy "messages_select_participant" on public.messages
  for select using (
    exists (
      select 1 from public.matches m
      where m.id = match_id
        and (m.user1_id = auth.uid() or m.user2_id = auth.uid())
    )
  );

drop policy if exists "messages_insert_participant" on public.messages;
create policy "messages_insert_participant" on public.messages
  for insert with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.matches m
      where m.id = match_id
        and (m.user1_id = auth.uid() or m.user2_id = auth.uid())
        and m.unmatched_by is null
    )
  );

-- Habilitar Realtime en messages para subscripciones en tiempo real
alter publication supabase_realtime add table public.messages;


-- ============================================================================
-- daily_questions  — una pregunta por día
-- ============================================================================
create table if not exists public.daily_questions (
  id            uuid primary key default gen_random_uuid(),
  question_text text   not null,
  options       text[] not null,
  active_date   date   not null unique,
  created_at    timestamptz not null default now()
);

alter table public.daily_questions enable row level security;

drop policy if exists "daily_questions_select_auth" on public.daily_questions;
create policy "daily_questions_select_auth" on public.daily_questions
  for select using (auth.role() = 'authenticated');


-- ============================================================================
-- daily_answers  — respuesta de cada usuario a cada pregunta
-- ============================================================================
create table if not exists public.daily_answers (
  user_id     uuid not null references auth.users(id) on delete cascade,
  question_id uuid not null references public.daily_questions(id) on delete cascade,
  answer      text not null,
  created_at  timestamptz not null default now(),
  primary key (user_id, question_id)
);

alter table public.daily_answers enable row level security;

drop policy if exists "daily_answers_select_own" on public.daily_answers;
create policy "daily_answers_select_own" on public.daily_answers
  for select using (auth.uid() = user_id);

drop policy if exists "daily_answers_insert_own" on public.daily_answers;
create policy "daily_answers_insert_own" on public.daily_answers
  for insert with check (auth.uid() = user_id);


-- ============================================================================
-- Función RPC: find_compatible_profiles
-- Devuelve perfiles compatibles para el matching (SECURITY DEFINER para leer
-- todos los perfiles onboarding_completed sin restricción de RLS).
-- ============================================================================
create or replace function public.find_compatible_profiles(
  for_user_id     uuid,
  strict_distance boolean default true
)
returns table (
  user_id             uuid,
  display_name        text,
  self_description    text,
  partner_description text,
  user_values         text[],
  gender              text,
  seeking             text,
  age                 int,
  age_min             int,
  age_max             int,
  distance_km         int,
  province            text,
  city                text,
  photos              text[],
  day_number          int,
  relationship_intent text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  my_profile public.profiles%rowtype;
begin
  select * into my_profile from public.profiles p where p.user_id = for_user_id;
  if not found then return; end if;

  return query
    select
      p.user_id,
      p.display_name,
      p.self_description,
      p.partner_description,
      p."values"          as user_values,
      p.gender,
      p.seeking,
      p.age,
      p.age_min,
      p.age_max,
      p.distance_km,
      p.province,
      p.city,
      p.photos,
      p.day_number,
      p.relationship_intent
    from public.profiles p
    where p.user_id <> for_user_id
      and p.onboarding_completed = true
      -- Orientación: yo busco su género y él busca el mío
      and (my_profile.seeking = 'both' or my_profile.seeking = p.gender)
      and (p.seeking = 'both' or p.seeking = my_profile.gender)
      -- Edad: su edad entra en mi rango y la mía en el suyo
      and (my_profile.age is null or p.age_min is null or my_profile.age >= p.age_min)
      and (my_profile.age is null or p.age_max is null or my_profile.age <= p.age_max)
      and (p.age is null or my_profile.age_min is null or p.age >= my_profile.age_min)
      and (p.age is null or my_profile.age_max is null or p.age <= my_profile.age_max)
      -- Distancia: con strict_distance, ambos han de coincidir en provincia
      -- Si alguno no tiene provincia, se acepta (sin dato no se puede filtrar)
      and (
        not strict_distance
        or my_profile.province is null
        or p.province is null
        or my_profile.province = p.province
      )
      -- No están ya emparejados (activo o pasado)
      and not exists (
        select 1 from public.matches m
        where (m.user1_id = for_user_id and m.user2_id = p.user_id)
           or (m.user2_id = for_user_id and m.user1_id = p.user_id)
      );
end;
$$;


-- ============================================================================
-- Seed: preguntas diarias de ejemplo
-- ============================================================================
insert into public.daily_questions (question_text, options, active_date) values
  ('Después de un día complicado, ¿qué te recarga?',
   ARRAY['Una conversación larga', 'Tiempo solo, sin móvil', 'Una caminata al aire libre', 'Cocinar algo despacio'],
   current_date),
  ('¿Cómo prefieres empezar el fin de semana?',
   ARRAY['Quedando con amigos', 'Un café tranquilo en casa', 'Saliendo a caminar', 'Sin plan, que fluya'],
   current_date + 1),
  ('¿Qué dice más de una persona?',
   ARRAY['Cómo trata al personal de servicio', 'Lo que le da vergüenza', 'Sus excusas favoritas', 'Cómo reacciona cuando pierde'],
   current_date + 2),
  ('Tu ideal de una tarde perfecta:',
   ARRAY['Una exposición o museo', 'Mercadillo y barrio nuevo', 'Peli en casa con manta', 'Deporte al aire libre'],
   current_date + 3),
  ('Al conocer a alguien, ¿qué te engancha primero?',
   ARRAY['El sentido del humor', 'Que escuche de verdad', 'Su forma de ver las cosas', 'La energía que transmite'],
   current_date + 4),
  ('¿Cuál es tu relación con el tiempo libre?',
   ARRAY['Lo necesito para recargar', 'Me incomoda si no hago nada', 'Depende del día', 'Disfruto cada momento'],
   current_date + 5),
  ('¿Cómo te comunicas cuando algo te molesta?',
   ARRAY['Lo digo directamente', 'Me lo guardo hasta que explota', 'Busco el momento adecuado', 'Depende de la persona'],
   current_date + 6)
on conflict (active_date) do nothing;
