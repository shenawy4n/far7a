-- Phase 3.1: section-based template engine (additive only)

alter table public.invitations
  add column if not exists theme_overrides jsonb not null default '{}'::jsonb;
comment on column public.invitations.theme_overrides is 'Per-invitation theme overrides merged over templates.settings.theme by the renderer';

create unique index if not exists invitation_sections_invitation_type_key
  on public.invitation_sections (invitation_id, section_type);

create index if not exists media_invitation_sort_idx on public.media (invitation_id, sort_order);

-- Fallback section list for templates that do not define settings.sections
create or replace function public.default_template_sections()
returns jsonb language sql immutable set search_path = public as $$
  select '[{"type":"hero","visible":true},{"type":"couple","visible":true},{"type":"event","visible":true},{"type":"venue","visible":true},{"type":"transportation","visible":true},{"type":"gallery","visible":true},{"type":"notes","visible":true}]'::jsonb
$$;

-- Adds any missing sections from the invitation's template config. Never deletes or duplicates.
create or replace function public.initialize_invitation_sections(_invitation_id uuid)
returns integer language plpgsql set search_path = public as $$
declare
  _cfg jsonb;
  _base integer;
  _n integer;
begin
  select coalesce(case when jsonb_typeof(t.settings->'sections') = 'array' then t.settings->'sections' end,
                  public.default_template_sections())
    into _cfg
  from public.invitations i
  left join public.templates t on t.id = i.template_id
  where i.id = _invitation_id;

  if _cfg is null then return 0; end if;

  select coalesce(max(sort_order), 0) into _base
  from public.invitation_sections where invitation_id = _invitation_id;

  insert into public.invitation_sections (invitation_id, section_type, sort_order, is_visible)
  select _invitation_id, e.value->>'type', _base + (e.ord * 10)::int,
         coalesce((e.value->>'visible')::boolean, true)
  from jsonb_array_elements(_cfg) with ordinality as e(value, ord)
  where e.value->>'type' in ('hero','couple','event','venue','transportation','gallery','notes')
  on conflict (invitation_id, section_type) do nothing;

  get diagnostics _n = row_count;
  return _n;
end;
$$;
grant execute on function public.initialize_invitation_sections(uuid) to authenticated, service_role;

create or replace function public.invitations_init_sections()
returns trigger language plpgsql set search_path = public as $$
begin
  perform public.initialize_invitation_sections(new.id);
  return new;
end;
$$;

drop trigger if exists invitations_init_sections on public.invitations;
create trigger invitations_init_sections
  after insert or update of template_id on public.invitations
  for each row execute function public.invitations_init_sections();

-- Backfill: template default configuration
update public.templates set settings = jsonb_build_object(
  'layout', 'classic',
  'theme', jsonb_build_object(
    'colors', '{}'::jsonb,
    'typography', jsonb_build_object('heading', 'display', 'body', 'sans'),
    'layout', jsonb_build_object('contentWidth', 'narrow', 'sectionSpacing', 'normal')),
  'sections', public.default_template_sections())
where slug = 'classic-gold' and (settings = '{}'::jsonb or settings is null);

update public.templates set settings = jsonb_build_object(
  'layout', 'minimal',
  'theme', jsonb_build_object(
    'colors', '{}'::jsonb,
    'typography', jsonb_build_object('heading', 'display', 'body', 'sans'),
    'layout', jsonb_build_object('contentWidth', 'narrow', 'sectionSpacing', 'relaxed')),
  'sections', public.default_template_sections())
where slug = 'modern-minimal' and (settings = '{}'::jsonb or settings is null);

-- Backfill: sections for existing invitations
select public.initialize_invitation_sections(id) from public.invitations;

-- Public, published-only theme + media (safe fields only)
create or replace function public.get_public_invitation_theme(_slug text)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'layout', t.settings->'layout',
    'theme', coalesce(t.settings->'theme', '{}'::jsonb),
    'overrides', coalesce(i.theme_overrides, '{}'::jsonb))
  from public.invitations i
  left join public.templates t on t.id = i.template_id
  where i.slug = _slug and i.status = 'published';
$$;
grant execute on function public.get_public_invitation_theme(text) to anon, authenticated, service_role;

create or replace function public.get_public_invitation_media(_slug text)
returns table (file_url text, file_type text, sort_order integer)
language sql stable security definer set search_path = public as $$
  select m.file_url, m.file_type, m.sort_order
  from public.media m
  join public.invitations i on i.id = m.invitation_id
  where i.slug = _slug and i.status = 'published'
  order by m.sort_order;
$$;
grant execute on function public.get_public_invitation_media(text) to anon, authenticated, service_role;