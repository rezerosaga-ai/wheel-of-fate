import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { rooms, gameState } from '@/db/schema';
import { generateRoomCode } from '@/lib/game-logic';
import { eq } from 'drizzle-orm';

/**
 * HP-BUG-06 FIX (G-04 امتداد): إعادة محاولة الأخطاء المتقطعة (Neon pool exhaustion /
 * ECONNRESET/... ) تحت الحمل المتزامن — كان إنشاء الغرف يفشل بصمت 500 في
 * حملة التحميل المتزامنة (test:load).
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
    const { playerId, playerName } = await req.json() as {
      playerId: string;
      playerName: string;
    };

    if (!playerId || !playerName) {
      return NextResponse.json({ error: 'Missing playerId or playerName' }, { status: 400 });
    }

    // Generate unique code
    let code = generateRoomCode();
    let attempts = 0;
    while (attempts < 10) {
      const existing = await retryWrap(() =>
        db.select().from(rooms).where(eq(rooms.code, code)).limit(1)
      );
      if (existing.length === 0) break;
      code = generateRoomCode();
      attempts++;
    }

    // Create room
    const [room] = await retryWrap(() =>
      db.insert(rooms)
      .values({
        code,
        player1Id: playerId,
        player1Name: playerName,
        status: 'waiting',
      })
      .returning()
    );

    // Create initial game state
    await retryWrap(() =>
      db.insert(gameState).values({
        roomCode: code,
        phase: 'waiting',
      })
    );

    return NextResponse.json({ room, code });
  } catch (error) {
    console.error('Create room error:', error);
    return NextResponse.json({ error: 'Failed to create room' }, { status: 500 });
  }
}
