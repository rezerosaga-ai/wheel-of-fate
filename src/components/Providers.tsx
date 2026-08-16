'use client';
// FIX: Server components (app/layout.tsx and the builtin error pages that
// render it) must NOT let SessionProvider fetch the session client-side —
// prerendering those pages fails with "Cannot read properties of null
// (reading 'useState')" inside next-auth's client runtime.
// Passing the pre-fetched `session` prop keeps the provider client-only
// without any async client fetch during static rendering.
import React from 'react';
import { SessionProvider } from 'next-auth/react';
import type { Session } from 'next-auth';

export default function Providers({
  children,
  session,
}: {
  children: React.ReactNode;
  session: Session | null;
}) {
  return <SessionProvider session={session}>{children}</SessionProvider>;
}
