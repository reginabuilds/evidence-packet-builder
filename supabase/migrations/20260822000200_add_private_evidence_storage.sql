-- Private evidence bucket. Objects are written only with server-issued, short-lived
-- signed upload URLs; there are deliberately no direct client storage policies.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'demo-evidence',
  'demo-evidence',
  false,
  10485760,
  array['application/pdf', 'image/jpeg', 'image/png', 'text/plain']
)
on conflict (id) do update
set public = false,
    file_size_limit = 10485760,
    allowed_mime_types = array['application/pdf', 'image/jpeg', 'image/png', 'text/plain'];
