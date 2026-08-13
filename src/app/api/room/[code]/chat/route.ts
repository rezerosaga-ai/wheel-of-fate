import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { rooms, chatMessages } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { notifyRoomUpdate } from '@/app/api/room/[code]/stream/route';

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

    const [room] = await db.select().from(rooms).where(eq(rooms.code, code)).limit(1);
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    // Verify player belongs to room
    if (room.player1Id !== playerId && room.player2Id !== playerId) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const [msg] = await db
      .insert(chatMessages)
      .values({
        roomCode: code,
        playerId,
        playerName,
        content: content.trim(),
        messageType,
      })
      .returning();

    notifyRoomUpdate(code);
    return NextResponse.json({ message: msg });
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
