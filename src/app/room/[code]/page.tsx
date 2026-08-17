'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useGameStore } from '@/store/useGameStore';
import WaitingRoom from '@/components/screens/WaitingRoom';
import GameRoom from '@/components/screens/GameRoom';

const GAME_PHASES = new Set([
  'spin_start', 'spin_category', 'spin_question',
  'question', 'reaction', 'round_end',
  'fate_card', 'know_me', 'dont_laugh', 'session_end', 'conflict', 'challenge',
]);

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const code = (params?.code as string ?? '').toUpperCase();
  const { player, room, gameState } = useGameStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // UX-028 fix: zustand persist hydrates async — `player` starts null on a cold
  // load of /room/{code}. Redirecting immediately ejects the player to '/' before
  // hydration finishes. Check localStorage directly (synchronous, reliable): a
  // persisted identity means a returning player — never eject them. Only eject
  // fresh visitors (no persisted identity) after a grace period.
  const GRACE_MS = 5000;
  useEffect(() => {
    if (!mounted) return;
    if (player?.id) return; // hydrated identity already present — stay on the room page
    let timer: ReturnType<typeof setTimeout> | null = null;
    const seen = { replaced: false, cancelled: false };
    const safeRedirect = () => {
      if (seen.replaced || seen.cancelled) return;
      seen.replaced = true;
      router.replace('/');
    };
    // Synchronous identity check: a persisted player object means stay put.
    const hasPersistedIdentity = () => {
      try {
        const raw = localStorage.getItem('wof-player');
        if (!raw) return false;
        const parsed = JSON.parse(raw);
        return Boolean(parsed?.state?.player?.id || parsed?.player?.id);
      } catch {
        return false;
      }
    };
    if (hasPersistedIdentity()) {
      seen.cancelled = true;
      return; // returning player — hydration will surface the identity shortly
    }
    // Active watch in case hydration lands during the grace period.
    const interval = setInterval(() => {
      const st = useGameStore.getState();
      if (st.player?.id || hasPersistedIdentity()) {
        seen.cancelled = true;
        clearInterval(interval);
      }
    }, 200);
    // Fresh visitor with no identity: redirect after grace.
    timer = setTimeout(() => {
      const st = useGameStore.getState();
      if (!st.player?.id && !hasPersistedIdentity()) safeRedirect();
    }, GRACE_MS);
    return () => {
      clearInterval(interval);
      if (timer) clearTimeout(timer);
    };
  }, [mounted, player, router]);

  if (!mounted) {
    return (
      <div style={{
        height: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: 'var(--wof-bg)',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎡</div>
          <span className="wof-loading-dots"><span /><span /><span /></span>
        </div>
      </div>
    );
  }

  if (!player?.id) return null;

  const phase = gameState?.phase;

  // Show game if phase is an active game phase
  if (phase && GAME_PHASES.has(phase)) {
    return <GameRoom roomCode={code} />;
  }

  // Otherwise show waiting room (handles polling + auto-transition)
  return <WaitingRoom roomCode={code} />;
}
