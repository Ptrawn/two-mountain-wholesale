-- Two Mountain Winery Wholesale CRM — initial schema

create extension if not exists "pgcrypto";

-- ─── customers ───────────────────────────────────────────────────────────────

create table customers (
  id                    uuid primary key default gen_random_uuid(),
  store_name            text        not null,
  address               text,
  city                  text,
  state                 text,
  zip                   text,
  liquor_license_number text,
  phone                 text,
  email                 text,
  contact_name          text,
  account_type          text        not null check (account_type in ('on_premise', 'off_premise')),
  active                boolean     not null default true,
  created_at            timestamptz not null default now()
);

create index customers_account_type_idx on customers (account_type);
create index customers_active_idx       on customers (active);

alter table customers enable row level security;
create policy "authenticated_full_access" on customers
  for all to authenticated using (true) with check (true);

-- ─── products ────────────────────────────────────────────────────────────────

create table products (
  id           uuid primary key default gen_random_uuid(),
  name         text        not null,
  vintage      integer     check (vintage between 1900 and 2100),
  volume_ml    integer     check (volume_ml > 0),
  abv_category text        not null check (abv_category in ('over_14', 'under_14')),
  active       boolean     not null default true,
  created_at   timestamptz not null default now()
);

create index products_active_idx on products (active);

alter table products enable row level security;
create policy "authenticated_full_access" on products
  for all to authenticated using (true) with check (true);

-- ─── orders ──────────────────────────────────────────────────────────────────

create table orders (
  id          uuid primary key default gen_random_uuid(),
  customer_id uuid        not null references customers (id),
  order_date  date        not null,
  status      text        not null default 'pending'
                check (status in ('pending', 'confirmed', 'delivered', 'cancelled')),
  notes       text,
  created_at  timestamptz not null default now()
);

create index orders_customer_id_idx on orders (customer_id);
create index orders_order_date_idx  on orders (order_date);
create index orders_status_idx      on orders (status);

alter table orders enable row level security;
create policy "authenticated_full_access" on orders
  for all to authenticated using (true) with check (true);

-- ─── order_line_items ────────────────────────────────────────────────────────

create table order_line_items (
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid           not null references orders   (id),
  product_id uuid           not null references products (id),
  quantity   integer        not null check (quantity > 0),
  unit_price numeric(10, 2) not null check (unit_price >= 0),
  created_at timestamptz    not null default now()
);

create index order_line_items_order_id_idx   on order_line_items (order_id);
create index order_line_items_product_id_idx on order_line_items (product_id);

alter table order_line_items enable row level security;
create policy "authenticated_full_access" on order_line_items
  for all to authenticated using (true) with check (true);

-- ─── invoices ────────────────────────────────────────────────────────────────

create table invoices (
  id             uuid primary key default gen_random_uuid(),
  order_id       uuid        not null references orders (id),
  invoice_number text        not null unique,
  invoice_date   date        not null,
  attachment_url text,
  created_at     timestamptz not null default now()
);

create index invoices_order_id_idx on invoices (order_id);

alter table invoices enable row level security;
create policy "authenticated_full_access" on invoices
  for all to authenticated using (true) with check (true);

-- ─── prospects ───────────────────────────────────────────────────────────────

create table prospects (
  id                    uuid primary key default gen_random_uuid(),
  store_name            text        not null,
  address               text,
  city                  text,
  state                 text,
  zip                   text,
  liquor_license_number text,
  license_type          text        not null check (license_type in ('on_premise', 'off_premise')),
  phone                 text,
  converted_to_customer boolean     not null default false,
  created_at            timestamptz not null default now()
);

create index prospects_license_type_idx          on prospects (license_type);
create index prospects_converted_to_customer_idx on prospects (converted_to_customer);

alter table prospects enable row level security;
create policy "authenticated_full_access" on prospects
  for all to authenticated using (true) with check (true);
