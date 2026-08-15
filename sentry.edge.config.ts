// ⚠ STABILITY STANDARD 2.4 — Sentry edge config (serverless API routes)
// Error-only capture; zero tracing/performance overhead on Vercel Serverless.
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.VERCEL_ENV ?? process.env.NEXT_RUNTIME,

  tracesSampleRate: 0,
  profilesSampleRate: 0,

  enabled: !!process.env.SENTRY_DSN,
});
