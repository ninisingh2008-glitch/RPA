create extension if not exists "pgcrypto";

create table if not exists public.tournaments (
  id uuid primary key default gen_random_uuid(),
  slug text unique,
  name text not null,
  category text,
  date date,
  city text,
  venue text,
  description text,
  image_url text,
  status text,
  registration_link text,
  results text,
  rules text,
  fee text,
  contact text,
  is_featured boolean default false,
  created_at timestamptz default now()
);

create table if not exists public.gallery_events (
  id uuid primary key default gen_random_uuid(),
  slug text unique,
  title text not null,
  category text,
  date date,
  location text,
  summary text,
  cover_image_url text,
  status text default 'Published',
  created_at timestamptz default now()
);

create table if not exists public.gallery_images (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.gallery_events(id) on delete cascade,
  image_url text not null,
  alt text,
  caption text,
  sort_order integer default 0,
  created_at timestamptz default now()
);

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  full_name text,
  role text default 'member',
  email text unique,
  status text default 'Active',
  password_hash text not null,
  created_at timestamptz default now()
);

create index if not exists tournaments_date_idx on public.tournaments(date);
create index if not exists gallery_events_date_idx on public.gallery_events(date);
create index if not exists gallery_images_event_idx on public.gallery_images(event_id, sort_order);
