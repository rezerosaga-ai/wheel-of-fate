'use client';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { useRoomSSE } from '@/hooks/useRoomSSE';
import { api } from '@/lib/api';
import { getQuestionById } from '@/lib/questions';
import { SFX, BGM, unlockAudio } from '@/lib/sounds';
import ScoreBar from '@/components/game/ScoreBar';
import SpinWheel from '@/components/game/SpinWheel';
import QuestionCard from '@/components/game/QuestionCard';
import PlayerTools from '@/components/game/PlayerTools';
import ChatPanel from '@/components/game/ChatPanel';
import FateCard from '@/components/game/FateCard';
import KnowMe from '@/components/game/KnowMe';
import ChallengeCard from '@/components/game/ChallengeCard';
import SessionEnd from '@/components/screens/SessionEnd';

const CATEGORY_EMOJI: Record<string, string> = {
  love: '❤️', relationship: '🫂', personality: '🧠',
  confessions: '🪞', bold: '🔥', laugh: '😂', situations: '🎭', future: '💭',
  daily_life: '🌿', deep_feelings: '💜', dreams: '⭐', past: '📸',
  trust: '🔐', fun: '😄', growth: '🌱',
};

const CATEGORY_LABEL_AR: Record<string, string> = {
  love: 'الحب', relationship: 'علاقتنا', personality: 'الشخصية والأفكار',
  confessions: 'الاعترافات', bold: 'الجريئة', laugh: 'الضحك',
  situations: 'المواقف والافتراضات', future: 'المستقبل',
};

const CATEGORY_COLOR: Record<string, string> = {
  love: '#F4A8B8', relationship: '#F9C8D3', personality: '#A8C5E8',
  confessions: '#C9B8E8', bold: '#E8926A', future: '#B8D8C8',
  laugh: '#F9D080', situations: '#E8D4A0',
};

// ─── Confetti particle ──────────────────────────────────────────────────────────
interface ConfettiParticle {
  x: number; y: number; vx: number; vy: number;
  color: string; size: number; rotation: number; rotSpeed: number;
  life: number; maxLife: number; shape: 'circle' | 'rect';
}

function useConfetti() {
  const [particles, setParticles] = useState<ConfettiParticle[]>([]);
  const rafRef = useRef<number>(0);

  const burst = useCallback((count = 60) => {
    const colors = ['#F4A8B8','#F9D080','#A8C5E8','#C9B8E8','#E8926A','#B8D8C8','#FFD700','#FF6FA3'];
    const newP: ConfettiParticle[] = Array.from({ length: count }, () => ({
      x: Math.random() * window.innerWidth,
      y: -10,
      vx: (Math.random() - 0.5) * 5,
      vy: 2 + Math.random() * 5,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 5 + Math.random() * 7,
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 8,
      life: 0, maxLife: 80 + Math.floor(Math.random() * 40),
      shape: Math.random() > 0.5 ? 'circle' : 'rect',
    }));
    setParticles(newP);
  }, []);

  useEffect(() => {
    if (particles.length === 0) return;
    let frame = 0;
    const tick = () => {
      frame++;
      setParticles((prev) => {
        const next = prev
          .map((p) => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            vy: p.vy + 0.08,
            vx: p.vx * 0.99,
            rotation: p.rotation + p.rotSpeed,
            life: p.life + 1,
          }))
          .filter((p) => p.life < p.maxLife);
        if (next.length === 0) return [];
        return next;
      });
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [particles.length > 0]);  // only start when particles appear

  return { particles, burst };
}

// ─── Floating points component ──────────────────────────────────────────────────
interface FloatPoint { id: number; pts: number; }
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

// ─── Phase transition wrapper ────────────────────────────────────────────────────
function PhaseScreen({ phaseKey, children }: { phaseKey: string; children: React.ReactNode }) {
  return (
    <div
      key={phaseKey}
      style={{ animation: 'phase-slide-in 320ms cubic-bezier(0.25,0.46,0.45,0.94) both' }}
    >
      {children}
    </div>
  );
}

interface GameRoomProps {
  roomCode: string;
}

