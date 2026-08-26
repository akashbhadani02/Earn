# NPM startup

Extract this ZIP so that `package.json` and `server.js` are directly inside `D:\APP\Earn`.

PowerShell:

```powershell
cd D:\APP\Earn
npm install
npm start
```

The server listens on `http://localhost:3000` unless `PORT` is set.

Health check: `http://localhost:3000/api/health`

Do not run npm from the `public` or `mobile` folders.
