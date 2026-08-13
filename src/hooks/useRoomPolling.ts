'use client';
import { useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '@/store/useGameStore';

export function useRoomPolling(roomCode: string | null, intervalMs = 1000) {
  const { player, setGameState, setMessages, setOnlineStatus, room, setRoom } = useGameStore();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isFetchingRef = useRef(false);

  const poll = useCallback(async () => {
    if (!roomCode || !player || isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      const res = await fetch(
        `/api/room/${roomCode}/state?playerId=${player.id}`,
        { cache: 'no-store' }
      );
      if (!res.ok) return;

      const data = await res.json() as {
        room: typeof room;
        gameState: ReturnType<typeof useGameStore.getState>['gameState'];
        messages: ReturnType<typeof useGameStore.getState>['messages'];
        onlineStatus: { player1: boolean; player2: boolean };
      };

      if (data.room) setRoom(data.room as NonNullable<typeof room>);
      if (data.gameState) setGameState(data.gameState as NonNullable<ReturnType<typeof useGameStore.getState>['gameState']>);
      if (data.messages) setMessages(data.messages as ReturnType<typeof useGameStore.getState>['messages']);
      if (data.onlineStatus) setOnlineStatus(data.onlineStatus);
    } catch {
      // silently ignore network errors
    } finally {
      isFetchingRef.current = false;
    }
  }, [roomCode, player, setGameState, setMessages, setOnlineStatus, setRoom, room]);

  useEffect(() => {
    if (!roomCode) return;

    // Immediate first poll
    void poll();

    timerRef.current = setInterval(poll, intervalMs);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [roomCode, intervalMs, poll]);

  return { poll };
}
