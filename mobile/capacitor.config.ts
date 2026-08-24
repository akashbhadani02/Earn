import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.aducate.earn',
  appName: 'Aducate English App',
  webDir: '../public',
  server: {
    url: 'https://YOUR-VERCEL-OR-RENDER-DOMAIN.example.com',
    cleartext: false
  }
};

export default config;
