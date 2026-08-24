# Aducate Earn Hybrid Mobile App

This folder prepares the existing web app for a Capacitor Android/iOS wrapper.

## Setup

1. Replace the `server.url` in `capacitor.config.ts` with the deployed HTTPS URL of the existing app.
2. From this folder run `npm install`.
3. Run `npm run cap:add:android` and/or `npm run cap:add:ios` once.
4. Run `npm run cap:sync`.
5. Open the generated native project in Android Studio/Xcode and build/sign the app.

## Important launcher-icon limitation

Android and iOS do not expose a standard web/native API that lets a running app replace its installed launcher icon from a server without an app/package update. The app can instantly update its in-app branding, favicon/web icon and splash/branding assets, but an already-installed Home Screen/launcher icon can only be changed through a native app update (or device/launcher-specific mechanisms).

Therefore this wrapper does not pretend to provide a fake "force launcher icon" feature. Admin logo changes are still propagated to the web/in-app UI immediately; the launcher icon should be treated as an app-release asset.
