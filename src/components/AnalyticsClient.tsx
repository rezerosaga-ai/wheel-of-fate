'use client';
// Wrapper to render Vercel Analytics client-only.
// Fixes: "Cannot read properties of null (reading 'useState')" during static
// prerendering of builtin error pages when <Analytics /> lives in a server layout.
import { Analytics } from '@vercel/analytics/next';

export default function AnalyticsClient() {
  return <Analytics />;
}
