-- ============ enums ============
create type public.app_role as enum ('admin', 'editor', 'viewer');
create type public.invitation_status as enum ('draft', 'published', 'archived');
create type public.event_type as enum ('wedding', 'engagement', 'birthday', 'graduation', 'other');

-- ============ helper: updated_at ============
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============ profiles ============
create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  full_name text,
  email text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

-- ============ user_roles (authority for roles) ============
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role);
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select public.has_role(auth.uid(), 'admin');
$$;

create policy "own profile read" on public.profiles for select to authenticated using (auth.uid() = user_id or public.is_admin());
create policy "own profile insert" on public.profiles for insert to authenticated with check (auth.uid() = user_id);
create policy "own profile update" on public.profiles for update to authenticated using (auth.uid() = user_id);
create policy "own roles read" on public.user_roles for select to authenticated using (auth.uid() = user_id or public.is_admin());

-- new user: profile + bootstrap first admin
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (user_id, full_name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''), new.email)
  on conflict (user_id) do nothing;

  if not exists (select 1 from public.user_roles where role = 'admin') then
    insert into public.user_roles (user_id, role) values (new.id, 'admin');
  end if;
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============ clients ============
create table public.clients (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text,
  email text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.clients to authenticated;
grant all on public.clients to service_role;
alter table public.clients enable row level security;
create policy "admins manage clients" on public.clients for all to authenticated using (public.is_admin()) with check (public.is_admin());
create trigger clients_updated_at before update on public.clients for each row execute function public.set_updated_at();

-- ============ templates ============
create table public.templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  thumbnail_url text,
  category text,
  settings jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.templates to authenticated;
grant all on public.templates to service_role;
alter table public.templates enable row level security;
create policy "authenticated read templates" on public.templates for select to authenticated using (true);
create policy "admins manage templates" on public.templates for all to authenticated using (public.is_admin()) with check (public.is_admin());
create trigger templates_updated_at before update on public.templates for each row execute function public.set_updated_at();

-- ============ invitations ============
create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id) on delete set null,
  template_id uuid references public.templates(id) on delete set null,
  slug text not null unique,
  title text,
  event_type public.event_type not null default 'wedding',
  status public.invitation_status not null default 'draft',
  groom_name text,
  bride_name text,
  groom_family text,
  bride_family text,
  event_date date,
  event_time time,
  venue_name text,
  venue_address text,
  maps_url text,
  transportation_info text,
  parking_info text,
  additional_notes text,
  cover_image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz
);
create index invitations_status_idx on public.invitations (status);
create index invitations_created_at_idx on public.invitations (created_at desc);
grant select, insert, update, delete on public.invitations to authenticated;
grant all on public.invitations to service_role;
alter table public.invitations enable row level security;
create policy "admins manage invitations" on public.invitations for all to authenticated using (public.is_admin()) with check (public.is_admin());
create trigger invitations_updated_at before update on public.invitations for each row execute function public.set_updated_at();

-- published_at bookkeeping
create or replace function public.sync_published_at()
returns trigger language plpgsql as $$
begin
  if new.status = 'published' and new.published_at is null then
    new.published_at = now();
  end if;
  return new;
end;
$$;
create trigger invitations_published_at before insert or update on public.invitations
  for each row execute function public.sync_published_at();

