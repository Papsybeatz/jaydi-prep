create table if not exists public.trainings (
  id uuid primary key default gen_random_uuid(),
  resume text not null,
  "jobDescription" text not null,
  "lectureText" text not null,
  "audioUrl" text not null default '',
  "createdAt" timestamptz not null default now()
);

alter table public.trainings enable row level security;

grant select, insert on table public.trainings to anon;

create policy "Allow anonymous training history reads"
  on public.trainings
  for select
  to anon
  using (true);

create policy "Allow anonymous training creation"
  on public.trainings
  for insert
  to anon
  with check (true);
