// ── GameRoomLayout: module-level layout + FloatingPoints + PhaseScreen ──────────
// Extracted OUTSIDE the GameRoom component body to prevent React from remounting
// the whole page on every SSE/polling update (root cause of the never-ending
// wheel, white flicker and stuck transitions).
import React, { useEffect } from 'react';
import ScoreBar from '@/components/game/ScoreBar';
import ChatPanel from '@/components/game/ChatPanel';
import type { GameStateServer } from '@/store/useGameStore';

// ─── Floating points animation (+1 ✨) ─────────────────────────────────────────
// ─── Floating points component ──────────────────────────────────────────────────
export interface FloatPoint { id: string; pts: number; }
function FloatingPoints({ pts, onDone }: { pts: number; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 1200);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div style={{
      position: 'fixed', top: '35%', left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 300, pointerEvents: 'none',
      animation: 'float-pts 1.2s cubic-bezier(0.2,1,0.4,1) both',
      fontSize: 32, fontWeight: 900,
      color: pts >= 2 ? '#D96C83' : '#77B89A',
      textShadow: '0 2px 12px rgba(0,0,0,0.15)',
    }}>
      {pts >= 0 ? `+${pts}` : pts} ✨
    </div>
  );
}

// ─── Phase transition wrapper (memoized to prevent remount flicker) ────────────
export const PhaseScreen = React.memo(({ phaseKey, children }: { phaseKey: string; children: React.ReactNode }) => (
  <div
    key={phaseKey}
    style={{ animation: 'phase-slide-in 320ms cubic-bezier(0.25,0.46,0.45,0.94) both' }}
  >
    {children}
  </div>
));
PhaseScreen.displayName = 'PhaseScreen';

// ─── Bottom Chat Bar ──────────────────────────────────────────────────────────────
// FIX #7: الشارة إشعار مؤقت — تظهر عند وصول رسالة جديدة وتختفي تلقائياً بعد 8 ثوانٍ أو عند فتح الدردشة
export function BottomBar({
  chatOpen, setChatOpen, unread,
}: { chatOpen: boolean; setChatOpen: (o: boolean) => void; unread: number }) {
  const [badgeVisible, setBadgeVisible] = React.useState(true);
  const prevUnreadRef = React.useRef(unread);
  // تظهر الشارة فقط عند تغير unread (رسالة جديدة) — ليست عداداً دائماً
  React.useEffect(() => {
    if (unread !== prevUnreadRef.current && unread > 0) {
      setBadgeVisible(true);
    }
    prevUnreadRef.current = unread;
  }, [unread]);
  // إخفاء تلقائي بعد 8 ثوانٍ من وصول الإشعار
  React.useEffect(() => {
    if (!badgeVisible || unread === 0 || chatOpen) return;
    const t = setTimeout(() => setBadgeVisible(false), 8000);
    return () => clearTimeout(t);
  }, [badgeVisible, unread, chatOpen]);
  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)',
      borderTop: '1px solid var(--wof-border)',
      padding: '10px 24px',
      display: 'flex', justifyContent: 'flex-end', alignItems: 'center',
      paddingBottom: 'calc(10px + env(safe-area-inset-bottom, 0px))',
      zIndex: 50,
    }}>
      <button
        onClick={() => setChatOpen(!chatOpen)}
        style={{
          position: 'relative',
          background: chatOpen
            ? 'linear-gradient(135deg,#E88FA0,#D96C83)'
            : 'rgba(255,248,245,0.9)',
          border: chatOpen ? 'none' : '1.5px solid rgba(232,143,160,0.3)',
          borderRadius: 999, padding: '10px 22px',
          cursor: 'pointer', fontSize: 14, fontWeight: 700,
          color: chatOpen ? 'white' : 'var(--wof-text)',
          display: 'flex', alignItems: 'center', gap: 6,
          boxShadow: chatOpen
            ? '0 4px 16px rgba(217,108,131,0.35)'
            : '0 2px 8px rgba(0,0,0,0.06)',
          transition: 'all 220ms cubic-bezier(0.34,1.56,0.64,1)',
        }}
      >
        💬 الدردشة
        {unread > 0 && !chatOpen && badgeVisible && (
          <span style={{
            background: 'var(--wof-accent)', color: 'white',
            borderRadius: '50%', width: 18, height: 18,
            fontSize: 11, fontWeight: 800,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'absolute', top: -4, right: -4,
            animation: 'wof-bounce-in 400ms ease both',
          }}>
            {Math.min(unread, 9)}
          </span>
        )}
      </button>
    </div>
  );
}

