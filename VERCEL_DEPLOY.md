# Cup & Co Operations - Vercel Deployment Guide

This project is configured as a Progressive Web App (PWA) that can be installed on iPad/iPhone via "Add to Home Screen".

## Quick Deploy to Vercel

### Option 1: Vercel CLI (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy from project root
cd D:\All_Project\CupandCo
vercel --prod
```

### Option 2: GitHub Integration

1. Push this repository to GitHub
2. Go to [Vercel Dashboard](https://vercel.com/dashboard)
3. Click "Add New..." → "Project"
4. Import your GitHub repository
5. Vercel will auto-detect the configuration from `vercel.json`
6. Click "Deploy"

## Configuration Files

| File | Purpose |
|------|---------|
| `vercel.json` | Vercel deployment config (build command, output dir, headers, rewrites) |
| `app.json` | Expo config with PWA manifest settings |
| `public/manifest.json` | Web App Manifest for PWA installation |
| `public/sw.js` | Service Worker for offline support |
| `public/icon-*.png` | PWA icons (72, 96, 128, 144, 152, 192, 384, 512) |
| `public/apple-touch-icon.png` | iOS home screen icon |
| `public/favicon.ico` | Browser favicon |

## PWA Features Enabled

✅ **Installable** - "Add to Home Screen" on iPad/iPhone/Android  
✅ **Standalone display** - No browser UI when launched from home screen  
✅ **Offline support** - Service Worker caches assets and pages  
✅ **App shortcuts** - Quick actions for Menu, Orders, Cashier, Barista  
✅ **Theme color** - Branded status bar (#C5A059)  
✅ **Splash screen** - Branded launch screen on iOS  

## Local Testing

```bash
# Build for web
npm run export:web

# Preview locally (requires serve or similar)
npx serve dist
```

Then open `http://localhost:3000` in browser and test "Add to Home Screen".

## iPad/iPhone Installation

1. Open the deployed URL in **Safari**
2. Tap the **Share** button (square with arrow up)
3. Scroll down and tap **"Add to Home Screen"**
4. Tap **"Add"** - the app will appear on your home screen
5. Launch from home screen - runs in standalone mode (no Safari UI)

## Environment Variables (Production — required)

Login is email + password only. Set these in Vercel Project Settings → Environment Variables,
then redeploy. Without them the login screen shows "Server not connected" and no demo bypass exists.

```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Do NOT set `EXPO_PUBLIC_ENABLE_DEMO_LOGIN` in production. It is local-dev only
(`true` re-enables the role picker, and only when Supabase is NOT configured).

## Production setup: Supabase + staff accounts

1. Create a Supabase project, then run `supabase/schema.sql` once in the SQL Editor.
2. In Supabase Auth → Users, create one login per staff member (email + password).
   Each new user gets a `public.users` row with `role = NULL` (no access yet).
3. Assign roles (owner first):
   ```sql
   UPDATE public.users SET role = 'OWNER' WHERE id = '<auth-user-uuid>';
   UPDATE public.users SET role = 'BARISTA' WHERE id = '<auth-user-uuid>';
   -- Roles: BARISTA | CASHIER | MANAGER | OWNER
   ```
4. Staff sign in with email + password. The app reads `public.users.role` and routes:
   BARISTA → `/barista`, CASHIER → `/cashier`, MANAGER/OWNER → `/analytics`.
   Users with `role = NULL` see "awaiting a role assignment" and cannot enter.

## Build Command

The build command in `vercel.json`:
```json
"buildCommand": "npm run export:web",
"outputDirectory": "dist"
```

This runs `expo export --platform web` which generates static files in `dist/`.

## SPA Routing

The `vercel.json` includes rewrites for SPA routing:
```json
"rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
```

This ensures deep links (e.g., `/menu`, `/cashier`) work correctly when accessed directly or after page refresh.

## Cache Headers

Static assets (JS, CSS, images, icons) are cached for 1 year with `immutable`.
Service worker (`sw.js`) uses `must-revalidate` for instant updates.
Manifest uses long-term caching.

## Troubleshooting

### "Add to Home Screen" not showing
- Ensure HTTPS (required for PWA)
- Check manifest.json loads: `https://your-app.vercel.app/manifest.json`
- Check service worker registers: DevTools → Application → Service Workers
- Clear browser cache and retry

### Supabase connection issues
- Verify environment variables in Vercel dashboard
- Check Supabase project allows the Vercel deployment URL

### Build fails
- Run `npm run export:web` locally first to verify
- Check Node.js version (Vercel uses 18.x or 20.x by default)

## Updating the App

After deploying updates:
1. Users will see the new version on next visit (service worker updates)
2. For instant updates, the SW checks for updates every hour
3. Users can also refresh the PWA to get latest version

---

**Need help?** Check Vercel docs: https://vercel.com/docs/frameworks/expo