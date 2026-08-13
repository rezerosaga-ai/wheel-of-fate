// ─── SSE Stream — Real-time game state updates ────────────────────────────────
// يُرسل تحديثات الحالة فوراً بدل Polling
// الفكرة: بعد كل action → يُبث إشعار SSE لكل المستمعين في الغرفة

import { NextRequest } from 'next/server';
import { db } from '@/db';
import { rooms, gameState, chatMessages } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

// ─── In-memory room streams map ──────────────────────────────────────────────
// roomCode → Set of WritableStreamDefaultWriter (one per connected client)
type StreamWriter = ReadableStreamDefaultController<Uint8Array>;
const roomStreams = new Map<string, Set<StreamWriter>>();

export function notifyRoomUpdate(roomCode: string) {
  const writers = roomStreams.get(roomCode);
  if (!writers || writers.size === 0) return;
  const ping = new TextEncoder().encode(`event: update\ndata: ping\n\n`);
  writers.forEach((ctrl) => {
    try { ctrl.enqueue(ping); } catch { /* client disconnected */ }
  });
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const playerId = req.nextUrl.searchParams.get('playerId') ?? '';

  // Validate room exists
  const [room] = await db.select().from(rooms).where(eq(rooms.code, code)).limit(1);
  if (!room) {
    return new Response('Room not found', { status: 404 });
  }

  // ── Set up SSE stream ────────────────────────────────────────────────────────
  let controller: StreamWriter;

  const stream = new ReadableStream<Uint8Array>({
    start(ctrl) {
      controller = ctrl;

      // Register this client
      if (!roomStreams.has(code)) roomStreams.set(code, new Set());
      roomStreams.get(code)!.add(controller);

      // Send initial state immediately
      sendCurrentState(code, playerId, controller);

      // Heartbeat every 20s to keep connection alive
      const heartbeat = setInterval(() => {
        try {
          ctrl.enqueue(new TextEncoder().encode(`: heartbeat\n\n`));
        } catch {
          clearInterval(heartbeat);
        }
      }, 20_000);

      req.signal.addEventListener('abort', () => {
        clearInterval(heartbeat);
        roomStreams.get(code)?.delete(controller);
        if (roomStreams.get(code)?.size === 0) roomStreams.delete(code);
        try { ctrl.close(); } catch { /* already closed */ }
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}

// ─── Push full state payload to one client ────────────────────────────────────
async function sendCurrentState(
  code: string,
  playerId: string,
  ctrl: StreamWriter
) {
  try {
    const [room] = await db.select().from(rooms).where(eq(rooms.code, code)).limit(1);
    const [gs] = await db.select().from(gameState).where(eq(gameState.roomCode, code)).limit(1);
    const msgs = await db
      .select().from(chatMessages)
      .where(eq(chatMessages.roomCode, code))
      .orderBy(desc(chatMessages.createdAt)).limit(50);

    // Update heartbeat
    if (playerId && gs) {
      const now = new Date();
      if (playerId === room?.player1Id) {
        await db.update(gameState).set({ player1LastSeen: now }).where(eq(gameState.roomCode, code));
      } else if (playerId === room?.player2Id) {
        await db.update(gameState).set({ player2LastSeen: now }).where(eq(gameState.roomCode, code));
      }
    }

    const onlineThreshold = new Date(Date.now() - 10_000);
    const payload = {
      room,
      gameState: gs,
      messages: msgs.reverse(),
      onlineStatus: {
        player1: gs?.player1LastSeen ? new Date(gs.player1LastSeen) > onlineThreshold : false,
        player2: gs?.player2LastSeen ? new Date(gs.player2LastSeen) > onlineThreshold : false,
      },
      serverTime: Date.now(),
    };

    const data = new TextEncoder().encode(
      `event: state\ndata: ${JSON.stringify(payload)}\n\n`
    );
    ctrl.enqueue(data);
  } catch {
    /* ignore — client may have disconnected */
  }
}
