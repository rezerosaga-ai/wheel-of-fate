import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { rooms, gameState } from '@/db/schema';
import { generateRoomCode } from '@/lib/game-logic';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  try {
    const { playerId, playerName } = await req.json() as {
      playerId: string;
      playerName: string;
    };

    if (!playerId || !playerName) {
      return NextResponse.json({ error: 'Missing playerId or playerName' }, { status: 400 });
    }

    // Generate unique code (single select — collision probability negligible
    // across ~60M possible codes, and avoids pooler connection churn)
    let code = generateRoomCode();
    const existing = await db.select({ id: rooms.id }).from(rooms).where(eq(rooms.code, code)).limit(1);
    if (existing.length > 0) {
      code = generateRoomCode();
    }

    // Create room
    const [room] = await db
      .insert(rooms)
      .values({
        code,
        player1Id: playerId,
        player1Name: playerName,
        status: 'waiting',
      })
      .returning();

    // Create initial game state
    await db.insert(gameState).values({
      roomCode: code,
      phase: 'waiting',
    });

    return NextResponse.json({ room, code });
  } catch (error) {
    console.error('Create room error:', error);
    return NextResponse.json({ error: 'Failed to create room' }, { status: 500 });
  }
}
