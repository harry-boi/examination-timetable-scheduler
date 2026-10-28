# Project rules

1. Stack: Next.js with the App Router, JavaScript only (no TypeScript), Tailwind CSS, Supabase (Postgres and Auth). It will be deployed on Vercel.
2. Use the word Class (a department plus a level), never Group. Use the word Period only where a time range is needed.
3. Keep all text on screen in plain, simple English. Error messages must say what is wrong and how to fix it.
4. Put all conflict-checking logic in lib/conflicts.js as plain functions with no database calls, so they can be tested alone.
5. Never put secret keys in code. Read them from environment variables. Never commit .env.local.
6. The Supabase service role key must never be used in browser code.
7. Keep the design simple, clean and printable. Use one layout style across all pages.
8. After each task, tell me which files you created or changed, and how I can check that it works.
9. Do not install extra packages unless needed, and tell me why when you do.
