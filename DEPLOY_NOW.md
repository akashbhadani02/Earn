# Aducate English — Direct Vercel Deployment

## 1. Upload to GitHub
Create a new GitHub repository and upload the **contents of this folder** (not the outer ZIP folder).

## 2. Import into Vercel
In Vercel: **Add New → Project → Import Git Repository**.

No custom Build Command is required. The included `vercel.json` uses `server.js` as the Node function.

Recommended settings:
- Framework Preset: Other
- Build Command: leave empty
- Output Directory: leave empty
- Install Command: `npm install`
- Node.js: 22.x

## 3. Environment Variables
Add these in Vercel → Project → Settings → Environment Variables:

- `MONGODB_URI` = your MongoDB Atlas connection string
- `JWT_SECRET` = a long random secret

Add them for **Production, Preview, and Development** as needed.

## 4. MongoDB Atlas
In Atlas → Network Access, allow the deployment environment to reach the cluster. For a simple first deployment, you can use `0.0.0.0/0`, but restrict access further when you have a fixed egress/IP strategy.

## 5. Deploy
Click **Deploy**. After deployment, test:
- `/api/health`
- `/login.html`
- `/admin-login.html`

Expected `/api/health` response contains `status: "ok"`.

## Important
Do not put `MONGODB_URI` or `JWT_SECRET` inside frontend HTML/JS files or commit `.env`.
