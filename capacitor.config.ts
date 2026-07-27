import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.podologa.fabricia',
  appName: 'Podologia Fabrícia',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#0B4C33',
      androidScaleType: 'CENTER_CROP',
    },
  },
};

export default config;
