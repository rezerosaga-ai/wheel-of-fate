import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { rooms, gameState } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { processAction, type GameAction, type GameStateData } from '@/lib/game-logic';
import { notifyRoomUpdate } from '@/app/api/room/[code]/stream/route';

/**
 * retryWrap: يعيد محاولة عمليات DB عند الأخطاء المتقطعة (ECONNRESET/ECONNREFUSED/connection)
 * من Neon pooler تحت الحمل المتزامن — توسيع UX-032 إلى action route.
 * HP-BUG-01 (G-04): أُضيفت أنماط transient إضافية مكشوفة من human_playtest:
 * "too many clients" (pool exhaustion) / "terminat" / "unexpected" / "EPIPE" / "socket" —
 * أي فشل query مؤقت يُعاد عدة مرات قبل أن يتحول إلى 500 صامت للاعب.
 */
async function retryWrap<T>(fn: () => Promise<T>, attempts = 8): Promise<T> {
  let lastErr: unknown = null;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err: unknown) {
      lastErr = err;
      const msg = ((err as Error)?.message || '') + ' ' + (((err as Error)?.cause as Error)?.message || '');
      const isNet = /ECONNRESET|ECONNREFUSED|connection|too many clients|terminat|unexpected|EPIPE|socket|server closed the connection|Failed query/i.test(msg);
      if (!isNet || i === attempts - 1) {
        // تسجيل الخطأ الأصلي الكامل مع err.cause لأغراض التشخيص — HP-BUG-06
        console.error('retryWrap giving up:', msg);
        throw err;
      }
      await new Promise((res) => setTimeout(res, 300 * Math.pow(1.8, i)));
    }
  }
  throw lastErr;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const action = await req.json() as GameAction;

    const [room] = await retryWrap(() =>
      db.select().from(rooms).where(eq(rooms.code, code)).limit(1)
    );
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    const [gs] = await retryWrap(() =>
      db.select().from(gameState).where(eq(gameState.roomCode, code)).limit(1)
    );

    if (!gs) {
      return NextResponse.json({ error: 'Game state not found' }, { status: 404 });
    }

    const result = processAction(action, gs as unknown as GameStateData, {
      player1Id: room.player1Id,
      player2Id: room.player2Id,
      player1Name: room.player1Name,
      player2Name: room.player2Name,
    });

    // Explicit error (e.g. wrong turn, invalid bomb use) — surface with 400, never silent
    if (result.error) {
      return NextResponse.json(
        { success: false, error: result.error, message: result.error },
        { status: 400 }
      );
    }

    if (Object.keys(result.updates).length > 0) {
      // If phase changes to 'playing', update room status too
      if (result.updates.phase && result.updates.phase !== 'waiting') {
        await retryWrap(() =>
          db
            .update(rooms)
            .set({ status: 'playing', updatedAt: new Date() })
            .where(eq(rooms.code, code))
        );
      }

      await retryWrap(() =>
        db
          .update(gameState)
          .set({ ...result.updates, updatedAt: new Date() })
          .where(eq(gameState.roomCode, code))
      );
    }

    // Re-fetch updated state
    const [updatedGs] = await retryWrap(() =>
      db
        .select()
        .from(gameState)
        .where(eq(gameState.roomCode, code))
        .limit(1)
    );

    // Notify all SSE subscribers in this room
    notifyRoomUpdate(code);

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
