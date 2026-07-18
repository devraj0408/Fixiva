# Deployment Guide

## 1. Prepare environment variables
Create a production environment file from the example:

```bash
cp .env.example .env
```

Fill in your real values:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_ADMIN_EMAILS`
- `VITE_RESEND_API_KEY` (optional)

## 2. Build for production

```bash
npm install
npm run build
```

The build output will be generated in the `dist` folder.

## 3. Host requirements
Your hosting provider must support:

- SPA routing fallback to `index.html`
- Static file serving from the `dist` folder

This repository already includes a `public/_redirects` file for SPA fallback on Netlify-style hosts.
If your host is Vercel, Netlify, Cloudflare Pages, or another static host, make sure rewrites are enabled for client-side routing.

## 4. GitHub push checklist
Before pushing:

- ensure `.env` is not committed (it is ignored by git)
- keep `.env.example` committed as the template
- verify the app builds locally with `npm run build`

## 5. Domain readiness
Once your domain is connected to the hosting provider:

- point the domain to the static site deployment
- confirm that the provider serves the `dist` build output
- verify that routes like `/dashboard/admin` and `/fixora-admin` resolve correctly

## 6. Post-deploy checks
After deployment, verify:

- the homepage loads
- login works
- admin login route `/fixora-admin` works
- protected admin route `/dashboard/admin` works
- service creation and dashboard flows render without a blank page
