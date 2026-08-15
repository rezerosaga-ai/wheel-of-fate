import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { rooms, gameState } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { processAction, type GameAction, type GameStateData } from '@/lib/game-logic';
import { notifyRoomUpdate } from '@/app/api/room/[code]/stream/route';

// ── إرسال push notification للاعب الذي أصبح دوره ──────────────────────────────
async function notifyTurn(
  newPlayerIdx: number,
  prevPlayerIdx: number,
  room: { player1Id: string | null; player2Id: string | null; player1Name: string | null; player2Name: string | null },
  baseUrl: string
) {
  if (newPlayerIdx === prevPlayerIdx) return; // لم يتغير الدور
  const targetId   = newPlayerIdx === 0 ? room.player1Id   : room.player2Id;
  const targetName = newPlayerIdx === 0 ? room.player1Name : room.player2Name;
  if (!targetId) return;
  try {
    await fetch(`${baseUrl}/api/push/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        playerId: targetId,
        payload: {
          title: '🎡 دورك الآن!',
          body:  `${targetName ?? 'اللاعب'} — أدِر العجلة وأجب عن السؤال`,
          icon:  '/icon-192.png',
          data:  { type: 'your_turn' },
        },
      }),
    });
  } catch { /* ignore — push is best-effort */ }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const action = await req.json() as GameAction;

    const [room] = await db.select().from(rooms).where(eq(rooms.code, code)).limit(1);
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    const [gs] = await db
      .select()
      .from(gameState)
      .where(eq(gameState.roomCode, code))
      .limit(1);

    if (!gs) {
      return NextResponse.json({ error: 'Game state not found' }, { status: 404 });
    }

    const prevPlayerIdx = gs.currentPlayerIdx as number;

    const result = processAction(action, gs as unknown as GameStateData, {
      player1Id: room.player1Id,
      player2Id: room.player2Id,
      player1Name: room.player1Name,
      player2Name: room.player2Name,
    });

    if (Object.keys(result.updates).length > 0) {
      // If phase changes to 'playing', update room status too
      if (result.updates.phase && result.updates.phase !== 'waiting') {
        await db
          .update(rooms)
          .set({ status: 'playing', updatedAt: new Date() })
          .where(eq(rooms.code, code));
      }

      await db
        .update(gameState)
        .set({ ...result.updates, updatedAt: new Date() })
        .where(eq(gameState.roomCode, code));
    }

    // Re-fetch updated state
    const [updatedGs] = await db
      .select()
      .from(gameState)
      .where(eq(gameState.roomCode, code))
      .limit(1);

    // Notify all SSE subscribers in this room
    notifyRoomUpdate(code);

    // Push notification عند تغيير الدور
    if (
      updatedGs &&
      typeof updatedGs.currentPlayerIdx === 'number' &&
      updatedGs.currentPlayerIdx !== prevPlayerIdx &&
      updatedGs.phase === 'spin_category'
    ) {
      const baseUrl = req.nextUrl.origin;
      void notifyTurn(updatedGs.currentPlayerIdx, prevPlayerIdx, room, baseUrl);
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      gameState: updatedGs,
    });
  } catch (error) {
    console.error('Action error:', error);
    return NextResponse.json({ error: 'Failed to process action' }, { status: 500 });
  }
}
