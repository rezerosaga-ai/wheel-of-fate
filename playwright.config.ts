import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './src/tests/automation',
  fullyParallel: false,     // اختبارات الحالة المشتركة تحتاج تسلسل
  timeout: 30000,
  retries: 1,
  workers: 2,

  use: {
    baseURL: 'http://localhost:13000',
    locale: 'ar-SA',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    // تُحاكي جهاز موبايل عربي
    geolocation: { latitude: 24.7, longitude: 46.7 }, // الرياض
  },

  projects: [
    {
      name: 'Mobile Chrome (Android)',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari (iPhone)',
      use: { ...devices['iPhone 12'] },
    },
    {
      name: 'Desktop Chrome',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // لا نُشغّل الخادم هنا — يفترض أنه يعمل مسبقاً
  // webServer: { command: 'pnpm dev', url: 'http://localhost:13000' },
});
