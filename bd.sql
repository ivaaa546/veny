-- 1. TIPOS Y ENUMS
create type app_role as enum ('seller', 'admin', 'moderator');

-- 2. TABLA: PROFILES (Extensión de usuarios)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  role app_role default 'seller',
  created_at timestamptz default now()
);

-- 3. TABLA: STORES
create table public.stores (
  id uuid not null default gen_random_uuid() primary key,
  user_id uuid references auth.users not null unique,
  slug text not null unique,
  name text not null,
  phone text not null,
  primary_color text default '#000000',
  logo_url text,
  created_at timestamptz default now(),
  constraint valid_slug check (slug ~* '^[a-z0-9-]+$')
);

-- 4. TABLA: CATEGORIES
create table public.categories (
  id uuid not null default gen_random_uuid() primary key,
  store_id uuid references public.stores(id) on delete cascade not null,
  name text not null,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- 5. TABLA: PRODUCTS
create table public.products (
  id uuid not null default gen_random_uuid() primary key,
  store_id uuid references public.stores(id) on delete cascade not null,
  category_id uuid references public.categories(id) on delete set null,
  title text not null,
  description text,
  price numeric(10,2) not null check (price >= 0),
  image_url text,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- 6. ÍNDICES (Optimización)
create index idx_stores_slug on public.stores(slug);
create index idx_products_store_id on public.products(store_id);
create index idx_categories_store_id on public.categories(store_id);

-- 7. AUTOMATIZACIÓN (Trigger para crear perfil al registrarse)
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'seller');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 8. FUNCIÓN HELPER (Para seguridad)
create or replace function is_admin_or_mod()
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid() 
    and role in ('admin', 'moderator')
  );
end;
$$ language plpgsql security definer;

-- 9. SEGURIDAD RLS (Row Level Security)
alter table public.profiles enable row level security;
alter table public.stores enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;

-- Políticas PROFILES
create policy "Perfiles públicos" on public.profiles for select using (true);
create policy "Editar propio perfil" on public.profiles for update using (auth.uid() = id);

-- Políticas STORES
create policy "Ver tiendas" on public.stores for select using (true);
create policy "Gestionar mi tienda" on public.stores for all using (auth.uid() = user_id OR is_admin_or_mod());

-- Políticas CATEGORIES
create policy "Ver categorías" on public.categories for select using (true);
create policy "Gestionar categorías" on public.categories for all using (
  auth.uid() in (select user_id from public.stores where id = categories.store_id) OR is_admin_or_mod()
);

-- Políticas PRODUCTS
-- Permitir que cualquiera vea productos activos (para tiendas públicas)
create policy "Ver productos activos" on public.products 
for select 
using (is_active = true);

-- Permitir que usuarios vean todos sus productos (activos e inactivos)
create policy "Ver mis productos" on public.products 
for select 
to authenticated
using (
  auth.uid() in (select user_id from public.stores where id = products.store_id)
);

-- Permitir que usuarios inserten productos en sus propias tiendas
create policy "Insertar mis productos" on public.products 
for insert 
to authenticated
with check (
  auth.uid() in (select user_id from public.stores where id = products.store_id)
);

-- Permitir que usuarios actualicen sus propios productos
create policy "Actualizar mis productos" on public.products 
for update 
to authenticated
using (
  auth.uid() in (select user_id from public.stores where id = products.store_id)
)
with check (
  auth.uid() in (select user_id from public.stores where id = products.store_id)
);

-- Permitir que usuarios eliminen sus propios productos
create policy "Eliminar mis productos" on public.products 
for delete 
to authenticated
using (
  auth.uid() in (select user_id from public.stores where id = products.store_id)
);

-- Permitir que admins/moderadores gestionen todos los productos
create policy "Admins gestionan productos" on public.products 
for all 
to authenticated
using (is_admin_or_mod())
with check (is_admin_or_mod());