// ─── Shared layout wrapper ─────────────────────────────────────────────────────
export interface GameRoomLayoutProps {
  gameState: GameStateServer | null;
  phase: string;
  p1Name: string;
  p2Name: string;
  partnerName: string;
  isMyTurn: boolean;
  musicOn: boolean;
  toggleMusic: () => void;
  roomCode: string;
  chatOpen: boolean;
  setChatOpen: (v: boolean) => void;
  messages: Array<unknown>;
  poll: () => Promise<void>;
  showDontLaugh: boolean;
  dontLaughSeconds: number;
  confettiParts: Array<{ x: number; y: number; size: number; shape: string; color: string; rotation: number; life: number; maxLife: number }>;
  floatPoints: Array<{ id: string; pts: number }>;
  setFloatPoints: React.Dispatch<React.SetStateAction<Array<{ id: string; pts: number }>>>;
  lastActionError: string | null;
  setActionError: (e: string | null) => void;
  isActionPending: boolean;
  doAction: (type: string, extra?: Record<string, unknown>) => Promise<void>;
  children: React.ReactNode;
}

export function GameRoomLayout({
  gameState, phase, p1Name, p2Name, partnerName, isMyTurn,
  musicOn, toggleMusic, roomCode, chatOpen, setChatOpen, messages, poll,
  showDontLaugh, dontLaughSeconds, confettiParts, floatPoints, setFloatPoints,
  lastActionError, setActionError, isActionPending, doAction, children,
}: GameRoomLayoutProps) {
  if (!gameState) return null;
  return (
  <div className="wof-screen wof-safe-top" style={{ padding: 0 }}>
    {/* Top bar */}
    <div style={{ position: 'relative' }}>
      <ScoreBar
        player1Name={p1Name} player2Name={p2Name}
        player1Score={gameState.player1Score} player2Score={gameState.player2Score}
        loveCounter={gameState.loveCounter} roundNumber={gameState.roundNumber}
        currentPlayerIdx={gameState.currentPlayerIdx}
        answerPhase={phase === 'question'}
      />
      <button
        onClick={toggleMusic}
        title={musicOn ? 'إيقاف الموسيقى' : 'تشغيل الموسيقى'}
        style={{
          position: 'absolute', top: 10, left: 12,
          background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(8px)',
          border: '1.5px solid rgba(232,143,160,0.35)',
          borderRadius: 20, width: 34, height: 34,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16, cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
          transition: 'opacity 0.2s, transform 0.15s',
          opacity: musicOn ? 1 : 0.55, zIndex: 10,
        }}
      >
        {musicOn ? '🎵' : '🔇'}
      </button>
    </div>

    {/* Don't Laugh overlay */}
    {showDontLaugh && (
      <div className="wof-animate-in" style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(255,230,50,0.97)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 16, padding: 32,
      }}>
        <div style={{ fontSize: 80 }}>😂</div>
        <h2 style={{ fontSize: 28, fontWeight: 800, color: '#3D3035', textAlign: 'center' }}>لا تضحك!</h2>
        <div style={{ fontSize: 72, fontWeight: 900, color: '#E88FA0', direction: 'ltr' }}>
          {dontLaughSeconds}
        </div>
        <p style={{ fontSize: 16, color: '#3D3035', fontWeight: 600, textAlign: 'center' }}>
          ثانية من المواجهة 😤
        </p>
        {!isMyTurn && (
          <p style={{ fontSize: 13, color: '#6B5B4F', fontWeight: 600, textAlign: 'center', marginTop: 4 }}>
            إذا ضحكت، أضغط الزر بالأسفل 👇
          </p>
        )}
      </div>
    )}
    {/* Early-bail button for the challenged player (shown under the overlay) */}
    {showDontLaugh && !isMyTurn && (
      <div style={{ position: 'fixed', bottom: 28, left: 0, right: 0, zIndex: 210, textAlign: 'center' }}>
        <button
          className="wof-btn"
          onClick={() => doAction('next_round')}
          disabled={isActionPending}
          style={{
            background: 'linear-gradient(135deg, #F25C78, #E84065)',
            color: 'white', fontWeight: 800, fontSize: 16,
            boxShadow: '0 6px 20px rgba(232,64,101,0.45)',
            minWidth: 220,
          }}
        >ضحكت! 😆 أنهِ التحدي</button>
      </div>
    )}

    {/* Confetti canvas overlay */}
    {confettiParts.length > 0 && (
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 250 }}>
        {confettiParts.map((p) => (
          <div
            key={`${p.x.toFixed(0)}-${p.y.toFixed(0)}-${p.life}`}
            style={{
              position: 'absolute',
              left: p.x, top: p.y,
              width: p.shape === 'circle' ? p.size : p.size * 1.5,
              height: p.size,
              borderRadius: p.shape === 'circle' ? '50%' : 2,
              background: p.color,
              opacity: 1 - p.life / p.maxLife,
              transform: `rotate(${p.rotation}deg)`,
              pointerEvents: 'none',
            }}
          />
        ))}
      </div>
    )}

    {/* Floating points */}
    {floatPoints.map((fp) => (
      <FloatingPoints
        key={fp.id} pts={fp.pts}
        onDone={() => setFloatPoints((prev) => prev.filter((x) => x.id !== fp.id))}
      />
    ))}

    {/* Error banner */}
    {lastActionError && (
      <div style={{
        position: 'fixed', top: 80, left: 16, right: 16, zIndex: 200,
        background: '#FFF0F0', border: '1px solid var(--wof-error)',
        borderRadius: 12, padding: '10px 14px',
        fontSize: 14, color: 'var(--wof-error)', fontWeight: 600,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        boxShadow: '0 4px 16px rgba(217,107,114,0.2)',
        animation: 'phase-slide-in 250ms ease both',
      }}>
        <span>⚠️ {lastActionError}</span>
        <button onClick={() => setActionError(null)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18 }}>✕</button>
      </div>
    )}

    <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px 120px' }}>
      {/* Turn indicator */}
      <div style={{
        textAlign: 'center', marginBottom: 12,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: isMyTurn
            ? 'linear-gradient(135deg, rgba(232,143,160,0.15), rgba(217,108,131,0.1))'
            : 'rgba(128,111,117,0.07)',
          border: `1.5px solid ${isMyTurn ? 'rgba(232,143,160,0.4)' : 'rgba(128,111,117,0.15)'}`,
          borderRadius: 999,
          padding: '5px 14px',
          fontSize: 13, fontWeight: 700,
          color: isMyTurn ? 'var(--wof-primary)' : 'var(--wof-text-secondary)',
          transition: 'all 300ms ease',
        }}>
          {isMyTurn ? (
            <><span style={{ animation: 'wof-pulse-heart 1s infinite' }}>✨</span> دورك!</>
          ) : (
            <>⏳ دور {partnerName}</>
          )}
        </div>
      </div>

      {children}
    </div>

    <BottomBar chatOpen={chatOpen} setChatOpen={setChatOpen} unread={messages.length} />
    <ChatPanel roomCode={roomCode} isOpen={chatOpen} onClose={() => setChatOpen(false)} />

    <style>{`
      @keyframes phase-slide-in {
        from { opacity: 0; transform: translateY(16px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      @keyframes float-pts {
        0%   { opacity: 0; transform: translateX(-50%) translateY(0) scale(0.5); }
        20%  { opacity: 1; transform: translateX(-50%) translateY(-10px) scale(1.2); }
        80%  { opacity: 1; transform: translateX(-50%) translateY(-50px) scale(1); }
        100% { opacity: 0; transform: translateX(-50%) translateY(-70px) scale(0.8); }
      }
      @keyframes spin-btn-ready {
        0%, 100% { box-shadow: 0 4px 20px rgba(217,108,131,0.4); }
        50%       { box-shadow: 0 8px 32px rgba(217,108,131,0.7), 0 0 0 6px rgba(232,143,160,0.15); }
      }
    `}</style>
  </div>
  );
}
