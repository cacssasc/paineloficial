create table public.catalogs (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
grant select on public.catalogs to anon, authenticated;
grant insert, update, delete on public.catalogs to authenticated;
grant all on public.catalogs to service_role;
alter table public.catalogs enable row level security;
create policy "public reads active catalogs" on public.catalogs for select to anon, authenticated using (active or public.has_role(auth.uid(), 'admin'));
create policy "admin manages catalogs" on public.catalogs for all to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

create table public.catalog_products (
  catalog_id uuid not null references public.catalogs(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  position integer not null default 0,
  primary key (catalog_id, product_id)
);
grant select on public.catalog_products to anon, authenticated;
grant insert, update, delete on public.catalog_products to authenticated;
grant all on public.catalog_products to service_role;
alter table public.catalog_products enable row level security;
create policy "public reads catalog products" on public.catalog_products for select to anon, authenticated using (true);
create policy "admin manages catalog products" on public.catalog_products for all to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));