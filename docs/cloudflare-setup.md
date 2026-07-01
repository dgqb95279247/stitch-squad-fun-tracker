# Cloudflare Setup

## What you need

- Wrangler 4.x
- A Cloudflare account with Workers and D1 enabled
- One Worker service
- One D1 database
- R2 is optional and only needed if you want file attachments later

## Files to update before deploy

- [`wrangler.jsonc`](/E:/code/friend/stitch_squad_fun_tracker/wrangler.jsonc)
  - replace the placeholder `database_id`, or let `bootstrap:cloudflare` update it for you
  - replace the example GitHub Pages origin in `ALLOWED_ORIGINS`
- [`assets/js/config.js`](/E:/code/friend/stitch_squad_fun_tracker/assets/js/config.js)
  - set `apiBase` to your real Worker URL

Current Worker URL:

```text
https://friendcircle-api.1922554788.workers.dev
```

## Create the Cloudflare resources

```bash
wrangler d1 create friendcircle-db
wrangler secret put SESSION_SECRET
wrangler secret put ALLOWED_ORIGINS
```

Suggested `ALLOWED_ORIGINS` value:

```text
https://dgqb95279247.github.io,http://localhost:8000,http://127.0.0.1:8000
```

## Apply the schema

```bash
wrangler d1 execute friendcircle-db --remote --file ./worker/src/db/schema.sql
```

For local development:

```bash
wrangler d1 execute friendcircle-db --local --file ./worker/src/db/schema.sql
```

## Seed the four members

[`worker/src/seed.js`](/E:/code/friend/stitch_squad_fun_tracker/worker/src/seed.js) exports:

- `defaultMembers`
- `generateSeedSql(passcodes, secret, options)`

Use it to generate SQL with hashed passcodes for the four friends, then run the resulting SQL with `wrangler d1 execute`.

There is also a helper script:

```bash
SESSION_SECRET=your-secret SEED_PASSCODES="alex=1111,sarah=2222,rahul=3333,maya=4444" npm run seed:sql > seed-members.sql
```

Then execute it:

```bash
wrangler d1 execute friendcircle-db --remote --file ./seed-members.sql
```

For local-only initialization, you can run:

```bash
SESSION_SECRET=your-secret SEED_PASSCODES="alex=1111,sarah=2222,rahul=3333,maya=4444" npm run setup:local
```

This script:

- applies `worker/src/db/schema.sql` to local D1
- generates temporary hashed seed SQL
- imports the four members into local D1

The generated SQL writes:

- `members`
- `member_credentials`

It never stores the raw passcodes in D1.

## Run locally

```bash
npm run dev:local
```

This starts:

- the static frontend on `http://127.0.0.1:8000`
- the Worker API on `http://127.0.0.1:8787`

`assets/js/config.js` already includes `localApiBase` for this flow, so you do not need to change the frontend config just for local development.

## Remote one-shot setup

If the D1 database already exists, you can apply schema, seed the four members, and push Worker secrets with:

```bash
SESSION_SECRET=your-secret ALLOWED_ORIGINS="https://dgqb95279247.github.io,http://localhost:8000,http://127.0.0.1:8000" SEED_PASSCODES="alex=1111,sarah=2222,rahul=3333,maya=4444" npm run setup:remote
```

If you later want attachment uploads, enable R2 separately:

```bash
wrangler r2 bucket create friendcircle-attachments
```

Then add the `ATTACHMENTS` R2 binding back into [`wrangler.jsonc`](/E:/code/friend/stitch_squad_fun_tracker/wrangler.jsonc).

This project will work without that step. In the current setup:

- run `wrangler d1 execute ... --remote` for the schema
- generate hashed member seed SQL and import it remotely
- run `wrangler secret put SESSION_SECRET`
- run `wrangler secret put ALLOWED_ORIGINS` when provided

If you want the script to first check `wrangler d1 info`, create the database if needed, and update the placeholder `database_id` in [`wrangler.jsonc`](/E:/code/friend/stitch_squad_fun_tracker/wrangler.jsonc), use:

```bash
SESSION_SECRET=your-secret ALLOWED_ORIGINS="https://dgqb95279247.github.io,http://localhost:8000,http://127.0.0.1:8000" SEED_PASSCODES="alex=1111,sarah=2222,rahul=3333,maya=4444" npm run bootstrap:cloudflare -- --update-config
```

## Production checklist

- `SESSION_SECRET` is set
- `ALLOWED_ORIGINS` includes your real GitHub Pages origin
- `wrangler.jsonc` has the real D1 `database_id`
- `assets/js/config.js` points to the real Worker URL
- D1 schema has been applied
- The four member passcodes have been seeded
- If you have not enabled R2 yet, attachment upload will stay disabled, but records and comments still work
