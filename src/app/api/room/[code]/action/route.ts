import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { rooms, gameState } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { processAction, type GameAction, type GameStateData } from '@/lib/game-logic';

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

    const result = processAction(action, gs as GameStateData, {
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
