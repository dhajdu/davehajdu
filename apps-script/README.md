# /life Gmail sweep (Apps Script)

`life-gmail.gs` runs inside dhajdu@gmail.com. Every hour it finds travel emails from the last two days, POSTs them to `/api/life/ingest`, and labels each thread `life/ingested` once the server accepts it. A one-time backfill walks the same query month by month from January 2006, pausing every 5 minutes and resuming on the next 10-minute trigger until it reaches today, then removes its own trigger.

## Setup

1. Make sure `LIFE_GMAIL_INGEST_SECRET` is set in Vercel for the `davehajdu` project (Production) and deployed. Copy its value. (`/api/life/ingest` accepts it alongside `LIFE_INGEST_SECRET`.)
2. Signed in as dhajdu@gmail.com, open https://script.google.com, click **New project**, name it `life-gmail`, and replace the contents of `Code.gs` with `apps-script/life-gmail.gs`. Save.
3. Open **Project Settings** (gear icon) → **Script Properties** → add `LIFE_INGEST_SECRET` (the property name the script reads) with the value from step 1. Optionally add `LIFE_URL` (defaults to `https://www.davehajdu.com/api/life/ingest`; use a preview URL to test first).
4. In the editor, choose `sweep` from the function menu and click **Run**. Approve the Gmail and external-request permissions when asked. Check the execution log: it should print `sweep sent N message(s)` with no 401.
5. Choose `setup` and click **Run**. This creates the `life/ingested` label, the hourly `sweep` trigger, and the 10-minute `backfill` trigger. Confirm both under **Triggers** (clock icon).
6. Watch progress: the backfill cursor is in Script Properties as `LIFE_BACKFILL_CURSOR` (`{"month":"2014-06","offset":0}`, then `done`). New items show up on the /life Sources page, and anything uncertain lands in the /life Inbox.

To re-run the backfill, delete `LIFE_BACKFILL_CURSOR` and run `setup` again. Re-sending is safe: the server ignores messages it has already processed.
