/** @type {import('next').NextConfig} */
// تنظيف 2026-08-18 (إصلاح بناء Vercel): إزالة المفاتيح غير المعترف بها في Next 16.3.1
// - eslint: أزيلت من Next.config في الإصدار 16 (استخدم next lint بدلًا منها)
// - instrumentationHook: أزيلت في 16 — وجود instrumentation-client.ts هو المعيار
// - allowedDevOrigins: مفتاح dev-only، لا يؤثر على بناء production في Vercel
const nextConfig = {
  reactStrictMode: false,
  transpilePackages: ['phaser'],
  env: {
    PROJECT_ID: process.env.HAPPYSEEDS_PROJECT_ID ?? '',
    REACTUS_BASE_URL: process.env.REACTUS_BASE_URL ?? '',
  },
};
export default nextConfig;
