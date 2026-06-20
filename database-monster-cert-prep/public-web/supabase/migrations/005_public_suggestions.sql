begin;

create table if not exists public.suggestions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 3 and 120),
  details text not null check (char_length(trim(details)) between 5 and 1000),
  category text not null check (category in ('Feature', 'Question', 'Content', 'Bug', 'UI')),
  status text not null default 'Open' check (status in ('Open', 'Planned', 'Done', 'Declined')),
  is_hidden boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.suggestion_votes (
  suggestion_id uuid not null references public.suggestions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (suggestion_id, user_id)
);

create table if not exists public.suggestion_admins (
  email text primary key check (email = lower(email)),
  created_at timestamptz not null default now()
);

insert into public.suggestion_admins (email)
values ('r.deniega.140107.tc@umindanao.edu.ph')
on conflict (email) do nothing;

create index if not exists suggestions_public_board_idx
  on public.suggestions (is_hidden, status, category, created_at desc);
create index if not exists suggestions_user_idx
  on public.suggestions (user_id, created_at desc);
create index if not exists suggestion_votes_user_idx
  on public.suggestion_votes (user_id);

alter table public.suggestions enable row level security;
alter table public.suggestion_votes enable row level security;
alter table public.suggestion_admins enable row level security;

revoke all on public.suggestions from public, anon, authenticated;
revoke all on public.suggestion_votes from public, anon, authenticated;
revoke all on public.suggestion_admins from public, anon, authenticated;

create or replace function public.is_suggestion_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.suggestion_admins
    where email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

create or replace function public.get_public_suggestions(p_category text default null)
returns table (
  id uuid,
  title text,
  details text,
  category text,
  status text,
  vote_count integer,
  has_voted boolean,
  author_display_name text,
  author_course text,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    suggestions.id,
    suggestions.title,
    suggestions.details,
    suggestions.category,
    suggestions.status,
    coalesce(votes.vote_count, 0)::integer as vote_count,
    case
      when (select auth.uid()) is null then false
      else exists (
        select 1
        from public.suggestion_votes
        where suggestion_votes.suggestion_id = suggestions.id
          and suggestion_votes.user_id = (select auth.uid())
      )
    end as has_voted,
    coalesce(nullif(trim(profiles.display_name), ''), 'Database learner') as author_display_name,
    profiles.course as author_course,
    suggestions.created_at,
    suggestions.updated_at
  from public.suggestions
  left join public.profiles on profiles.id = suggestions.user_id
  left join lateral (
    select count(*)::integer as vote_count
    from public.suggestion_votes
    where suggestion_votes.suggestion_id = suggestions.id
  ) votes on true
  where suggestions.is_hidden = false
    and (
      p_category is null
      or p_category = ''
      or suggestions.category = p_category
    )
  order by
    case suggestions.status
      when 'Planned' then 0
      when 'Open' then 1
      when 'Done' then 2
      else 3
    end,
    coalesce(votes.vote_count, 0) desc,
    suggestions.created_at desc;
$$;

create or replace function public.create_suggestion(
  p_title text,
  p_details text,
  p_category text
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_title text := trim(coalesce(p_title, ''));
  v_details text := trim(coalesce(p_details, ''));
  v_category text := trim(coalesce(p_category, ''));
  v_suggestion_id uuid;
begin
  if v_user_id is null then
    raise exception 'Authentication is required';
  end if;

  if char_length(v_title) < 3 or char_length(v_title) > 120 then
    raise exception 'Suggestion title must be 3 to 120 characters';
  end if;

  if char_length(v_details) < 5 or char_length(v_details) > 1000 then
    raise exception 'Suggestion details must be 5 to 1000 characters';
  end if;

  if v_category not in ('Feature', 'Question', 'Content', 'Bug', 'UI') then
    raise exception 'Suggestion category is invalid';
  end if;

  insert into public.suggestions (user_id, title, details, category)
  values (v_user_id, v_title, v_details, v_category)
  returning id into v_suggestion_id;

  return v_suggestion_id;
end;
$$;

create or replace function public.toggle_suggestion_vote(p_suggestion_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_deleted_count integer;
begin
  if v_user_id is null then
    raise exception 'Authentication is required';
  end if;

  if not exists (
    select 1
    from public.suggestions
    where id = p_suggestion_id
      and is_hidden = false
  ) then
    raise exception 'Suggestion is not available';
  end if;

  delete from public.suggestion_votes
  where suggestion_id = p_suggestion_id
    and user_id = v_user_id;
  get diagnostics v_deleted_count = row_count;

  if v_deleted_count > 0 then
    return false;
  end if;

  insert into public.suggestion_votes (suggestion_id, user_id)
  values (p_suggestion_id, v_user_id)
  on conflict do nothing;

  return true;
end;
$$;

create or replace function public.update_suggestion_status(
  p_suggestion_id uuid,
  p_status text,
  p_is_hidden boolean default null
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_status text := trim(coalesce(p_status, ''));
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication is required';
  end if;

  if not public.is_suggestion_admin() then
    raise exception 'Suggestion admin access is required';
  end if;

  if v_status not in ('Open', 'Planned', 'Done', 'Declined') then
    raise exception 'Suggestion status is invalid';
  end if;

  update public.suggestions
  set
    status = v_status,
    is_hidden = coalesce(p_is_hidden, is_hidden),
    updated_at = now()
  where id = p_suggestion_id;
end;
$$;

revoke all on function public.is_suggestion_admin() from public;
revoke all on function public.get_public_suggestions(text) from public;
revoke all on function public.create_suggestion(text, text, text) from public;
revoke all on function public.toggle_suggestion_vote(uuid) from public;
revoke all on function public.update_suggestion_status(uuid, text, boolean) from public;

grant execute on function public.is_suggestion_admin() to anon, authenticated;
grant execute on function public.get_public_suggestions(text) to anon, authenticated;
grant execute on function public.create_suggestion(text, text, text) to authenticated;
grant execute on function public.toggle_suggestion_vote(uuid) to authenticated;
grant execute on function public.update_suggestion_status(uuid, text, boolean) to authenticated;

commit;
