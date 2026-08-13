// ─── User Stats API ──────────────────────────────────────────────────────────
// GET  /api/user/stats?playerId=xxx  → إرجاع الإحصاءات
// POST /api/user/stats               → تسجيل جلسة جديدة + تحديث الإحصاءات

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { playerStats } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const playerId = req.nextUrl.searchParams.get('playerId');
  if (!playerId) {
    return NextResponse.json({ error: 'playerId required' }, { status: 400 });
  }

  const [stats] = await db
    .select()
    .from(playerStats)
    .where(eq(playerStats.playerId, playerId))
    .limit(1);

  return NextResponse.json({ stats: stats ?? null });
}

export async function POST(req: NextRequest) {
  const { playerId, lovePoints } = await req.json() as {
    playerId: string;
    lovePoints: number;
  };

  if (!playerId) {
    return NextResponse.json({ error: 'playerId required' }, { status: 400 });
  }

  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86_400_000).toDateString();

  const [existing] = await db
    .select()
    .from(playerStats)
    .where(eq(playerStats.playerId, playerId))
    .limit(1);

  let newStreak = 1;
  let longestStreak = 1;
  const newTotalSessions = (existing?.totalSessions ?? 0) + 1;
  const newTotalLovePoints = (existing?.totalLovePoints ?? 0) + (lovePoints ?? 0);

  if (existing) {
    if (existing.lastPlayedDate === today) {
      newStreak = existing.currentStreak;
    } else if (existing.lastPlayedDate === yesterday) {
      newStreak = existing.currentStreak + 1;
    } else {
      newStreak = 1;
    }
    longestStreak = Math.max(existing.longestStreak, newStreak);
  }

  // Check for new achievements
  const currentAchievements = (existing?.achievements ?? []) as string[];
  const earned: string[] = [];
  if (newTotalSessions === 1)  earned.push('first_session');
  if (newTotalSessions === 5)  earned.push('five_sessions');
  if (newTotalSessions === 10) earned.push('ten_sessions');
  if (newStreak === 3)         earned.push('streak_3');
  if (newStreak === 7)         earned.push('streak_7');
  if (newTotalLovePoints >= 50)  earned.push('love_50');
  if (newTotalLovePoints >= 100) earned.push('love_100');

  const newAchievements = [
    ...currentAchievements,
    ...earned.filter((a) => !currentAchievements.includes(a)),
  ];

  const values = {
    playerId,
    totalSessions: newTotalSessions,
    currentStreak: newStreak,
    longestStreak,
    lastPlayedDate: today,
    totalLovePoints: newTotalLovePoints,
    achievements: newAchievements,
    updatedAt: new Date(),
  };

  if (!existing) {
    await db.insert(playerStats).values({ ...values, createdAt: new Date() });
  } else {
    await db.update(playerStats).set(values).where(eq(playerStats.playerId, playerId));
  }

  const [updated] = await db
    .select()
    .from(playerStats)
    .where(eq(playerStats.playerId, playerId))
    .limit(1);

  return NextResponse.json({ stats: updated, newAchievements: earned });
}
