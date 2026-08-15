// ⚠ STABILITY STANDARD 2.4 — client-side Sentry registration hook (Next.js >= 15)
import "./sentry.client.config";
import * as Sentry from "@sentry/nextjs";

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
