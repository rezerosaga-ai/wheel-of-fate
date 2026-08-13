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

  useEffect(() => {
    if (!mounted) return;
    if (!player?.id) {
      router.replace('/');
    }
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
