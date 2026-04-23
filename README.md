# Rajasthan Pickleball Association Site

## Run locally

1. Copy `.env.example` to `.env`
2. Fill in:
   `AIRTABLE_BASE_ID`
   `AIRTABLE_PAT`
   `ADMIN_USERNAME`
   `ADMIN_PASSWORD`
   `SESSION_SECRET`
3. Start the site:

```bash
npm run dev
```

The site runs at `http://localhost:3000`.

If Airtable is not configured yet, the app now falls back to a local JSON store at `data/dev-store.json` so the site, signup flow, and admin dashboard still work during development.

## Public site

Main pages:

- `index.html`
- `about.html`
- `tournaments.html`
- `state-team.html`
- `news.html`
- `contact.html`

Shared frontend files:

- `site.js`
- `styles.css`

The public header now uses:

- `Login`
- `Sign Up`

Only an authenticated admin session can open and use the dashboard.

## Auth flow

- `auth.html` contains the shared login and signup UI
- `admin.html` is a protected dashboard
- regular users can create accounts
- only the admin credentials from `.env` can edit content

## Airtable

Recommended tables are now formalized in `lib/airtable-schema.js`:

- `SitePages`
- `Tournaments`
- `StateTeam`
- `News`
- `Partners`
- `Users`

To create missing tables in Airtable:

```bash
npm run setup:airtable
```

This uses the Airtable metadata API and only creates tables that do not already exist.

To seed the base with the finished placeholder content used by the site:

```bash
npm run seed:airtable
```

The Airtable token needs access to the selected base plus the scopes required for schema creation and record writes.

## Content management

The dashboard can manage:

- page content payloads
- tournaments
- team records
- news items
- partners
- user accounts

All editable site content is designed to come from Airtable when credentials are configured. During local development, the same structures can be stored in `data/dev-store.json`.

## Important security note

Keep the Airtable PAT on the server only.
Do not place the Airtable token in frontend files or commit it into the repo.
