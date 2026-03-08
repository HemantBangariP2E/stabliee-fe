# Hosting / Deployment Guide

This is a Vite + React SPA. Build output is in `dist/`. Use one of the options below.

---

## Option 1: Vercel (recommended, free)

1. Push your code to **GitHub**, **GitLab**, or **Bitbucket**.
2. Go to [vercel.com](https://vercel.com) and sign in.
3. Click **Add New** → **Project** and import your repo.
4. Vercel will detect Vite; keep:
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. Add **Environment Variables** if needed (e.g. `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` — use the same names as in your `.env`).
6. Click **Deploy**.

**CLI alternative:**

```bash
npm i -g vercel
vercel login
vercel
```

---

## Option 2: Netlify

1. Push your code to a Git provider.
2. Go to [netlify.com](https://netlify.com) → **Add new site** → **Import an existing project**.
3. Connect the repo; set:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
4. Add env vars in **Site settings** → **Environment variables** (e.g. `VITE_SUPABASE_URL`).
5. Deploy.

**CLI:**

```bash
npm i -g netlify-cli
netlify login
netlify deploy --prod --dir=dist
```

The repo includes `public/_redirects` so client-side routing works.

---

## Option 3: Static hosting (AWS S3, GitHub Pages, etc.)

1. Build locally:
   ```bash
   npm run build
   ```
2. Upload the contents of the **`dist/`** folder to your host.
3. Configure the server so **all routes** serve `index.html` (SPA fallback). Examples:
   - **GitHub Pages:** use a 404.html that mirrors index.html, or a custom action that copies index.html to 404.html.
   - **S3 + CloudFront:** set error document to `index.html` and use a custom error rule to return 200 for 404s.

---

## Environment variables

If you use Supabase or other services via `import.meta.env.VITE_*`, define the same variables in your hosting dashboard (e.g. **Vercel** → Project → Settings → Environment Variables). Use the **VITE_** prefix so Vite embeds them at build time.

---

## After deployment

- Your app will be available at the URL provided by the host (e.g. `https://your-project.vercel.app`).
- For a custom domain, use the host’s **Domain** or **Custom domain** settings and follow their DNS instructions.

---

## Troubleshooting 404 on Vercel

1. **Check build**: In Vercel → your project → **Deployments** → latest → **Building**: ensure the build succeeds and that `npm run build` runs and produces a `dist` folder.
2. **Output directory**: In **Settings** → **General** → **Build & Development Settings**, set **Output Directory** to `dist` (or leave blank if `vercel.json` sets it).
3. **Root directory**: If this app lives in a subfolder of the repo (e.g. `stabliee-fe`), set **Root Directory** to that folder in **Settings** → **General**.
4. **Redeploy**: After changing `vercel.json` or settings, trigger a new deployment (**Deployments** → **Redeploy**).
