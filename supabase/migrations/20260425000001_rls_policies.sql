-- Enable RLS and grant full access to authenticated users on all tables.
-- Run this against the existing database (tables already created by 20260425000000).

alter table customers        enable row level security;
alter table products         enable row level security;
alter table orders           enable row level security;
alter table order_line_items enable row level security;
alter table invoices         enable row level security;
alter table prospects        enable row level security;

create policy "authenticated_full_access" on customers
  for all to authenticated using (true) with check (true);

create policy "authenticated_full_access" on products
  for all to authenticated using (true) with check (true);

create policy "authenticated_full_access" on orders
  for all to authenticated using (true) with check (true);

create policy "authenticated_full_access" on order_line_items
  for all to authenticated using (true) with check (true);

create policy "authenticated_full_access" on invoices
  for all to authenticated using (true) with check (true);

create policy "authenticated_full_access" on prospects
  for all to authenticated using (true) with check (true);
