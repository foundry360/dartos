-- Auto-create a join code when a league is created (for players without accounts).
-- Default registration mode becomes "code". Backfill existing leagues.

alter table public.leagues
  alter column registration_mode set default 'code';

create or replace function public.leagues_assign_join_code()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  attempts int := 0;
  candidate text;
begin
  if new.registration_mode is null
     or new.registration_mode = 'invite_only' then
    new.registration_mode := 'code';
  end if;

  if new.join_code is not null and trim(new.join_code) <> '' then
    new.join_code := upper(trim(new.join_code));
    return new;
  end if;

  loop
    candidate := public.generate_league_join_code();
    exit when not exists (
      select 1
      from public.leagues
      where join_code = candidate
    );
    attempts := attempts + 1;
    if attempts > 12 then
      raise exception 'Unable to generate join code';
    end if;
  end loop;

  new.join_code := candidate;
  return new;
end;
$$;

drop trigger if exists leagues_assign_join_code_trg on public.leagues;
create trigger leagues_assign_join_code_trg
  before insert on public.leagues
  for each row
  execute function public.leagues_assign_join_code();

do $$
declare
  league_row record;
  candidate text;
  attempts int;
begin
  for league_row in
    select id
    from public.leagues
    where join_code is null
  loop
    attempts := 0;
    loop
      candidate := public.generate_league_join_code();
      begin
        update public.leagues
        set join_code = candidate,
            registration_mode = case
              when registration_mode = 'invite_only' then 'code'
              else registration_mode
            end,
            updated_at = now()
        where id = league_row.id;
        exit;
      exception
        when unique_violation then
          attempts := attempts + 1;
          if attempts > 12 then
            raise;
          end if;
      end;
    end loop;
  end loop;
end;
$$;
