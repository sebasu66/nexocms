-- Applied to Nexo_test on 2026-07-31.
begin;

set local lock_timeout = '10s';
set local statement_timeout = '120s';

-- The user confirmed these legacy tables are empty and need not be preserved.
drop table if exists public.orden_items cascade;
drop table if exists public.venta_items cascade;
drop table if exists public.envios cascade;
drop table if exists public.pagos cascade;
drop table if exists public.facturas cascade;
drop table if exists public.ordenes cascade;
drop table if exists public.ventas cascade;
drop table if exists public.productos cascade;
drop table if exists public.categorias cascade;
drop table if exists public.proveedores cascade;
drop table if exists public.clientes cascade;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  status text not null default 'active'
    check (status in ('active', 'suspended', 'archived')),
  branding jsonb not null default '{}'::jsonb,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  preferences jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organization_members (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member'
    check (role in ('owner', 'admin', 'manager', 'member', 'viewer')),
  status text not null default 'active'
    check (status in ('invited', 'active', 'suspended')),
  permissions jsonb not null default '[]'::jsonb,
  joined_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  code text not null,
  legal_name text not null,
  trade_name text,
  tax_id text,
  email text,
  phone text,
  status text not null default 'active'
    check (status in ('active', 'inactive', 'archived')),
  custom_data jsonb not null default '{}'::jsonb,
  external_refs jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, code)
);

create table public.locations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete cascade,
  code text,
  name text not null,
  location_type text not null default 'other'
    check (location_type in ('warehouse', 'branch', 'customer', 'hospital', 'clinic', 'sector', 'other')),
  address jsonb not null default '{}'::jsonb,
  latitude numeric(9,6),
  longitude numeric(9,6),
  custom_data jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, code)
);

create table public.product_categories (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  parent_id uuid references public.product_categories(id) on delete set null,
  code text,
  name text not null,
  custom_data jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, code)
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  category_id uuid references public.product_categories(id) on delete set null,
  sku text not null,
  name text not null,
  description text,
  product_type text not null default 'product'
    check (product_type in ('product', 'service', 'consumable', 'component')),
  unit text not null default 'unit',
  price numeric(14,2),
  currency text not null default 'ARS',
  status text not null default 'active'
    check (status in ('active', 'inactive', 'archived')),
  custom_data jsonb not null default '{}'::jsonb,
  external_refs jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, sku)
);

create table public.asset_types (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  code text not null,
  name text not null,
  description text,
  configuration jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, code)
);

create table public.assets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  asset_type_id uuid not null references public.asset_types(id) on delete restrict,
  current_location_id uuid references public.locations(id) on delete set null,
  code text not null,
  name text not null,
  serial_number text,
  status text not null default 'available'
    check (status in ('available', 'reserved', 'dispatched', 'in_use', 'inspection', 'maintenance', 'retired')),
  acquired_at date,
  custom_data jsonb not null default '{}'::jsonb,
  external_refs jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, code)
);

create table public.asset_components (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  asset_id uuid not null references public.assets(id) on delete cascade,
  product_id uuid references public.products(id) on delete restrict,
  component_asset_id uuid references public.assets(id) on delete restrict,
  quantity numeric(14,3) not null default 1 check (quantity > 0),
  is_required boolean not null default true,
  custom_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (product_id is not null or component_asset_id is not null),
  check (component_asset_id is null or component_asset_id <> asset_id)
);

create table public.operation_types (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  code text not null,
  name text not null,
  description text,
  workflow jsonb not null default '{}'::jsonb,
  configuration jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, code)
);

create table public.operations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  operation_type_id uuid not null references public.operation_types(id) on delete restrict,
  customer_id uuid references public.customers(id) on delete restrict,
  origin_location_id uuid references public.locations(id) on delete set null,
  destination_location_id uuid references public.locations(id) on delete set null,
  number text not null,
  status text not null default 'draft',
  title text,
  expected_start_at timestamptz,
  expected_end_at timestamptz,
  actual_start_at timestamptz,
  actual_end_at timestamptz,
  custom_data jsonb not null default '{}'::jsonb,
  calculated_summary jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, number),
  check (expected_end_at is null or expected_start_at is null or expected_end_at >= expected_start_at),
  check (actual_end_at is null or actual_start_at is null or actual_end_at >= actual_start_at)
);

