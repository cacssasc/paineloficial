create type public.app_role as enum ('admin', 'user');
create type public.order_status as enum ('gerado', 'pago', 'recusado');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.user_roles where user_id = _user_id and role = _role) $$;

create policy "own roles readable" on public.user_roles for select to authenticated using (user_id = auth.uid());

-- first user to sign up becomes the admin
create or replace function public.handle_first_admin()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if not exists (select 1 from public.user_roles where role = 'admin') then
    insert into public.user_roles (user_id, role) values (new.id, 'admin');
  end if;
  return new;
end $$;
create trigger on_auth_user_created_admin after insert on auth.users
for each row execute function public.handle_first_admin();

create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  brand_line text not null default '',
  condition text not null default 'Novo',
  sold_label text not null default '+100 vendidos',
  rating numeric(2,1) not null default 4.8,
  rating_count integer not null default 0,
  best_seller boolean not null default true,
  best_seller_label text not null default '',
  offer_of_day boolean not null default true,
  price numeric(10,2) not null default 0,
  old_price numeric(10,2),
  installments integer not null default 10,
  free_shipping boolean not null default true,
  stock integer not null default 50,
  seller_name text not null default 'Mercado Livre',
  seller_sales text not null default '+500 mil vendas',
  highlights text[] not null default '{}',
  description text not null default '',
  images text[] not null default '{}',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.products to anon, authenticated;
grant insert, update, delete on public.products to authenticated;
grant all on public.products to service_role;
alter table public.products enable row level security;
create policy "public reads active products" on public.products for select to anon, authenticated using (active or public.has_role(auth.uid(), 'admin'));
create policy "admin manages products" on public.products for all to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  name text not null,
  price numeric(10,2),
  image_url text,
  position integer not null default 0
);
grant select on public.product_variants to anon, authenticated;
grant insert, update, delete on public.product_variants to authenticated;
grant all on public.product_variants to service_role;
alter table public.product_variants enable row level security;
create policy "public reads variants" on public.product_variants for select to anon, authenticated using (true);
create policy "admin manages variants" on public.product_variants for all to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  author text not null default 'Cliente',
  rating integer not null default 5,
  comment text not null default '',
  images text[] not null default '{}',
  created_at timestamptz not null default now()
);
grant select on public.reviews to anon, authenticated;
grant insert, update, delete on public.reviews to authenticated;
grant all on public.reviews to service_role;
alter table public.reviews enable row level security;
create policy "public reads reviews" on public.reviews for select to anon, authenticated using (true);
create policy "admin manages reviews" on public.reviews for all to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete set null,
  product_title text not null,
  variant_name text,
  quantity integer not null default 1,
  total numeric(10,2) not null,
  status order_status not null default 'gerado',
  customer_name text not null,
  email text not null,
  phone text not null default '',
  cpf text not null default '',
  cep text not null,
  street text not null,
  number text not null,
  complement text not null default '',
  neighborhood text not null,
  city text not null,
  state text not null,
  created_at timestamptz not null default now()
);
grant select, update, delete on public.orders to authenticated;
grant all on public.orders to service_role;
alter table public.orders enable row level security;
create policy "admin reads orders" on public.orders for select to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "admin updates orders" on public.orders for update to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "admin deletes orders" on public.orders for delete to authenticated using (public.has_role(auth.uid(), 'admin'));

insert into public.products (slug, title, brand_line, sold_label, rating, rating_count, best_seller_label, price, old_price, installments, highlights, description, images)
values ('pneu-wanli-sp203-175-75r14', 'Pneu Wanli SP203 175/75R14 Aro 14 86T', 'Conferir mais produtos de Mercado Livre', '+1000 vendidos', 4.8, 1287, '1º em Pneus Aro 14', 99.90, 310, 10,
 array['Medida 175/75R14 aro 14.','Índice de carga 86 (530 kg).','Índice de velocidade T (até 190 km/h).','Ótima aderência em piso seco e molhado.','Rodagem silenciosa e confortável.'],
 'Liberte o verdadeiro potencial do seu carro com o Pneu Wanli SP203 175/75R14 Aro 14 86T. Projetado para ótima aderência e dirigibilidade tanto em baixa quanto em alta velocidade, esse pneu oferece precisão e controle.

O índice de velocidade T indica uma capacidade de velocidade máxima de até 190 km/h, enquanto o índice de carga 86 suporta até 530 kg.',
 array['/site/images/65382-pneu-wanli-sp203-17575r14-aro-14-86t-wanli-clube-da-borracha-531293_bec7b584-1571-4749-8ac4-a672f0601c4f_large.jpg']);

insert into public.reviews (product_id, author, rating, comment)
select id, 'Carlos M.', 5, 'Pneu excelente, chegou rápido e muito bem embalado. Recomendo!' from public.products where slug = 'pneu-wanli-sp203-175-75r14';
insert into public.reviews (product_id, author, rating, comment)
select id, 'Juliana R.', 5, 'Ótimo custo-benefício, rodagem silenciosa.' from public.products where slug = 'pneu-wanli-sp203-175-75r14';