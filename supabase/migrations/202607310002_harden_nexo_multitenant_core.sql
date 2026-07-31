-- Applied to Nexo_test on 2026-07-31.
begin;

set local lock_timeout = '10s';
set local statement_timeout = '60s';

-- Legacy helper left behind by the discarded empty schema.
drop function if exists public.set_actualizado_en() cascade;

-- Cover foreign keys for joins, cascades and referential checks.
create index asset_components_organization_id_idx
  on public.asset_components (organization_id);

create index assets_asset_type_id_idx
  on public.assets (asset_type_id);

create index locations_customer_id_idx
  on public.locations (customer_id);

create index operation_assets_organization_id_idx
  on public.operation_assets (organization_id);

create index operation_events_organization_id_idx
  on public.operation_events (organization_id);

create index product_categories_parent_id_idx
  on public.product_categories (parent_id);

create index products_category_id_idx
  on public.products (category_id);

create index signatures_organization_id_idx
  on public.signatures (organization_id);

commit;
