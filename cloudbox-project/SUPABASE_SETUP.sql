
-- CLOUD MEDIA STORAGE / CLOUDBOX
-- Run this entire script in Supabase SQL Editor.
-- This schema is designed for the Express backend in this project.

create extension if not exists pgcrypto;

-- =========================================================
-- PROFILES
-- =========================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text default '',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists full_name text default '';
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists created_at timestamptz not null default now();
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

-- =========================================================
-- FOLDERS
-- =========================================================
create table if not exists public.folders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  parent_id uuid references public.folders(id) on delete set null,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz default null
);

alter table public.folders add column if not exists user_id uuid;
alter table public.folders add column if not exists parent_id uuid;
alter table public.folders add column if not exists name text;
alter table public.folders add column if not exists created_at timestamptz not null default now();
alter table public.folders add column if not exists updated_at timestamptz not null default now();
alter table public.folders add column if not exists deleted_at timestamptz default null;

create index if not exists folders_user_idx on public.folders(user_id);
create index if not exists folders_parent_idx on public.folders(parent_id);
create index if not exists folders_deleted_idx on public.folders(deleted_at);

-- =========================================================
-- FILES
-- =========================================================
create table if not exists public.files (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  folder_id uuid references public.folders(id) on delete set null,
  name text not null,
  original_name text not null,
  mime_type text,
  size_bytes bigint not null default 0,
  storage_path text not null unique,
  deleted_at timestamptz default null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.files add column if not exists user_id uuid;
alter table public.files add column if not exists folder_id uuid;
alter table public.files add column if not exists name text;
alter table public.files add column if not exists original_name text;
alter table public.files add column if not exists mime_type text;
alter table public.files add column if not exists size_bytes bigint default 0;
alter table public.files add column if not exists storage_path text;
alter table public.files add column if not exists deleted_at timestamptz default null;
alter table public.files add column if not exists created_at timestamptz not null default now();
alter table public.files add column if not exists updated_at timestamptz not null default now();

create index if not exists files_user_idx on public.files(user_id);
create index if not exists files_folder_idx on public.files(folder_id);
create index if not exists files_deleted_idx on public.files(deleted_at);
create index if not exists files_name_idx on public.files(name);

-- =========================================================
-- SHARES
-- =========================================================
create table if not exists public.shares (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  item_type text not null check (item_type in ('file','folder')),
  item_id uuid not null,
  shared_with_email text not null,
  permission text not null default 'viewer' check (permission in ('viewer','editor')),
  created_at timestamptz not null default now(),
  unique(item_type, item_id, shared_with_email)
);

create index if not exists shares_owner_idx on public.shares(owner_id);
create index if not exists shares_email_idx on public.shares(shared_with_email);
create index if not exists shares_item_idx on public.shares(item_type, item_id);

-- =========================================================
-- PUBLIC LINK SHARES
-- =========================================================
create table if not exists public.link_shares (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  item_type text not null check (item_type in ('file','folder')),
  item_id uuid not null,
  token text not null unique,
  expires_at timestamptz,
  password_hash text,
  created_at timestamptz not null default now()
);

create index if not exists link_shares_token_idx on public.link_shares(token);
create index if not exists link_shares_owner_idx on public.link_shares(owner_id);

-- =========================================================
-- STARS
-- =========================================================
create table if not exists public.stars (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item_type text not null check (item_type in ('file','folder')),
  item_id uuid not null,
  created_at timestamptz not null default now(),
  unique(user_id, item_type, item_id)
);

create index if not exists stars_user_idx on public.stars(user_id);
create index if not exists stars_item_idx on public.stars(item_type, item_id);

-- =========================================================
-- ACTIVITY LOG
-- =========================================================
create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  action text not null,
  item_type text,
  item_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists activities_user_idx on public.activities(user_id);
create index if not exists activities_created_idx on public.activities(created_at desc);

-- =========================================================
-- ROW LEVEL SECURITY
-- Backend uses the Supabase secret key and performs explicit ACL checks.
-- These policies are still enabled as defense-in-depth for direct access.
-- =========================================================
alter table public.profiles enable row level security;
alter table public.folders enable row level security;
alter table public.files enable row level security;
alter table public.shares enable row level security;
alter table public.link_shares enable row level security;
alter table public.stars enable row level security;
alter table public.activities enable row level security;

drop policy if exists profiles_self on public.profiles;
create policy profiles_self on public.profiles
for all to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists folders_owner on public.folders;
create policy folders_owner on public.folders
for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists files_owner on public.files;
create policy files_owner on public.files
for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists shares_owner on public.shares;
create policy shares_owner on public.shares
for all to authenticated
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

drop policy if exists links_owner on public.link_shares;
create policy links_owner on public.link_shares
for all to authenticated
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

drop policy if exists stars_self on public.stars;
create policy stars_self on public.stars
for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists activities_self on public.activities;
create policy activities_self on public.activities
for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- =========================================================
-- DATA API GRANTS
-- Automatic exposure is OFF in this project, so explicitly grant.
-- =========================================================
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.folders to authenticated;
grant select, insert, update, delete on public.files to authenticated;
grant select, insert, update, delete on public.shares to authenticated;
grant select, insert, update, delete on public.link_shares to authenticated;
grant select, insert, update, delete on public.stars to authenticated;
grant select, insert, update, delete on public.activities to authenticated;

grant all privileges on public.profiles to service_role;
grant all privileges on public.folders to service_role;
grant all privileges on public.files to service_role;
grant all privileges on public.shares to service_role;
grant all privileges on public.link_shares to service_role;
grant all privileges on public.stars to service_role;
grant all privileges on public.activities to service_role;

-- =========================================================
-- PRIVATE STORAGE BUCKET
-- =========================================================
insert into storage.buckets (id, name, public)
values ('cloudbox-files', 'cloudbox-files', false)
on conflict (id) do update set public = false;

-- Storage is accessed by the Express backend with the secret key.
-- Keep the bucket private.

-- =========================================================
-- EXISTING USERS
-- Create a profile row when possible.
-- =========================================================
insert into public.profiles (id, email, full_name)
select id, email, coalesce(raw_user_meta_data->>'full_name', '')
from auth.users
on conflict (id) do nothing;
