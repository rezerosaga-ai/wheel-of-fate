// ⚠ STABILITY STANDARD 2.4 — Sentry client-side registration
// Required alongside `instrumentationHook: true` in next.config.mjs.
// Without this file, Next.js prerendering of the builtin global-error page
// can fail with "Cannot read properties of null (reading 'useContext')".
// Sentry client registration — follows the official Next.js instrumentation
// pattern: init only happens inside `register()` when the client runtime
// actually loads, never during static module evaluation / prerendering.
import * as Sentry from "@sentry/nextjs";

export function register() {
  if (typeof window === "undefined") return; // client-only
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN && !process.env.SENTRY_DSN) return;

  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN ?? process.env.SENTRY_DSN,
    environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? "development",
    tracesSampleRate: 0,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
  });
}
