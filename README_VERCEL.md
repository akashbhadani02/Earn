# Aducate English — GitHub + Vercel Ready

## Local
```powershell
npm install
npm start
```
Open http://localhost:3000

## Vercel
1. Import this project into GitHub.
2. Import the GitHub repository into Vercel.
3. No Build Command is required.
4. Add these Environment Variables in Vercel:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `VAPID_PUBLIC_KEY` (optional unless push notifications are used)
   - `VAPID_PRIVATE_KEY` (optional unless push notifications are used)
   - `VAPID_SUBJECT` (optional; e.g. `mailto:admin@example.com`)
5. Deploy.
6. Test `https://YOUR-DOMAIN/api/health`.

Do not commit `.env`. `.env.example` is provided only as a template.

## Important
- The project intentionally does not include `node_modules`.
- The old broken/partial package-lock was removed. Run `npm install` locally to generate a fresh lock file.
- Vercel uses `api/index.js` as the serverless entry point.
- Express serves the `public` folder and all `/api/*` routes.
- MongoDB connections are cached for serverless reuse.
