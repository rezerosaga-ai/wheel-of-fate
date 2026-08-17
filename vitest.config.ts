// إصلاح بناء Vercel 2026-08-18:
// vitest 4 يصدّر defineConfig بـ5 overloads؛ overload الأخير (ViteUserConfigExport)
// يفسّر setupFiles كخاصية vite مجهولة → TS2769 "object literal may only specify
// known properties" في بيئة Vercel. الحل: typing صريح عبر UserConfig بدلاً من
// الاعتماد على overload resolution، مع satisfies لضمان الاتساق.
import path from 'path';
import type { ViteUserConfig } from 'vitest/config';

const config: ViteUserConfig = {
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/lib/**', 'src/store/**'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
};

export default config;