-- ============ invitation_sections ============
create table public.invitation_sections (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references public.invitations(id) on delete cascade,
  section_type text not null,
  title text,
  content text,
  sort_order integer not null default 0,
  is_visible boolean not null default true,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index invitation_sections_invitation_idx on public.invitation_sections (invitation_id, sort_order);
grant select, insert, update, delete on public.invitation_sections to authenticated;
grant all on public.invitation_sections to service_role;
alter table public.invitation_sections enable row level security;
create policy "admins manage sections" on public.invitation_sections for all to authenticated using (public.is_admin()) with check (public.is_admin());
create trigger invitation_sections_updated_at before update on public.invitation_sections for each row execute function public.set_updated_at();

-- ============ media ============
create table public.media (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references public.invitations(id) on delete cascade,
  file_url text not null,
  file_type text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index media_invitation_idx on public.media (invitation_id, sort_order);
grant select, insert, update, delete on public.media to authenticated;
grant all on public.media to service_role;
alter table public.media enable row level security;
create policy "admins manage media" on public.media for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ============ slug generation ============
create or replace function public.slugify(_input text)
returns text language sql immutable as $$
  select trim(both '-' from regexp_replace(lower(coalesce(_input, '')), '[^a-z0-9\u0621-\u064A]+', '-', 'g'));
$$;

create or replace function public.generate_invitation_slug(_base text)
returns text language plpgsql security definer set search_path = public as $$
declare
  base text := public.slugify(_base);
  candidate text;
  n integer := 1;
begin
  if base is null or base = '' then
    base := 'invitation';
  end if;
  candidate := base;
  while exists (select 1 from public.invitations where slug = candidate) loop
    n := n + 1;
    candidate := base || '-' || n;
  end loop;
  return candidate;
end;
$$;
grant execute on function public.generate_invitation_slug(text) to authenticated, service_role;

-- ============ safe public read ============
create or replace function public.get_public_invitation(_slug text)
returns table (
  slug text,
  title text,
  event_type public.event_type,
  groom_name text,
  bride_name text,
  groom_family text,
  bride_family text,
  event_date date,
  event_time time,
  venue_name text,
  venue_address text,
  maps_url text,
  transportation_info text,
  parking_info text,
  additional_notes text,
  cover_image_url text,
  template_slug text
)
language sql stable security definer set search_path = public as $$
  select i.slug, i.title, i.event_type, i.groom_name, i.bride_name, i.groom_family, i.bride_family,
         i.event_date, i.event_time, i.venue_name, i.venue_address, i.maps_url,
         i.transportation_info, i.parking_info, i.additional_notes, i.cover_image_url, t.slug
  from public.invitations i
  left join public.templates t on t.id = i.template_id
  where i.slug = _slug and i.status = 'published';
$$;
grant execute on function public.get_public_invitation(text) to anon, authenticated, service_role;

create or replace function public.get_public_invitation_sections(_slug text)
returns table (section_type text, title text, content text, sort_order integer, settings jsonb)
language sql stable security definer set search_path = public as $$
  select s.section_type, s.title, s.content, s.sort_order, s.settings
  from public.invitation_sections s
  join public.invitations i on i.id = s.invitation_id
  where i.slug = _slug and i.status = 'published' and s.is_visible
  order by s.sort_order;
$$;
grant execute on function public.get_public_invitation_sections(text) to anon, authenticated, service_role;

-- ============ DEMO DATA (safe to delete: rows tagged below) ============
insert into public.templates (name, slug, description, category, is_active) values
  ('Classic Gold', 'classic-gold', 'DEMO — elegant serif layout with gold accents', 'wedding', true),
  ('Modern Minimal', 'modern-minimal', 'DEMO — clean minimal layout', 'wedding', true);

insert into public.clients (full_name, phone, email, notes) values
  ('Ahmed Al-Sayed', '+201000000001', 'ahmed.demo@example.com', 'DEMO client'),
  ('Sara Mansour', '+201000000002', 'sara.demo@example.com', 'DEMO client');

insert into public.invitations (client_id, template_id, slug, title, event_type, status, groom_name, bride_name, groom_family, bride_family, event_date, event_time, venue_name, venue_address, maps_url, transportation_info, additional_notes)
select c.id, t.id, 'ahmed-emaan', 'DEMO — Ahmed & Emaan', 'wedding', 'published', 'Ahmed', 'Emaan', 'Al-Sayed Family', 'Hassan Family', current_date + 30, '19:00', 'Nile Ballroom', 'Corniche El Nil, Cairo', 'https://maps.google.com/?q=Cairo', 'Valet parking available at the main gate', 'DEMO invitation'
from public.clients c, public.templates t where c.full_name = 'Ahmed Al-Sayed' and t.slug = 'classic-gold';

insert into public.invitations (client_id, template_id, slug, title, event_type, status, groom_name, bride_name, event_date, event_time, venue_name, venue_address, additional_notes)
select c.id, t.id, 'omar-sara', 'DEMO — Omar & Sara', 'engagement', 'draft', 'Omar', 'Sara', current_date + 60, '20:30', 'Garden Hall', 'Sheikh Zayed, Giza', 'DEMO invitation'
from public.clients c, public.templates t where c.full_name = 'Sara Mansour' and t.slug = 'modern-minimal';
