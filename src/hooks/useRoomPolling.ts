'use client';
import { useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '@/store/useGameStore';

// ─── Adaptive polling: fast during active play, slow when idle ─────────────
const POLL_ACTIVE_MS   = 1000;   // during spin / question / active phase
const POLL_IDLE_MS     = 3500;   // waiting room / session_end
const IDLE_PHASES      = new Set(['waiting', 'session_end']);

export function useRoomPolling(roomCode: string | null, intervalMs = POLL_ACTIVE_MS) {
  const { player, setGameState, setMessages, setOnlineStatus, room, setRoom, gameState } = useGameStore();
  const timerRef       = useRef<ReturnType<typeof setInterval> | null>(null);
  const isFetchingRef  = useRef(false);
  const lastUpdateRef  = useRef<string>('');
  const errCountRef    = useRef(0);

  const poll = useCallback(async () => {
    if (!roomCode || !player || isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      const res = await fetch(
        `/api/room/${roomCode}/state?playerId=${encodeURIComponent(player.id)}`,
        { cache: 'no-store' }
      );
      if (!res.ok) { errCountRef.current++; return; }

      const data = await res.json() as {
        room: typeof room;
        gameState: ReturnType<typeof useGameStore.getState>['gameState'];
        messages: ReturnType<typeof useGameStore.getState>['messages'];
        onlineStatus: { player1: boolean; player2: boolean };
      };

      errCountRef.current = 0;

      // Skip re-render if nothing changed
      const tag = (data.gameState as { updatedAt?: string } | null)?.updatedAt ?? '';
      if (tag && tag === lastUpdateRef.current) return;
      lastUpdateRef.current = tag;

      if (data.room)         setRoom(data.room as NonNullable<typeof room>);
      if (data.gameState)    setGameState(data.gameState as NonNullable<ReturnType<typeof useGameStore.getState>['gameState']>);
      if (data.messages)     setMessages(data.messages as ReturnType<typeof useGameStore.getState>['messages']);
      if (data.onlineStatus) setOnlineStatus(data.onlineStatus);
    } catch {
      errCountRef.current++;
    } finally {
      isFetchingRef.current = false;
    }
  }, [roomCode, player, setGameState, setMessages, setOnlineStatus, setRoom]);

  // Recalculate interval based on current phase
  const currentPhase  = gameState?.phase ?? 'waiting';
  const effectiveMs   = IDLE_PHASES.has(currentPhase) ? POLL_IDLE_MS : (intervalMs ?? POLL_ACTIVE_MS);

  useEffect(() => {
    if (!roomCode) return;
    void poll();
    timerRef.current = setInterval(poll, effectiveMs);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [roomCode, effectiveMs, poll]);

  return { poll };
}
