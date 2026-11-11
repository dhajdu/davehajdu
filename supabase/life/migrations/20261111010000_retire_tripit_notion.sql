-- The TripIt iCal feed and the Notion sync were one-time imports; their crons
-- and code are removed. The rows stay (their source_items are the provenance
-- of imported trips and journal entries) but are disabled, and Sources lists
-- enabled sources only.
update public.sources set enabled = false, cadence = 'on demand' where slug in ('tripit', 'notion');
