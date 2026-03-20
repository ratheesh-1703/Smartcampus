# SmartCampus Frontend Deployment (Netlify)

This project uses Vite + React in `frontend/`.

## 1) Prerequisite

Netlify can host only the **frontend static app**. Your PHP backend in `backend/` must be hosted separately (for example: shared hosting, VPS, Render, Railway, etc.) and exposed with HTTPS.

## 2) Netlify Site Settings

If your repository root is `SmartCampus`, these settings are already captured in `../netlify.toml`:

- **Base directory**: `frontend`
- **Build command**: `npm run build`
- **Publish directory**: `dist`
- **Node version**: `20`

## 3) Environment Variable

In Netlify dashboard, set:

- `VITE_API_URL` = `https://<your-backend-domain>/SmartCampus/backend`

Example:

- `VITE_API_URL=https://api.example.com/SmartCampus/backend`

## 4) SPA Routing

Client-side routes are handled with:

- `netlify.toml` redirect rule
- `public/_redirects`

This ensures direct visits like `/admin/dashboard` open `index.html` correctly.

## 5) Deploy

- Connect repo in Netlify
- Trigger deploy
- Open deployed URL

## 6) Verify

- Login page loads
- Browser network requests go to `VITE_API_URL`
- No requests should target `http://localhost/...` in production
