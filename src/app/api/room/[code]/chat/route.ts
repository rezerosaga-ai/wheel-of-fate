import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { rooms, chatMessages } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { notifyRoomUpdate } from '@/app/api/room/[code]/stream/route';

/**
 * retryWrap: يعيد محاولة عمليات DB عند أخطاء الشبكة المتقطعة (ECONNRESET/ECONNREFUSED/connection)
 * من Neon pooler تحت الحمل المتزامن — UX-032 + HP-BUG-06 (يفحص err.cause أيضًا عبر
 * netErrorSignature، مثل نسخة action route).
 */
function netErrorSignature(err: unknown): boolean {
  let chain: unknown = err;
  const seen = new Set<unknown>();
  const parts: string[] = [];
  while (chain && !seen.has(chain) && parts.length < 4) {
    seen.add(chain);
    parts.push((chain as Error)?.message || '');
    chain = (chain as Error)?.cause;
  }
  const blob = parts.join(' ');
  return /ECONNRESET|ECONNREFUSED|connection/i.test(blob);
}
async function retryWrap<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  let lastErr: unknown = null;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err: unknown) {
      lastErr = err;
      if (!netErrorSignature(err) || i === attempts - 1) throw err;
      await new Promise((res) => setTimeout(res, 100 * (i === 0 ? 1 : i === 1 ? 2.5 : 5)));
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
    const { playerId, playerName, content, messageType = 'text' } = await req.json() as {
      playerId: string;
      playerName: string;
      content: string;
      messageType?: string;
    };

    if (!playerId || !content?.trim()) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const MAX_CONTENT_LENGTH = 1000;
    if (content.trim().length > MAX_CONTENT_LENGTH) {
      return NextResponse.json({ error: 'Message too long' }, { status: 400 });
    }

    const [room] = await retryWrap(() =>
      db.select().from(rooms).where(eq(rooms.code, code)).limit(1)
    );
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    // Verify player belongs to room
    if (room.player1Id !== playerId && room.player2Id !== playerId) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const [msg] = await retryWrap(() =>
      db
        .insert(chatMessages)
        .values({
          roomCode: code,
          playerId,
          playerName,
          content: content.trim(),
          messageType,
        })
        .returning()
    );

    notifyRoomUpdate(code);
    return NextResponse.json({ message: msg });
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
