import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { gameState, rooms } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { notifyRoomUpdate } from '../stream/route';

/**
 * QA-only endpoint: allows the automated harness to force a room's state
 * into the `conflict` phase for E2 verification.
 * BLOCKED in production to keep the integrity of real games.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'disabled in production' }, { status: 403 });
  }
  try {
    const { code } = await params;
    const [room] = await db.select().from(rooms).where(eq(rooms.code, code)).limit(1);
    if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    const body = (await req.json()) as Partial<Record<string, unknown>>;
    const allowed = new Set([
      'phase', 'currentPlayerIdx', 'conflictCount', 'conflictDialogueCount',
      'conflictAgreed', 'conflictReplyText', 'conflictTopics', 'currentQuestionId',
      'currentCategory',
    ]);
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    for (const [k, v] of Object.entries(body)) {
      if (allowed.has(k)) updates[k] = v;
    }
    await db.update(gameState).set(updates).where(eq(gameState.roomCode, code));
    notifyRoomUpdate(code);
    const [updated] = await db.select().from(gameState).where(eq(gameState.roomCode, code)).limit(1);
    return NextResponse.json({
      success: true,
      gameState: updated,
      room: room
        ? { player1Id: room.player1Id, player2Id: room.player2Id, player1Name: room.player1Name, player2Name: room.player2Name }
        : null,
    });
  } catch (error) {
    console.error('debug-state error:', error);
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}
