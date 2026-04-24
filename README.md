# Rajasthan Pickleball Association Site

## Run locally

1. Copy `.env.example` to `.env`
2. Fill in:
   `SUPABASE_URL`
   `SUPABASE_SERVICE_ROLE_KEY`
   `SESSION_SECRET`
3. Start the site:

```bash
npm run dev
```

The site runs at `http://localhost:3000`.

If Supabase is not configured yet, the app falls back to `data/dev-store.json` so the public site and auth flow still work during development.

## Supabase

Run `scripts/supabase-schema.sql` in the Supabase SQL editor to create:

- `tournaments`
- `gallery_events`
- `gallery_images`
- `users`

Public pages are now kept in code/default content. Supabase is used for the things that need to be added over time:

- tournaments, including detail pages at `tournaments.html?id=...`
- gallery events at `news.html`
- gallery images per event at `news.html?id=...`
- user accounts for login/signup

Use a service role key only on the server. Do not place it in frontend files or commit real credentials.

## Public site

Main pages:

- `index.html`
- `about.html`
- `tournaments.html`
- `membership.html`
- `districts.html`
- `state-team.html`
- `news.html`
- `contact.html`

Shared frontend files:

- `script.js` for the home page
- `site.js` for inner pages
- `styles.css`
