// ⚠ STABILITY STANDARD 2.4 — Sentry client config
// Error-only capture to protect the free-tier quota (5K events/mo):
// no session replays, no tracing. Errors surface with full stack trace + user journey.
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN ?? process.env.SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? "development",

  // Budget safety: capture errors only, nothing else.
  tracesSampleRate: 0,
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,
  profilesSampleRate: 0,

  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN || !!process.env.SENTRY_DSN,

  // Privacy: scrub personal data from captured payloads (Sentry default scrubbers run on top).
  beforeSend(event) {
    if (event.request?.url) {
      try {
        const u = new URL(event.request.url);
        u.search = ""; // strip any query-string params
        event.request.url = u.toString();
      } catch {
        // leave url untouched if unparseable
      }
    }
    return event;
  },
});