create table public.operation_assets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  operation_id uuid not null references public.operations(id) on delete cascade,
  asset_id uuid not null references public.assets(id) on delete restrict,
  role text not null default 'primary',
  quantity numeric(14,3) not null default 1 check (quantity > 0),
  condition_out jsonb not null default '{}'::jsonb,
  condition_in jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (operation_id, asset_id)
);

create table public.operation_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  operation_id uuid not null references public.operations(id) on delete cascade,
  event_type text not null,
  from_status text,
  to_status text,
  occurred_at timestamptz not null default now(),
  actor_id uuid references public.profiles(id) on delete set null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.document_types (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  code text not null,
  name text not null,
  prefix text not null default '',
  template jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, code)
);

create table public.document_sequences (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  document_type_id uuid not null references public.document_types(id) on delete cascade,
  series text not null default 'A',
  prefix text not null default '',
  next_number bigint not null default 1 check (next_number > 0),
  padding smallint not null default 8 check (padding between 1 and 18),
  updated_at timestamptz not null default now(),
  unique (organization_id, document_type_id, series)
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  document_type_id uuid not null references public.document_types(id) on delete restrict,
  operation_id uuid references public.operations(id) on delete set null,
  number text not null,
  status text not null default 'draft'
    check (status in ('draft', 'issued', 'signed', 'cancelled')),
  issued_at timestamptz,
  snapshot jsonb not null default '{}'::jsonb,
  storage_path text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, document_type_id, number)
);

create table public.signatures (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  document_id uuid not null references public.documents(id) on delete cascade,
  signer_name text not null,
  signer_identifier text,
  signer_role text,
  signed_at timestamptz not null default now(),
  storage_path text,
  signature_data jsonb not null default '{}'::jsonb,
  captured_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.field_definitions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  entity_type text not null,
  field_key text not null,
  label text not null,
  data_type text not null
    check (data_type in ('text', 'number', 'boolean', 'date', 'datetime', 'select', 'multiselect', 'json')),
  required boolean not null default false,
  searchable boolean not null default false,
  configuration jsonb not null default '{}'::jsonb,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, entity_type, field_key)
);

create table public.agent_profiles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  code text not null,
  name text not null,
  description text,
  instructions text not null default '',
  enabled_modules jsonb not null default '[]'::jsonb,
  allowed_tool_groups jsonb not null default '[]'::jsonb,
  terminology jsonb not null default '{}'::jsonb,
  example_prompts jsonb not null default '[]'::jsonb,
  branding jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, code)
);

