# Earn App - Fixed Build

## Included fixes
- Fixed MongoDB `activeActivityStartedAt` invalid `{}` Date casting error.
- Legacy corrupted activity date values are sanitized during login/startup.
- Student presence heartbeat runs every 1 second while the active tab is visible.
- Admin users list refreshes live and shows 🟢 ONLINE / 🔴 OFFLINE.
- Online is determined from `lastSeen` within 3 seconds of the latest heartbeat.
- All existing Admin and Student panel button handlers are retained.
- Admin Command Center actions are wired to the existing `/api/admin/pro/*` routes.

## Run
1. Set your MongoDB/JWT/VAPID environment variables.
2. `npm install`
3. `npm start` (or `node server.js`)
