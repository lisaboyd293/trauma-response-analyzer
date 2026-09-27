# GitHub + Vercel deployment

## Local verification

```bash
pnpm check
pnpm test
pnpm build
```

## Vercel

Vercel uses the root `index.ts` Express entry point and `vercel.json`. The Vercel build runs `pnpm run build:vercel`, which builds the Vite client and copies the resulting app shell into the root `public/` directory.

Configure these variables in Vercel for **Preview** and **Production** as appropriate:

- `DATABASE_URL`
- `JWT_SECRET`
- `VITE_APP_ID`
- `OAUTH_SERVER_URL`
- `OWNER_OPEN_ID`
- `BUILT_IN_FORGE_API_URL`
- `BUILT_IN_FORGE_API_KEY`

Do not commit `.env` files or secret values. After the first Vercel deployment, update the OAuth application's allowed callback URL to:

```text
https://<your-vercel-domain>/api/oauth/callback
```

The analyzer's `/api/trpc` requests and OAuth callback are handled by the Express function. Static assets and the PWA service worker are served from Vercel's `public/` directory.
