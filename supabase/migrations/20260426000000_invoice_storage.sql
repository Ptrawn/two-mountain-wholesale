-- Create invoice-attachments storage bucket
insert into storage.buckets (id, name, public)
values ('invoice-attachments', 'invoice-attachments', true)
on conflict do nothing;

-- Allow authenticated users to manage invoice attachments
create policy "authenticated can upload invoice attachments"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'invoice-attachments');

create policy "authenticated can read invoice attachments"
  on storage.objects for select to authenticated
  using (bucket_id = 'invoice-attachments');

create policy "authenticated can update invoice attachments"
  on storage.objects for update to authenticated
  using (bucket_id = 'invoice-attachments');

create policy "authenticated can delete invoice attachments"
  on storage.objects for delete to authenticated
  using (bucket_id = 'invoice-attachments');
