# Rajasthan Pickleball Association Site

Static landing site for Rajasthan Pickleball Association. The public pages now load their content directly from `data/default-content.js`, so no Supabase project, API routes, or environment variables are required.

## Run locally

```bash
npm run dev
```

The site runs at `http://localhost:3000`.

You can also open `index.html` directly in a browser because the site is static.

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

- `data/default-content.js` for local page, tournament, team, news, partner, and gallery data
- `script.js` for the home page
- `site.js` for inner pages
- `auth.js` for browser-only local account/session behavior
- `styles.css`
