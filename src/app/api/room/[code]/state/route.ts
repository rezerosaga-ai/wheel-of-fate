import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { rooms, gameState, chatMessages } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

/**
 * retryWrap: يعيد محاولة عمليات DB عند أخطاء الشبكة المتقطعة (ECONNRESET/ECONNREFUSED)
 * من Neon pooler تحت الحمل المتزامن — إصلاح UX-032.
 */
async function retryWrap<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  let lastErr: unknown = null;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err: unknown) {
      lastErr = err;
      const msg = (err as Error)?.message || '';
      const isNet = /ECONNRESET|ECONNREFUSED|connection/i.test(msg);
      if (!isNet || i === attempts - 1) throw err;
      // backoff متدرج: 100 → 250 → 500ms
      await new Promise((res) => setTimeout(res, 100 * (i === 0 ? 1 : i === 1 ? 2.5 : 5)));
    }
  }
  throw lastErr;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const since = req.nextUrl.searchParams.get('since');
    const playerId = req.nextUrl.searchParams.get('playerId');

    const [room] = await retryWrap(() =>
      db.select().from(rooms).where(eq(rooms.code, code)).limit(1)
    );
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    const [gs] = await retryWrap(() =>
      db.select().from(gameState).where(eq(gameState.roomCode, code)).limit(1)
    );

    // Get recent chat messages
    const msgs = await retryWrap(() =>
      db
        .select()
        .from(chatMessages)
        .where(eq(chatMessages.roomCode, code))
        .orderBy(desc(chatMessages.createdAt))
        .limit(50)
    );

    // Update heartbeat
    if (playerId) {
      const now = new Date();
      if (gs) {
        if (playerId === room.player1Id) {
          await retryWrap(() =>
            db
              .update(gameState)
              .set({ player1LastSeen: now })
              .where(eq(gameState.roomCode, code))
          );
        } else if (playerId === room.player2Id) {
          await retryWrap(() =>
            db
              .update(gameState)
              .set({ player2LastSeen: now })
              .where(eq(gameState.roomCode, code))
          );
        }
      }
    }

    // Check online status (within last 10 seconds)
    const onlineThreshold = new Date(Date.now() - 10000);
    const player1Online = gs?.player1LastSeen
      ? new Date(gs.player1LastSeen) > onlineThreshold
      : false;
    const player2Online = gs?.player2LastSeen
      ? new Date(gs.player2LastSeen) > onlineThreshold
      : false;

    return NextResponse.json({
      room,
      gameState: gs,
      messages: msgs.reverse(),
      onlineStatus: {
        player1: player1Online,
        player2: player2Online,
      },
      serverTime: Date.now(),
    });
  } catch (error) {
    console.error('State error:', error);
    return NextResponse.json({ error: 'Failed to get state' }, { status: 500 });
  }
}
