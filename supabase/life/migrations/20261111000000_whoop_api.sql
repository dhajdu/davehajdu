-- Whoop moves from a CSV export to the Whoop API (src/lib/life/whoop.ts):
-- OAuth tokens in `integrations` (provider 'whoop'), synced every six hours by
-- /api/life/cron/whoop. A daily cadence lets Sources flag it when it goes stale.
update public.sources set method = 'Whoop API', cadence = 'daily' where slug = 'whoop';
comment on table public.integrations is 'OAuth refresh tokens per provider (google_photos, whoop). Read and written only with the secret key.';
