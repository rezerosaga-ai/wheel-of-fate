import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { questionReports } from '@/db/schema';

export async function POST(req: NextRequest) {
  try {
    const { questionId, reason, playerId, roomCode } = await req.json() as {
      questionId: number;
      reason: string;
      playerId?: string;
      roomCode?: string;
    };

    if (!questionId || !reason) {
      return NextResponse.json({ error: 'questionId and reason required' }, { status: 400 });
    }

    await db.insert(questionReports).values({
      questionId,
      reason: reason.slice(0, 200),
      playerId: playerId ?? 'unknown',
      roomCode: roomCode ?? null,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Report error:', error);
    return NextResponse.json({ error: 'Failed to save report' }, { status: 500 });
  }
}