export default function GameRoom({ roomCode }: GameRoomProps) {
  const {
    player, room, gameState, messages,
    chatOpen, setChatOpen,
    isActionPending, setActionPending, setActionError, lastActionError,
    setGameState,
  } = useGameStore();

  const { poll } = useRoomSSE(roomCode);

  const [spinning, setSpinning] = useState(false);
  const [spinTarget, setSpinTarget] = useState<string | null>(null);
  const prevPhaseKey = useRef('');

  const [musicOn, setMusicOn] = useState(true);
  const [showDontLaugh, setShowDontLaugh] = useState(false);
  const [dontLaughSeconds, setDontLaughSeconds] = useState(30);
  const dontLaughTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const [wheelSize, setWheelSize] = useState(280);
  useEffect(() => {
    const update = () => setWheelSize(Math.min(window.innerWidth - 48, 310));
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // Confetti
  const { particles: confettiParts, burst: confettiBurst } = useConfetti();

  // Floating points
  const [floatPoints, setFloatPoints] = useState<FloatPoint[]>([]);
  const floatIdRef = useRef(0);

  const showFloatingPoints = useCallback((pts: number) => {
    const id = floatIdRef.current++;
    setFloatPoints((prev) => [...prev, { id, pts }]);
  }, []);

  // Sound + animation triggers
  useEffect(() => {
    if (!gameState) return;
    const { phase, currentCategory, currentQuestionId, roundNumber } = gameState;
    const key = `${phase}-${currentCategory ?? 'none'}-${currentQuestionId ?? 0}-${roundNumber}`;
    if (key === prevPhaseKey.current) return;
    const prevKey = prevPhaseKey.current;
    prevPhaseKey.current = key;

    if (prevKey === '') {
      setTimeout(() => BGM.play('default'), 600);
    } else if (phase === 'spin_start' || phase === 'spin_question') {
      BGM.play('default');
    } else if (phase === 'question') {
      const catTheme: Record<string, string> = {
        love: 'love', relationship: 'love', future: 'future',
        laugh: 'laugh', bold: 'bold', confessions: 'confession',
        personality: 'default', situations: 'bold',
      };
      BGM.play(catTheme[currentCategory ?? ''] ?? 'default');
    } else if (phase === 'fate_card' || phase === 'know_me') {
      BGM.play('confession');
    } else if (phase === 'challenge') {
      BGM.play('challenge');
      SFX.challengeIssued();
    } else if (phase === 'session_end') {
      BGM.play('session_end');
    }

    if (phase === 'spin_question' && currentCategory) {
      setSpinTarget(currentCategory);
      setSpinning(true);
      SFX.spinStart();
    }
    if (phase === 'question' && currentQuestionId && prevKey !== '') {
      SFX.questionReveal();
    }
    if (phase === 'fate_card') SFX.fateCard();
    if (phase === 'round_end')  SFX.roundEnd();
    if (phase === 'dont_laugh') SFX.dontLaugh();
  }, [gameState]);

  useEffect(() => () => BGM.stop(800), []);

  // Don't Laugh overlay
  useEffect(() => {
    if (!gameState) return;
    if (gameState.dontLaughActive) {
      setShowDontLaugh(true);
      setDontLaughSeconds(30);
      if (dontLaughTimer.current) clearInterval(dontLaughTimer.current);
      dontLaughTimer.current = setInterval(() => {
        setDontLaughSeconds((s) => {
          if (s <= 1) {
            clearInterval(dontLaughTimer.current!);
            setShowDontLaugh(false);
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } else {
      setShowDontLaugh(false);
      if (dontLaughTimer.current) clearInterval(dontLaughTimer.current);
    }
    return () => { if (dontLaughTimer.current) clearInterval(dontLaughTimer.current); };
  }, [gameState?.dontLaughActive]);

  const doAction = async (type: string, extra?: Record<string, unknown>) => {
    if (isActionPending || !player) return;
    unlockAudio();
    setActionPending(true);
    setActionError(null);

    if (type === 'spin') SFX.spinStart();
    else if (type === 'pick_question') SFX.spinStart();
    else if (type === 'answer') SFX.answerSubmit();
    else if (type === 'react_love') SFX.reactLove();
    else if (type === 'react_laugh') SFX.reactLaugh();
    else if (type === 'react_deep') SFX.reactDeep();
    else if (type === 'react_touching') SFX.reactTouching();
    else if (type === 'react_bold') SFX.reactBold();
    else if (type === 'react_close') SFX.reactStar();

    const res = await api.sendAction(roomCode, { type, playerId: player.id, ...extra });
    setActionPending(false);
    if (res.error) {
      setActionError(res.error);
    } else {
      if (type.startsWith('react_')) {
        SFX.pointsGained();
        // Points earned — show floating +pts and confetti
        const ptMap: Record<string, number> = {
          react_love: 1, react_laugh: 1, react_deep: 2,
          react_touching: 2, react_bold: 2, react_close: 3,
        };
        const pts = ptMap[type] ?? 1;
        showFloatingPoints(pts);
        if (pts >= 2) confettiBurst(40);
      }
      const resData = res.data as { gameState?: Parameters<typeof setGameState>[0] } | undefined;
      if (resData?.gameState) {
        setGameState(resData.gameState);
      } else {
        await poll();
      }
    }
  };

  const onSpinEnd = useCallback(() => {
    setSpinning(false);
    SFX.spinEnd();
    // Small confetti burst when category lands
    confettiBurst(25);
  }, [confettiBurst]);

  if (!gameState || !player || !room) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--wof-bg)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎡</div>
          <span className="wof-loading-dots"><span /><span /><span /></span>
        </div>
      </div>
    );
  }

  const isPlayer1  = player.role === 'player1';
  const isMyTurn   = (isPlayer1 && gameState.currentPlayerIdx === 0) || (!isPlayer1 && gameState.currentPlayerIdx === 1);
  const myBomb     = isPlayer1 ? gameState.player1Bomb     : gameState.player2Bomb;
  const mySkip     = isPlayer1 ? gameState.player1Skip     : gameState.player2Skip;
  const myDeepen   = isPlayer1 ? gameState.player1Deepen   : gameState.player2Deepen;
  const myDontLaugh= isPlayer1 ? gameState.player1DontLaugh: gameState.player2DontLaugh;
  const p1Name     = room.player1Name ?? 'لاعب 1';
  const p2Name     = room.player2Name ?? 'لاعب 2';
  const partnerName= isPlayer1 ? p2Name : p1Name;
  const phase      = gameState.phase;

  const questionText = (() => {
    if (!gameState.currentQuestionId) return '';
    const q = getQuestionById(gameState.currentQuestionId);
    return q?.text ?? '';
  })();

  const toggleMusic = () => {
    unlockAudio();
    const next = BGM.toggle();
    setMusicOn(next);
  };

  const catColor = CATEGORY_COLOR[gameState.currentCategory ?? ''] ?? 'var(--wof-secondary)';

  // ─── Shared layout wrapper ──────────────────────────────────────────────────
  const Layout = ({ children }: { children: React.ReactNode }) => (
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

  // ─── session_end ──────────────────────────────────────────────────────────────
  if (phase === 'session_end') {
    return (
      <SessionEnd
        roomCode={roomCode} player1Name={p1Name} player2Name={p2Name}
        player1Score={gameState.player1Score} player2Score={gameState.player2Score}
        loveCounter={gameState.loveCounter} roundNumber={gameState.roundNumber}
      />
    );
  }

  if (phase === 'waiting') return null;

  // ─── spin_start ───────────────────────────────────────────────────────────────
  if (phase === 'spin_start') {
    return (
      <Layout>
        <PhaseScreen phaseKey="spin_start">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, paddingTop: 12 }}>
            {/* Hero emoji with float */}
            <div style={{ fontSize: 72, animation: 'wof-float 2.5s ease-in-out infinite' }}>🎡</div>

            <div style={{ textAlign: 'center' }}>
              <h3 className="wof-title" style={{ fontSize: 22, marginBottom: 6 }}>كلاكما جاهز! 🎉</h3>
              <p className="wof-body" style={{ fontSize: 14, maxWidth: 260, margin: '0 auto' }}>
                أدر العجلة لمعرفة من يبدأ الجلسة ❤️
              </p>
            </div>

            {/* Two avatar chips */}
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{
                background: 'linear-gradient(135deg,#FFE0EA,#FFC8D7)',
                border: '2px solid rgba(232,143,160,0.5)',
                borderRadius: 999, padding: '8px 18px',
                fontWeight: 700, fontSize: 14, color: 'var(--wof-text)',
              }}>{p1Name} 💕</div>
              <div style={{ fontSize: 18, color: 'var(--wof-text-secondary)' }}>vs</div>
              <div style={{
                background: 'linear-gradient(135deg,#E0EAFF,#C8D7FF)',
                border: '2px solid rgba(168,197,232,0.5)',
                borderRadius: 999, padding: '8px 18px',
                fontWeight: 700, fontSize: 14, color: 'var(--wof-text)',
              }}>{p2Name} 💙</div>
            </div>

            <button
              className="wof-btn wof-btn-primary"
              onClick={() => doAction('spin')}
              disabled={isActionPending}
              style={{
                minWidth: 220, fontSize: 17,
                animation: isActionPending ? 'none' : 'spin-btn-ready 2s ease-in-out infinite',
              }}
            >
              {isActionPending
                ? <span className="wof-loading-dots"><span /><span /><span /></span>
                : '🎡 ابدأ اللعبة!'}
            </button>
          </div>
        </PhaseScreen>
      </Layout>
    );
  }

  // ─── fate_card ────────────────────────────────────────────────────────────────
  if (phase === 'fate_card') {
    return (
      <Layout>
        <PhaseScreen phaseKey="fate_card">
          <FateCard
            roomCode={roomCode} pendingSpinResult={gameState.pendingSpinResult}
            secretMsg1={gameState.secretMsg1} secretMsg2={gameState.secretMsg2}
            secretMsgRevealed={gameState.secretMsgRevealed}
            isPlayer1={isPlayer1} player1Name={p1Name} player2Name={p2Name} phase={phase}
          />
        </PhaseScreen>
      </Layout>
    );
  }

  // ─── know_me ──────────────────────────────────────────────────────────────────
  if (phase === 'know_me') {
    return (
      <Layout>
        <PhaseScreen phaseKey="know_me">
          <KnowMe
            roomCode={roomCode} question={gameState.knowMeQuestion}
            answer={gameState.knowMeAnswer} guess={gameState.knowMeGuess}
            answerBy={gameState.knowMeAnswerBy} guessBy={gameState.knowMeGuessBy}
            isPlayer1={isPlayer1} player1Name={p1Name} player2Name={p2Name}
          />
        </PhaseScreen>
      </Layout>
    );
  }

  // ─── challenge ────────────────────────────────────────────────────────────────
  if (phase === 'challenge') {
    return (
      <Layout>
        <PhaseScreen phaseKey="challenge">
          <ChallengeCard
            roomCode={roomCode} challengeQuestionsLeft={gameState.challengeQuestionsLeft ?? 0}
            challengeQuestionId={gameState.challengeQuestionId ?? null}
            challengeAnswer={gameState.challengeAnswer ?? null}
            challengeBy={gameState.challengeBy ?? null}
            isPlayer1={isPlayer1} player1Name={p1Name} player2Name={p2Name}
            currentCategory={gameState.currentCategory}
          />
        </PhaseScreen>
      </Layout>
    );
  }

  // ─── round_end ────────────────────────────────────────────────────────────────
  if (phase === 'round_end') {
    const lastAnswer     = gameState.currentAnswer;
    const alreadyChallenged = gameState.challengeActive;

    return (
      <Layout>
        <PhaseScreen phaseKey={`round_end-${gameState.roundNumber}`}>
          <div style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: 18, paddingTop: 24,
          }}>
            {/* Celebration header */}
            <div style={{
              background: 'linear-gradient(135deg,rgba(244,182,194,0.2),rgba(232,143,160,0.12))',
              border: '2px solid rgba(232,143,160,0.3)',
              borderRadius: 24, padding: '18px 28px', textAlign: 'center',
              maxWidth: 300, width: '100%',
            }}>
              <div style={{ fontSize: 48, marginBottom: 8 }}>🌸</div>
              <h3 className="wof-title" style={{ fontSize: 20, marginBottom: 4 }}>
                نهاية الجولة {gameState.roundNumber}
              </h3>
              {lastAnswer && (
                <p style={{
                  fontSize: 13, color: 'var(--wof-text-secondary)',
                  fontStyle: 'italic', lineHeight: 1.6, marginTop: 8,
                }}>
                  &ldquo;{lastAnswer}&rdquo;
                </p>
              )}
            </div>

            {/* Score snapshot */}
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <ScoreChip name={p1Name} score={gameState.player1Score} highlight={isPlayer1 && isMyTurn} />
              <div style={{ fontSize: 20 }}>💞</div>
              <ScoreChip name={p2Name} score={gameState.player2Score} highlight={!isPlayer1 && isMyTurn} />
            </div>

            {isMyTurn ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 290 }}>
                {!alreadyChallenged && (
                  <button
                    className="wof-btn wof-btn-full"
                    onClick={() => { SFX.fateCard(); doAction('use_challenge'); }}
                    disabled={isActionPending}
                    style={{
                      background: 'linear-gradient(135deg,#1a0533,#6a1fa3)',
                      border: '2px solid #9B59B6', color: 'white',
                      fontWeight: 800, fontSize: 15, borderRadius: 16,
                      padding: '13px 20px',
                      boxShadow: '0 4px 16px rgba(155,89,182,0.4)',
                    }}
                  >
                    🃏 تحدٍّ! +2 نقطة إضافية
                  </button>
                )}
                <button
                  className="wof-btn wof-btn-primary wof-btn-full"
                  onClick={() => doAction('next_round')}
                  disabled={isActionPending}
                >
                  {isActionPending
                    ? <span className="wof-loading-dots"><span /><span /><span /></span>
                    : '▶ الجولة التالية'}
                </button>
                <button
                  className="wof-btn wof-btn-secondary wof-btn-full"
                  onClick={() => doAction('end_session')}
                  disabled={isActionPending}
                  style={{ fontSize: 13 }}
                >
                  🎯 إنهاء الجلسة والتأمل
                </button>
              </div>
            ) : (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                fontSize: 14, color: 'var(--wof-text-secondary)', fontWeight: 600,
              }}>
                <span className="wof-loading-dots" style={{ display: 'inline-flex' }}>
                  <span /><span /><span />
                </span>
                في انتظار {partnerName}…
              </div>
            )}
          </div>
        </PhaseScreen>
      </Layout>
    );
  }

  // ─── don't_laugh ──────────────────────────────────────────────────────────────
  if (phase === 'dont_laugh') {
    return (
      <Layout>
        {!showDontLaugh && (
          <div style={{ textAlign: 'center', paddingTop: 32 }}>
            <div style={{ fontSize: 48 }}>😂</div>
            <p style={{ fontSize: 16, fontWeight: 700, marginTop: 12 }}>انتهت جلسة لا تضحك!</p>
            {isMyTurn && (
              <button
                className="wof-btn wof-btn-primary"
                onClick={() => doAction('next_round')}
                disabled={isActionPending}
                style={{ marginTop: 16, minWidth: 180 }}
              >متابعة ▶</button>
            )}
          </div>
        )}
      </Layout>
    );
  }

  // ─── spin_category + spin_question + question + reaction ─────────────────────
  return (
    <Layout>
      {(phase === 'spin_category' || phase === 'spin_question') && (
        <PhaseScreen phaseKey={phase}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            {/* Category label — appears in spin_question */}
            {phase === 'spin_question' && gameState.currentCategory && (
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: `${catColor}22`,
                border: `2px solid ${catColor}`,
                borderRadius: 999, padding: '6px 18px',
                fontWeight: 700, fontSize: 15,
                animation: 'phase-slide-in 350ms ease both',
              }}>
                <span>{CATEGORY_EMOJI[gameState.currentCategory] ?? '🎯'}</span>
                <span>{CATEGORY_LABEL_AR[gameState.currentCategory] ?? gameState.currentCategory}</span>
              </div>
            )}

            <SpinWheel
              spinning={spinning}
              targetCategory={spinTarget}
              onSpinEnd={onSpinEnd}
              size={wheelSize}
            />

            {/* spin_category CTA */}
            {phase === 'spin_category' && isMyTurn && !spinning && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, width: '100%' }}>
                <p style={{ fontSize: 14, color: 'var(--wof-text-secondary)', fontWeight: 600, textAlign: 'center' }}>
                  دورك! أدر العجلة لاختيار الفئة 🎯
                </p>
                <button
                  className="wof-btn wof-btn-primary"
                  onClick={() => doAction('spin')}
                  disabled={isActionPending}
                  style={{
                    minWidth: 200,
                    animation: isActionPending ? 'none' : 'spin-btn-ready 2s ease-in-out infinite',
                  }}
                >
                  {isActionPending
                    ? <span className="wof-loading-dots"><span /><span /><span /></span>
                    : '🎡 أدر العجلة!'}
                </button>
              </div>
            )}

            {phase === 'spin_category' && !isMyTurn && !spinning && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                fontSize: 14, color: 'var(--wof-text-secondary)', fontWeight: 600,
              }}>
                <span className="wof-loading-dots" style={{ display: 'inline-flex' }}>
                  <span /><span /><span />
                </span>
                {partnerName} يختار الفئة…
              </div>
            )}

            {/* spin_question CTA */}
            {phase === 'spin_question' && isMyTurn && !spinning && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, width: '100%' }}>
                <p style={{ fontSize: 14, color: 'var(--wof-text-secondary)', fontWeight: 600, textAlign: 'center' }}>
                  تم اختيار الفئة! الآن اختر سؤالاً 🎲
                </p>
                <button
                  className="wof-btn wof-btn-primary"
                  onClick={() => doAction('pick_question')}
                  disabled={isActionPending}
                  style={{
                    minWidth: 200,
                    animation: isActionPending ? 'none' : 'spin-btn-ready 2s ease-in-out infinite',
                  }}
                >
                  {isActionPending
                    ? <span className="wof-loading-dots"><span /><span /><span /></span>
                    : '🎲 اختر السؤال'}
                </button>
              </div>
            )}

            {phase === 'spin_question' && !isMyTurn && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                fontSize: 14, color: 'var(--wof-text-secondary)', fontWeight: 600,
              }}>
                <span className="wof-loading-dots" style={{ display: 'inline-flex' }}>
                  <span /><span /><span />
                </span>
                {partnerName} يختار السؤال…
              </div>
            )}
          </div>
        </PhaseScreen>
      )}

      {(phase === 'question' || phase === 'reaction') && (
        <PhaseScreen phaseKey={`${phase}-${gameState.currentQuestionId}`}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <QuestionCard
              questionId={gameState.currentQuestionId}
              questionText={questionText}
              category={gameState.currentCategory}
              categoryEmoji={CATEGORY_EMOJI[gameState.currentCategory ?? ''] ?? '❓'}
              askingPlayerName={isMyTurn ? (isPlayer1 ? p1Name : p2Name) : partnerName}
              answeringPlayerName={isMyTurn ? partnerName : (isPlayer1 ? p1Name : p2Name)}
              isMyTurnToAnswer={!isMyTurn}
              answer={gameState.currentAnswer}
              answeredBy={gameState.currentAnswerBy}
              phase={phase}
              roomCode={roomCode}
              deepenQuestion={gameState.deepenQuestionText}
            />

            <PlayerTools
              roomCode={roomCode}
              myBomb={myBomb} mySkip={mySkip} myDeepen={myDeepen} myDontLaugh={myDontLaugh}
              phase={phase} isMyTurn={isMyTurn} currentAnswer={gameState.currentAnswer}
            />

            {phase === 'reaction' && !gameState.reactionDone && !isMyTurn && (
              <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--wof-text-secondary)', fontWeight: 600 }}>
                في انتظار {partnerName} يرد…
              </p>
            )}

            {phase === 'reaction' && gameState.reactionDone && isMyTurn && (
              <button
                className="wof-btn wof-btn-primary wof-btn-full"
                onClick={() => doAction('end_round')}
                disabled={isActionPending}
                style={{ animation: 'phase-slide-in 300ms ease both' }}
              >
                {isActionPending
                  ? <span className="wof-loading-dots"><span /><span /><span /></span>
                  : 'انتهت الجولة ✅'}
              </button>
            )}

            {phase === 'reaction' && gameState.reactionDone && !isMyTurn && (
              <div className="wof-animate-in" style={{
                background: 'var(--wof-primary-soft)',
                border: '1.5px solid var(--wof-secondary)',
                borderRadius: 'var(--wof-radius)', padding: '12px 16px',
                textAlign: 'center', fontSize: 14, fontWeight: 600,
                color: 'var(--wof-text-secondary)',
              }}>
                ✅ ردّ {partnerName} — في انتظار المتابعة…
              </div>
            )}
          </div>
        </PhaseScreen>
      )}
    </Layout>
  );
}

// ─── Score chip helper ──────────────────────────────────────────────────────────
function ScoreChip({ name, score, highlight }: { name: string; score: number; highlight: boolean }) {
  return (
    <div style={{
      textAlign: 'center', padding: '10px 18px',
      background: highlight
        ? 'linear-gradient(135deg,rgba(232,143,160,0.15),rgba(217,108,131,0.08))'
        : 'rgba(128,111,117,0.06)',
      border: `1.5px solid ${highlight ? 'rgba(232,143,160,0.4)' : 'rgba(128,111,117,0.15)'}`,
      borderRadius: 16, minWidth: 90,
      transition: 'all 300ms',
    }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--wof-text-secondary)', marginBottom: 4 }}>{name}</div>
      <div style={{ fontSize: 24, fontWeight: 900, color: highlight ? 'var(--wof-accent)' : 'var(--wof-text)' }}>
        {score}
      </div>
    </div>
  );
}

// ─── Bottom Chat Bar ──────────────────────────────────────────────────────────────
function BottomBar({
  chatOpen, setChatOpen, unread,
}: { chatOpen: boolean; setChatOpen: (o: boolean) => void; unread: number }) {
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
        {unread > 0 && !chatOpen && (
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
