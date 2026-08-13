// ─── Link wofPlayerId to Google Account ──────────────────────────────────────
// POST /api/user/link { wofPlayerId }
// يربط الـ playerId المحلي بحساب Google الذي تمّ تسجيله

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { wofPlayerId } = await req.json() as { wofPlayerId: string };
  if (!wofPlayerId) {
    return NextResponse.json({ error: 'wofPlayerId required' }, { status: 400 });
  }

  await db
    .update(users)
    .set({ wofPlayerId, updatedAt: new Date() })
    .where(eq(users.email, session.user.email));

  return NextResponse.json({ ok: true });
}
