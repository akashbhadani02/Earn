# Aducate Admin + Student native-app build notes

The website already supports separate Admin and Student PWAs. The login pages expose Android and Windows install options.

## Android APK
The repository includes a Capacitor starter under `mobile/`. A signed APK requires an Android SDK/Gradle environment and the deployed website URL. Set `mobile/capacitor.config.ts` accordingly, then run:

- `npm install`
- `npx cap add android`
- `npx cap sync android`
- `npx cap open android`

For two distinct Android apps, use separate application IDs, e.g. `com.aducate.student` and `com.aducate.admin`.

## Windows EXE
A native Windows `.exe` requires a Windows/Electron or WebView2 build environment. The web app itself can be installed as a Windows PWA directly from Chrome/Edge using the Windows Install App option.

No fake `.apk` or `.exe` files are included; a binary must be produced by the corresponding native build toolchain.
