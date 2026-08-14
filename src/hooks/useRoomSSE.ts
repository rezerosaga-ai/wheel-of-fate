'use client';
/**
 * useRoomSSE — Real-time game state via Server-Sent Events
 * يستبدل useRoomPolling تماماً.
 *
 * الفكرة:
 * - يفتح اتصال SSE واحد مستمر مع /api/room/[code]/stream
 * - كل action/chat من أي لاعب → يُبث event → يُحدَّث الـ store فوراً
 * - Fallback تلقائي: إذا انقطع الاتصال → يعيد الاتصال مع backoff
 * - إذا لا يدعم المتصفح SSE → يسقط على Polling بطيء (5s)
 */

import { useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '@/store/useGameStore';

const SSE_RETRY_BASE_MS = 1_500;
const SSE_RETRY_MAX_MS  = 15_000;
const POLL_FALLBACK_MS  = 2_000;   // fallback إذا EventSource غير مدعوم

interface StatePayload {
  room: Parameters<typeof useGameStore.getState>['length'] extends number ? NonNullable<ReturnType<typeof useGameStore.getState>['room']> : never;
  gameState: NonNullable<ReturnType<typeof useGameStore.getState>['gameState']>;
  messages: ReturnType<typeof useGameStore.getState>['messages'];
  onlineStatus: { player1: boolean; player2: boolean };
}

export function useRoomSSE(roomCode: string | null) {
  const { player, setGameState, setMessages, setOnlineStatus, setRoom } = useGameStore();

  const esRef         = useRef<EventSource | null>(null);
  const retryCountRef = useRef(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollTimerRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef    = useRef(true);

  // ─── manual fetch for fallback & forced refresh ─────────────────────────────
  const fetchState = useCallback(async () => {
    if (!roomCode || !player) return;
    try {
      const res = await fetch(
        `/api/room/${roomCode}/state?playerId=${encodeURIComponent(player.id)}`,
        { cache: 'no-store' }
      );
      if (!res.ok) return;
      const data = await res.json() as StatePayload;
      if (!mountedRef.current) return;
      if (data.room)         setRoom(data.room as NonNullable<ReturnType<typeof useGameStore.getState>['room']>);
      if (data.gameState)    setGameState(data.gameState);
      if (data.messages)     setMessages(data.messages);
      if (data.onlineStatus) setOnlineStatus(data.onlineStatus);
    } catch { /* ignore */ }
  }, [roomCode, player, setRoom, setGameState, setMessages, setOnlineStatus]);

  // ─── connect SSE ─────────────────────────────────────────────────────────────
  const connect = useCallback(() => {
    if (!roomCode || !player || !mountedRef.current) return;

    // Clean up existing connection
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }

    // Fallback to polling if EventSource not supported
    if (typeof EventSource === 'undefined') {
      void fetchState();
      pollTimerRef.current = setInterval(fetchState, POLL_FALLBACK_MS);
      return;
    }

    const url = `/api/room/${roomCode}/stream?playerId=${encodeURIComponent(player.id)}`;
    const es = new EventSource(url);
    esRef.current = es;

    es.addEventListener('state', (e: MessageEvent<string>) => {
      if (!mountedRef.current) return;
      retryCountRef.current = 0; // reset backoff on success
      try {
        const data = JSON.parse(e.data) as StatePayload;
        if (data.room)         setRoom(data.room as NonNullable<ReturnType<typeof useGameStore.getState>['room']>);
        if (data.gameState)    setGameState(data.gameState);
        if (data.messages)     setMessages(data.messages);
        if (data.onlineStatus) setOnlineStatus(data.onlineStatus);
      } catch { /* malformed JSON */ }
    });

    es.addEventListener('update', () => {
      // Server signals a change — fetch full state
      void fetchState();
    });

    es.onerror = () => {
      if (!mountedRef.current) return;
      es.close();
      esRef.current = null;

      // Exponential backoff reconnect
      const delay = Math.min(
        SSE_RETRY_BASE_MS * Math.pow(1.8, retryCountRef.current),
        SSE_RETRY_MAX_MS
      );
      retryCountRef.current++;
      retryTimerRef.current = setTimeout(connect, delay);
    };
  }, [roomCode, player, fetchState, setRoom, setGameState, setMessages, setOnlineStatus]);

  useEffect(() => {
    mountedRef.current = true;
    if (!roomCode) return;

    connect();

    return () => {
      mountedRef.current = false;
      if (esRef.current) { esRef.current.close(); esRef.current = null; }
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
      if (pollTimerRef.current)  clearInterval(pollTimerRef.current);
    };
  }, [roomCode, connect]);

  // Expose manual poll for cases where we need an immediate update after action
  return { poll: fetchState };
}
