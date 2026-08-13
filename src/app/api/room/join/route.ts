import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { rooms, gameState } from '@/db/schema';
import { eq } from 'drizzle-orm';

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
    const [room] = await db.select().from(rooms).where(eq(rooms.code, upperCode)).limit(1);

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
    const [updatedRoom] = await db
      .update(rooms)
      .set({
        player2Id: playerId,
        player2Name: playerName,
        status: 'playing',        // ← room is now active
        updatedAt: new Date(),
      })
      .where(eq(rooms.code, upperCode))
      .returning();

    // Transition game state from waiting → spin_start automatically
    // so both players see the initial spin screen immediately
    await db
      .update(gameState)
      .set({
        phase: 'spin_start',
        updatedAt: new Date(),
      })
      .where(eq(gameState.roomCode, upperCode));

    // Return the fresh game state too so client can skip one polling cycle
    const [gs] = await db
      .select()
      .from(gameState)
      .where(eq(gameState.roomCode, upperCode))
      .limit(1);

    return NextResponse.json({ room: updatedRoom, playerId, role: 'player2', gameState: gs });
  } catch (error) {
    console.error('Join room error:', error);
    return NextResponse.json({ error: 'Failed to join room' }, { status: 500 });
  }
}
