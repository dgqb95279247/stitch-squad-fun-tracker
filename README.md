# FriendCircle

A lightweight multi-page website for four friends to share activity records, comments, scoreboards, and optional private attachments.

The frontend is static and can be hosted on GitHub Pages. Shared data is handled by a Cloudflare Worker backed by D1, with R2 available later if you want to enable file attachments.

## Pages

- `index.html`: home feed
- `stats.html`: rankings and summary
- `record.html`: create a new activity
- `detail.html`: view one activity, comments, and optional attachments

## Local preview

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Deploy the static site to GitHub Pages

1. Push the project to GitHub.
2. Keep the default branch name as `main`, or update [deploy-pages.yml](/E:/code/friend/stitch_squad_fun_tracker/.github/workflows/deploy-pages.yml) if you use another branch.
3. In GitHub, open `Settings -> Pages`.
4. Under `Source`, choose `GitHub Actions`.
5. Push again or run the `Deploy GitHub Pages` workflow manually.

The workflow will build a `dist/` folder from the static files and publish it automatically.

## Connect the frontend to your Cloudflare Worker

Edit [`assets/js/config.js`](/E:/code/friend/stitch_squad_fun_tracker/assets/js/config.js) and set:

```js
window.FRIENDCIRCLE_CONFIG = {
  apiBase: 'https://your-worker-name.your-subdomain.workers.dev'
};
```

If you leave `apiBase` empty, the frontend will call relative `/api/...` paths instead.

Current deployed Worker URL:

```text
https://friendcircle-api.1922554788.workers.dev
```

Current intended GitHub Pages origin:

```text
https://dgqb95279247.github.io
```

## Cloudflare backend

- Worker config: [`wrangler.jsonc`](/E:/code/friend/stitch_squad_fun_tracker/wrangler.jsonc)
- Worker source: [`worker/src`](/E:/code/friend/stitch_squad_fun_tracker/worker/src)
- Setup guide: [`docs/cloudflare-setup.md`](/E:/code/friend/stitch_squad_fun_tracker/docs/cloudflare-setup.md)

Typical local backend commands:

```bash
wrangler d1 create friendcircle-db
wrangler dev
```

## Seed the four member passcodes

The member list is fixed in [`worker/src/seed.js`](/E:/code/friend/stitch_squad_fun_tracker/worker/src/seed.js).

That file now exports `generateSeedSql(passcodes, secret)` so you can generate insert SQL for the four private passcodes and then execute it against D1.

You can also generate the SQL directly from the command line:

```bash
SESSION_SECRET=your-secret SEED_PASSCODES="alex=1111,sarah=2222,rahul=3333,maya=4444" npm run seed:sql
```

For local D1 setup in one go:

```bash
SESSION_SECRET=your-secret SEED_PASSCODES="alex=1111,sarah=2222,rahul=3333,maya=4444" npm run setup:local
```

## Local development

Static site only:

```bash
npm run dev:site
```

GitHub Pages build preview:

```bash
npm run build:pages
```

Static site + local Worker:

```bash
npm run dev:local
```

## Remote Cloudflare setup

If your Cloudflare resources already exist, you can push schema, seed data, and Worker secrets with:

```bash
SESSION_SECRET=your-secret ALLOWED_ORIGINS="https://dgqb95279247.github.io,http://localhost:8000,http://127.0.0.1:8000" SEED_PASSCODES="alex=1111,sarah=2222,rahul=3333,maya=4444" npm run setup:remote
```

If you later want to enable attachment uploads too, first add the `ATTACHMENTS` R2 binding back into [`wrangler.jsonc`](/E:/code/friend/stitch_squad_fun_tracker/wrangler.jsonc), then create the bucket:

```bash
wrangler r2 bucket create friendcircle-attachments
```

If you want the project to automatically fetch or create the D1 database and write the real `database_id` back into [`wrangler.jsonc`](/E:/code/friend/stitch_squad_fun_tracker/wrangler.jsonc), run:

```bash
SESSION_SECRET=your-secret ALLOWED_ORIGINS="https://dgqb95279247.github.io,http://localhost:8000,http://127.0.0.1:8000" SEED_PASSCODES="alex=1111,sarah=2222,rahul=3333,maya=4444" npm run bootstrap:cloudflare -- --update-config
```

## Notes

- The site is still static on the frontend side.
- Shared persistence currently needs only a Cloudflare Worker and one D1 database.
- Attachments can be added later with R2, but comments, records, and shared memory already work without it.
