-- Run this alone in Supabase SQL Editor if RPCs exist in Postgres but the app says
-- they are "not in the schema cache". Wait ~30 seconds, then retry the app.

notify pgrst, 'reload schema';
