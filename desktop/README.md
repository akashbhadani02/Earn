# Aducate.exe — Windows build-ready package

This folder builds a Windows application named **Aducate.exe** using Electron + electron-builder.

## 1. Requirements on Windows
- Node.js 22 LTS (or a compatible current Node.js)
- Internet access for the first `npm install`
- Your deployed Aducate HTTPS URL

## 2. Configure the URL
Open `config.js` and replace:

`https://YOUR-ADUCATE-DOMAIN.example.com/`

with the real deployed Aducate URL.

You can also use an environment variable:

`set ADUCATE_URL=https://your-domain.example.com/`

## 3. Build Aducate.exe
Open PowerShell in this `desktop` folder and run:

```powershell
npm install
npm run dist
```

The installer and portable executable will be generated in `desktop/dist/`.

Expected files include:
- `Aducate-1.0.0-x64.exe` — Windows installer
- `Aducate-1.0.0-x64.exe` (portable target is also generated; use the artifact shown by electron-builder)

## 4. Signing / SmartScreen
A Windows code-signing certificate is required if you want Windows SmartScreen to show your publisher as trusted. The build is intentionally **unsigned** by default so the owner can sign it with their own certificate.

After obtaining a certificate, configure electron-builder signing (`CSC_LINK` / `CSC_KEY_PASSWORD`) and rebuild. Do not disable Windows security warnings or distribute a modified unsigned binary as if it were trusted.

## 5. App name and executable
The Windows application name and executable name are both configured as:

**Aducate** → `Aducate.exe`

## 6. Website alerts
JavaScript `alert()` dialogs belong to the web application. This wrapper does not silently suppress application alerts because doing so can hide important errors or security messages. Fix any unwanted alert at its source in the web app.
