-- Schema: babies, user_preferences, and baby_id on documents / growth_records / document_chunks
-- See docs/supabase-pgvector-rag.md §5–§6.
-- Greenfield: creates missing tables with baby_id. Brownfield: IF NOT EXISTS skip + ADD COLUMN IF NOT EXISTS for baby_id.

begin;

create extension if not exists pgcrypto;

-- 1. Babies (depends only on auth.users)
create table if not exists public.babies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  gender text,
  birth_at timestamptz,
  birth_weight_g integer,
  birth_length_cm numeric(5, 1),
  prefs jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint babies_gender_check check (
    gender is null
    or gender in ('boy', 'girl', 'surprise')
  )
);

create index if not exists babies_user_id_idx on public.babies (user_id);
create index if not exists babies_user_created_idx on public.babies (user_id, created_at desc);

-- 2. User preferences (theme sync optional)
create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,
  theme text not null default 'system',
  updated_at timestamptz not null default now(),
  constraint user_preferences_theme_check check (theme in ('system', 'light', 'dark'))
);

-- 3. Core tables (idempotent: skip if already present from older migration)
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text,
  body text,
  record_type text,
  status text default 'draft',
  recorded_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.growth_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  document_id uuid references public.documents (id) on delete cascade,
  height_cm numeric(5, 1),
  weight_kg numeric(4, 1),
  head_cm numeric(4, 1),
  temperature_c numeric(3, 1),
  milk_ml integer,
  sleep_minutes integer,
  milestone text,
  note text,
  recorded_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.document_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  chunk_index integer not null,
  content text not null,
  content_hash text,
  vector_id text,
  created_at timestamptz not null default now()
);

-- 4. baby_id FK (adds column on legacy installs)
alter table public.documents
  add column if not exists baby_id uuid references public.babies (id) on delete cascade;

alter table public.growth_records
  add column if not exists baby_id uuid references public.babies (id) on delete cascade;

alter table public.document_chunks
  add column if not exists baby_id uuid references public.babies (id) on delete cascade;

-- 5. Indexes (query-friendly, Supabase Postgres best practices)
create index if not exists documents_user_baby_recorded_idx
  on public.documents (user_id, baby_id, recorded_at desc);
create index if not exists document_chunks_user_idx on public.document_chunks (user_id);
create index if not exists document_chunks_document_idx on public.document_chunks (document_id);
create index if not exists document_chunks_user_baby_idx on public.document_chunks (user_id, baby_id);
create index if not exists document_chunks_vector_id_idx on public.document_chunks (vector_id);

create index if not exists growth_records_user_idx on public.growth_records (user_id);
create index if not exists growth_records_document_idx on public.growth_records (document_id);
create index if not exists growth_records_user_baby_recorded_idx
  on public.growth_records (user_id, baby_id, recorded_at desc);
create index if not exists growth_records_recorded_at_idx on public.growth_records (recorded_at);

-- 6. RLS
alter table public.babies enable row level security;
alter table public.user_preferences enable row level security;
alter table public.documents enable row level security;
alter table public.growth_records enable row level security;
alter table public.document_chunks enable row level security;

-- babies
drop policy if exists "babies_select_own" on public.babies;
drop policy if exists "babies_insert_own" on public.babies;
drop policy if exists "babies_update_own" on public.babies;
drop policy if exists "babies_delete_own" on public.babies;
create policy "babies_select_own" on public.babies for select using (user_id = (select auth.uid()));
create policy "babies_insert_own" on public.babies for insert with check (user_id = (select auth.uid()));
create policy "babies_update_own" on public.babies for update using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "babies_delete_own" on public.babies for delete using (user_id = (select auth.uid()));

-- user_preferences
drop policy if exists "user_preferences_select_own" on public.user_preferences;
drop policy if exists "user_preferences_insert_own" on public.user_preferences;
drop policy if exists "user_preferences_update_own" on public.user_preferences;
drop policy if exists "user_preferences_delete_own" on public.user_preferences;
create policy "user_preferences_select_own" on public.user_preferences for select using (user_id = (select auth.uid()));
create policy "user_preferences_insert_own" on public.user_preferences for insert with check (user_id = (select auth.uid()));
create policy "user_preferences_update_own" on public.user_preferences for update using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "user_preferences_delete_own" on public.user_preferences for delete using (user_id = (select auth.uid()));

-- documents
drop policy if exists "documents_select_own" on public.documents;
drop policy if exists "documents_insert_own" on public.documents;
drop policy if exists "documents_update_own" on public.documents;
drop policy if exists "documents_delete_own" on public.documents;
create policy "documents_select_own" on public.documents for select using (user_id = (select auth.uid()));
create policy "documents_insert_own" on public.documents for insert with check (user_id = (select auth.uid()));
create policy "documents_update_own" on public.documents for update using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "documents_delete_own" on public.documents for delete using (user_id = (select auth.uid()));

-- growth_records
drop policy if exists "growth_records_select_own" on public.growth_records;
drop policy if exists "growth_records_insert_own" on public.growth_records;
drop policy if exists "growth_records_update_own" on public.growth_records;
drop policy if exists "growth_records_delete_own" on public.growth_records;
create policy "growth_records_select_own" on public.growth_records for select using (user_id = (select auth.uid()));
create policy "growth_records_insert_own" on public.growth_records for insert with check (user_id = (select auth.uid()));
create policy "growth_records_update_own" on public.growth_records for update using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "growth_records_delete_own" on public.growth_records for delete using (user_id = (select auth.uid()));

-- document_chunks
drop policy if exists "document_chunks_select_own" on public.document_chunks;
drop policy if exists "document_chunks_insert_own" on public.document_chunks;
drop policy if exists "document_chunks_update_own" on public.document_chunks;
drop policy if exists "document_chunks_delete_own" on public.document_chunks;
create policy "document_chunks_select_own" on public.document_chunks for select using (user_id = (select auth.uid()));
create policy "document_chunks_insert_own" on public.document_chunks for insert with check (user_id = (select auth.uid()));
create policy "document_chunks_update_own" on public.document_chunks for update using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "document_chunks_delete_own" on public.document_chunks for delete using (user_id = (select auth.uid()));

commit;
