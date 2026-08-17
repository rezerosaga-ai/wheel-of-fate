import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { rooms, gameState } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * HP-BUG-06 FIX (G-04 امتداد): إعادة محاولة الأخطاء المتقطعة (Neon pool exhaustion /
 * ECONNRESET/... ) تحت الحمل المتزامن — الانضمام كان يفشل 500 أثناء حملة التحميل.
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

export async function POST(req: NextRequest) {
  try {
    const { code, playerId, playerName } = await req.json() as {
      code: string;
      playerId: string;
      playerName: string;
    };

    if (!code || !playerId || !playerName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const upperCode = code.trim().toUpperCase();
    const [room] = await retryWrap(() =>
      db.select().from(rooms).where(eq(rooms.code, upperCode)).limit(1)
    );

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    // If already player1 (rejoining)
    if (room.player1Id === playerId) {
      return NextResponse.json({ room, playerId, role: 'player1' });
    }

    // If already player2 (rejoining)
    if (room.player2Id === playerId) {
      return NextResponse.json({ room, playerId, role: 'player2' });
    }

    if (room.player2Id && room.player2Id !== playerId) {
      return NextResponse.json({ error: 'Room is full' }, { status: 409 });
    }

    // Join as player2
    const [updatedRoom] = await retryWrap(() =>
      db.update(rooms)
      .set({
        player2Id: playerId,
        player2Name: playerName,
        status: 'playing',        // ← room is now active
        updatedAt: new Date(),
      })
      .where(eq(rooms.code, upperCode))
      .returning()
    );

    // Transition game state from waiting → spin_start automatically
    // so both players see the initial spin screen immediately
    await retryWrap(() =>
      db.update(gameState)
      .set({
        phase: 'spin_start',
        updatedAt: new Date(),
      })
      .where(eq(gameState.roomCode, upperCode))
    );

    // Return the fresh game state too so client can skip one polling cycle
    const [gs] = await retryWrap(() =>
      db
        .select()
        .from(gameState)
        .where(eq(gameState.roomCode, upperCode))
        .limit(1)
    );

    return NextResponse.json({ room: updatedRoom, playerId, role: 'player2', gameState: gs });
  } catch (error) {
    console.error('Join room error:', error);
    return NextResponse.json({ error: 'Failed to join room' }, { status: 500 });
  }
}
