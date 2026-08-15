'use client';
/**
 * useRoomSSE — Real-time game state via SSE + aggressive polling fallback
 *
 * على Vercel Serverless، كل SSE connection يذهب لـ instance مختلف
 * لذلك notifyRoomUpdate لا يصل للطرف الآخر عبر الذاكرة.
 * الحل: SSE للاتصال الأولي + polling سريع (800ms) أثناء اللعب النشط.
 *
 * fix: deduping — نتجاهل responses بنفس updatedAt لمنع re-renders زائدة
 */

import { useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '@/store/useGameStore';

const ACTIVE_POLL_MS  = 800;   // أثناء اللعب النشط
const IDLE_POLL_MS    = 3_000; // عند الانتظار أو التحميل
const SSE_RETRY_BASE  = 2_000;
const SSE_RETRY_MAX   = 20_000;

interface StatePayload {
  room: Parameters<typeof useGameStore.getState>['length'] extends number ? NonNullable<ReturnType<typeof useGameStore.getState>['room']> : never;
  gameState: NonNullable<ReturnType<typeof useGameStore.getState>['gameState']> & { updatedAt?: string };
  messages: ReturnType<typeof useGameStore.getState>['messages'];
  onlineStatus: { player1: boolean; player2: boolean };
}

// الأفاز النشطة التي تحتاج polling سريع
const ACTIVE_PHASES = new Set([
  'spin_category','spin_question','question','reaction',
  'dont_laugh','challenge','know_me','fate_card',
]);

export function useRoomSSE(roomCode: string | null) {
  const { player, gameState, setGameState, setMessages, setOnlineStatus, setRoom } = useGameStore();

  const esRef          = useRef<EventSource | null>(null);
  const retryCountRef  = useRef(0);
  const retryTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollTimerRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef     = useRef(true);
  // deduping: آخر updatedAt استلمناه — نتجاهل أي response بنفس القيمة
  const lastUpdatedAt  = useRef<string | null>(null);
  // deduping: آخر messages count لتجنب setMessages بدون تغيير
  const lastMsgCount   = useRef<number>(0);

  // ─── applyPayload — shared between SSE and polling ──────────────────────────
  const applyPayload = useCallback((data: StatePayload) => {
    if (!mountedRef.current) return;

    // dedup gameState بمقارنة updatedAt
    const incomingUpdatedAt = data.gameState?.updatedAt ?? null;
    const gsChanged = incomingUpdatedAt
      ? incomingUpdatedAt !== lastUpdatedAt.current
      : true; // إذا لم يوجد updatedAt نطبّق دائماً (أمان)

    if (data.room) setRoom(data.room as NonNullable<ReturnType<typeof useGameStore.getState>['room']>);

    if (data.gameState && gsChanged) {
      lastUpdatedAt.current = incomingUpdatedAt;
      setGameState(data.gameState);
    }

    if (data.messages) {
      const newCount = data.messages.length;
      if (newCount !== lastMsgCount.current) {
        lastMsgCount.current = newCount;
        setMessages(data.messages);
      }
    }

    if (data.onlineStatus) setOnlineStatus(data.onlineStatus);
  }, [setRoom, setGameState, setMessages, setOnlineStatus]);

  // ─── fetch state ─────────────────────────────────────────────────────────────
  const fetchState = useCallback(async () => {
    if (!roomCode || !player) return;
    try {
      const res = await fetch(
        `/api/room/${roomCode}/state?playerId=${encodeURIComponent(player.id)}`,
        { cache: 'no-store' }
      );
      if (!res.ok) return;
      const data = await res.json() as StatePayload;
      applyPayload(data);
    } catch { /* ignore network errors */ }
  }, [roomCode, player, applyPayload]);

  // ─── adaptive polling ─────────────────────────────────────────────────────────
  const startPolling = useCallback(() => {
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    const phase    = gameState?.phase ?? '';
    const interval = ACTIVE_PHASES.has(phase) ? ACTIVE_POLL_MS : IDLE_POLL_MS;
    pollTimerRef.current = setInterval(() => { void fetchState(); }, interval);
  }, [gameState?.phase, fetchState]);

  // ─── SSE connection (best-effort — Vercel instances may differ) ──────────────
  const connect = useCallback(() => {
    if (!roomCode || !player || !mountedRef.current) return;
    if (esRef.current) { esRef.current.close(); esRef.current = null; }

    if (typeof EventSource === 'undefined') {
      void fetchState();
      startPolling();
      return;
    }

    const url = `/api/room/${roomCode}/stream?playerId=${encodeURIComponent(player.id)}`;
    const es  = new EventSource(url);
    esRef.current = es;

    es.addEventListener('state', (e: MessageEvent<string>) => {
      if (!mountedRef.current) return;
      retryCountRef.current = 0;
      try {
        const data = JSON.parse(e.data) as StatePayload;
        applyPayload(data);
      } catch { /* malformed JSON */ }
    });

    es.addEventListener('update', () => { void fetchState(); });

    es.onerror = () => {
      if (!mountedRef.current) return;
      es.close();
      esRef.current = null;
      const delay = Math.min(SSE_RETRY_BASE * Math.pow(1.8, retryCountRef.current), SSE_RETRY_MAX);
      retryCountRef.current++;
      retryTimerRef.current = setTimeout(connect, delay);
    };
  }, [roomCode, player, fetchState, startPolling, applyPayload]);

  // ─── Mount / roomCode change ──────────────────────────────────────────────────
  useEffect(() => {
    mountedRef.current = true;
    // reset dedup state on new room
    lastUpdatedAt.current = null;
    lastMsgCount.current  = 0;
    if (!roomCode) return;
    connect();
    startPolling();
    return () => {
      mountedRef.current = false;
      if (esRef.current)         { esRef.current.close(); esRef.current = null; }
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
      if (pollTimerRef.current)  clearInterval(pollTimerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomCode]);

  // ─── Re-tune polling interval when phase changes ──────────────────────────────
  useEffect(() => {
    if (!roomCode) return;
    startPolling();
  }, [gameState?.phase, roomCode, startPolling]);

  return { poll: fetchState };
}
