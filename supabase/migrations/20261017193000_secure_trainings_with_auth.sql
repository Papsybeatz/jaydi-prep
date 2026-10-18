alter table public.trainings
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

create index if not exists trainings_user_created_at_idx
  on public.trainings (user_id, "createdAt" desc);

drop policy if exists "Allow anonymous training history reads"
  on public.trainings;
drop policy if exists "Allow anonymous training creation"
  on public.trainings;
drop policy if exists "Users can insert their own trainings"
  on public.trainings;
drop policy if exists "Users can select their own trainings"
  on public.trainings;
drop policy if exists "Users can update their own trainings"
  on public.trainings;
drop policy if exists "Users can delete their own trainings"
  on public.trainings;

revoke all privileges on table public.trainings from anon;
grant select, insert, update, delete on table public.trainings to authenticated;

create policy "Users can insert their own trainings"
  on public.trainings
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can select their own trainings"
  on public.trainings
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can update their own trainings"
  on public.trainings
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own trainings"
  on public.trainings
  for delete
  to authenticated
  using (auth.uid() = user_id);