create table public.audit_log (
  id bigint generated always as identity primary key,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  request_id text,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

-- Foreign keys and common filters need explicit indexes in Postgres.
create index organization_members_user_id_idx on public.organization_members (user_id);
create index organization_members_active_user_idx on public.organization_members (user_id, organization_id)
  where status = 'active';
create index customers_org_name_idx on public.customers (organization_id, legal_name);
create index locations_org_customer_idx on public.locations (organization_id, customer_id);
create index product_categories_org_parent_idx on public.product_categories (organization_id, parent_id);
create index products_org_category_idx on public.products (organization_id, category_id);
create index asset_types_org_idx on public.asset_types (organization_id);
create index assets_org_type_status_idx on public.assets (organization_id, asset_type_id, status);
create index assets_current_location_idx on public.assets (current_location_id);
create index asset_components_asset_idx on public.asset_components (asset_id);
create index asset_components_product_idx on public.asset_components (product_id);
create index asset_components_component_asset_idx on public.asset_components (component_asset_id);
create index operation_types_org_idx on public.operation_types (organization_id);
create index operations_org_status_dates_idx on public.operations (organization_id, status, expected_end_at);
create index operations_customer_idx on public.operations (customer_id);
create index operations_type_idx on public.operations (operation_type_id);
create index operations_origin_location_idx on public.operations (origin_location_id);
create index operations_destination_location_idx on public.operations (destination_location_id);
create index operations_created_by_idx on public.operations (created_by);
create index operation_assets_operation_idx on public.operation_assets (operation_id);
create index operation_assets_asset_idx on public.operation_assets (asset_id);
create index operation_events_operation_time_idx on public.operation_events (operation_id, occurred_at);
create index operation_events_actor_idx on public.operation_events (actor_id);
create index document_types_org_idx on public.document_types (organization_id);
create index document_sequences_type_idx on public.document_sequences (document_type_id);
create index documents_org_status_idx on public.documents (organization_id, status, issued_at);
create index documents_operation_idx on public.documents (operation_id);
create index documents_type_idx on public.documents (document_type_id);
create index documents_created_by_idx on public.documents (created_by);
create index signatures_document_idx on public.signatures (document_id);
create index signatures_captured_by_idx on public.signatures (captured_by);
create index field_definitions_org_entity_idx on public.field_definitions (organization_id, entity_type);
create index agent_profiles_org_idx on public.agent_profiles (organization_id);
create index audit_log_org_time_idx on public.audit_log (organization_id, occurred_at desc);
create index audit_log_actor_idx on public.audit_log (actor_id);

-- JSONB indexes are limited to flexible fields expected to be queried by containment.
create index customers_custom_data_gin_idx on public.customers using gin (custom_data jsonb_path_ops);
create index products_custom_data_gin_idx on public.products using gin (custom_data jsonb_path_ops);
create index assets_custom_data_gin_idx on public.assets using gin (custom_data jsonb_path_ops);
create index operations_custom_data_gin_idx on public.operations using gin (custom_data jsonb_path_ops);

create or replace function private.is_org_member(target_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1
      from public.organization_members om
      where om.organization_id = target_organization_id
        and om.user_id = (select auth.uid())
        and om.status = 'active'
    );
$$;

create or replace function private.is_org_admin(target_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1
      from public.organization_members om
      where om.organization_id = target_organization_id
        and om.user_id = (select auth.uid())
        and om.status = 'active'
        and om.role in ('owner', 'admin')
    );
$$;

create or replace function private.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create or replace function private.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace function private.next_document_number(
  target_organization_id uuid,
  target_document_type_id uuid,
  target_series text default 'A'
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  seq_row public.document_sequences%rowtype;
begin
  if not private.is_org_member(target_organization_id) then
    raise exception 'Not authorized for organization';
  end if;

  update public.document_sequences
  set next_number = next_number + 1,
      updated_at = now()
  where organization_id = target_organization_id
    and document_type_id = target_document_type_id
    and series = target_series
  returning * into seq_row;

  if not found then
    raise exception 'Document sequence not configured';
  end if;

  return seq_row.prefix || lpad((seq_row.next_number - 1)::text, seq_row.padding, '0');
end;
$$;

revoke all on function private.is_org_member(uuid) from public, anon;
revoke all on function private.is_org_admin(uuid) from public, anon;
revoke all on function private.set_updated_at() from public, anon, authenticated;
revoke all on function private.handle_new_auth_user() from public, anon, authenticated;
revoke all on function private.next_document_number(uuid, uuid, text) from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.is_org_member(uuid) to authenticated;
grant execute on function private.is_org_admin(uuid) to authenticated;
grant execute on function private.next_document_number(uuid, uuid, text) to authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_auth_user();

-- Backfill profiles for any existing Auth users without exposing Auth through the API.
insert into public.profiles (id, display_name, avatar_url)
select
  u.id,
  coalesce(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name'),
  u.raw_user_meta_data ->> 'avatar_url'
from auth.users u
on conflict (id) do nothing;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'organizations', 'profiles', 'organization_members', 'customers', 'locations',
    'product_categories', 'products', 'asset_types', 'assets', 'asset_components',
    'operation_types', 'operations', 'operation_assets', 'operation_events',
    'document_types', 'document_sequences', 'documents', 'signatures',
    'field_definitions', 'agent_profiles'
  ]
  loop
    execute format(
      'create trigger set_updated_at before update on public.%I for each row execute function private.set_updated_at()',
      table_name
    );
  end loop;
end $$;

-- Enable RLS on every public table.
alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.organization_members enable row level security;
alter table public.customers enable row level security;
alter table public.locations enable row level security;
alter table public.product_categories enable row level security;
alter table public.products enable row level security;
alter table public.asset_types enable row level security;
alter table public.assets enable row level security;
alter table public.asset_components enable row level security;
alter table public.operation_types enable row level security;
alter table public.operations enable row level security;
alter table public.operation_assets enable row level security;
alter table public.operation_events enable row level security;
alter table public.document_types enable row level security;
alter table public.document_sequences enable row level security;
alter table public.documents enable row level security;
alter table public.signatures enable row level security;
alter table public.field_definitions enable row level security;
alter table public.agent_profiles enable row level security;
alter table public.audit_log enable row level security;

create policy organizations_select_member
on public.organizations for select to authenticated
using ((select private.is_org_member(id)));

create policy organizations_update_admin
on public.organizations for update to authenticated
using ((select private.is_org_admin(id)))
with check ((select private.is_org_admin(id)));

create policy profiles_select_self_or_colleague
on public.profiles for select to authenticated
using (
  id = (select auth.uid())
  or exists (
    select 1
    from public.organization_members mine
    join public.organization_members theirs
      on theirs.organization_id = mine.organization_id
    where mine.user_id = (select auth.uid())
      and mine.status = 'active'
      and theirs.status = 'active'
      and theirs.user_id = profiles.id
  )
);

create policy profiles_update_self
on public.profiles for update to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

create policy organization_members_select_member
on public.organization_members for select to authenticated
using ((select private.is_org_member(organization_id)));

create policy organization_members_insert_admin
on public.organization_members for insert to authenticated
with check ((select private.is_org_admin(organization_id)));

create policy organization_members_update_admin
on public.organization_members for update to authenticated
using ((select private.is_org_admin(organization_id)))
with check ((select private.is_org_admin(organization_id)));

create policy organization_members_delete_admin
on public.organization_members for delete to authenticated
using ((select private.is_org_admin(organization_id)));

-- Standard tenant policies. Events and audit logs are intentionally append-only.
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'customers', 'locations', 'product_categories', 'products', 'asset_types',
    'assets', 'asset_components', 'operation_types', 'operations', 'operation_assets',
    'document_types', 'documents', 'signatures', 'field_definitions', 'agent_profiles'
  ]
  loop
    execute format(
      'create policy %I on public.%I for select to authenticated using ((select private.is_org_member(organization_id)))',
      table_name || '_select_member',
      table_name
    );
    execute format(
      'create policy %I on public.%I for insert to authenticated with check ((select private.is_org_member(organization_id)))',
      table_name || '_insert_member',
      table_name
    );
    execute format(
      'create policy %I on public.%I for update to authenticated using ((select private.is_org_member(organization_id))) with check ((select private.is_org_member(organization_id)))',
      table_name || '_update_member',
      table_name
    );
    execute format(
      'create policy %I on public.%I for delete to authenticated using ((select private.is_org_member(organization_id)))',
      table_name || '_delete_member',
      table_name
    );
  end loop;
end $$;

create policy operation_events_select_member
on public.operation_events for select to authenticated
using ((select private.is_org_member(organization_id)));

create policy operation_events_insert_member
on public.operation_events for insert to authenticated
with check ((select private.is_org_member(organization_id)));

create policy audit_log_select_member
on public.audit_log for select to authenticated
using ((select private.is_org_member(organization_id)));

create policy audit_log_insert_member
on public.audit_log for insert to authenticated
with check (
  (select private.is_org_member(organization_id))
  and (actor_id is null or actor_id = (select auth.uid()))
);

create policy document_sequences_select_member
on public.document_sequences for select to authenticated
using ((select private.is_org_member(organization_id)));

-- No anon access. Authenticated access is still filtered by RLS.
revoke all on all tables in schema public from anon;
grant select, insert, update, delete on all tables in schema public to authenticated;
revoke update, delete on public.operation_events from authenticated;
revoke update, delete on public.audit_log from authenticated;
revoke insert, update, delete on public.document_sequences from authenticated;
grant usage, select on all sequences in schema public to authenticated;

commit;
