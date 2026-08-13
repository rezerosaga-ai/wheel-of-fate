'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/useGameStore';
import { useRoomPolling } from '@/hooks/useRoomPolling';

interface Props {
  roomCode: string;
}

export default function WaitingRoom({ roomCode }: Props) {
  const router = useRouter();
  const { player, room } = useGameStore();
  const [copied, setCopied] = useState(false);

  useRoomPolling(roomCode, 1500);

  const copyCode = () => {
    navigator.clipboard?.writeText(roomCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const shareCode = () => {
    if (navigator.share) {
      navigator.share({ title: 'Wheel of Fate 🎡❤️', text: `رمز الغرفة: ${roomCode}` });
    } else {
      copyCode();
    }
  };

  const isWaiting = !room?.player2Id;
  const p1Name = room?.player1Name ?? player?.name ?? '…';
  const p2Name = room?.player2Name;

  return (
    <div className="wof-screen wof-safe-top" style={{ overflow: 'hidden' }}>
      {/* Kawaii grid background */}
      <div
        className="kawaii-bg"
        style={{ position: 'fixed', inset: 0, zIndex: 0 }}
      >
        {/* floating emojis */}
        {['💕', '✨', '🌸', '⭐', '💫'].map((e, i) => (
          <div
            key={i}
            style={{
              position: 'absolute', fontSize: `${16 + i * 3}px`, opacity: 0.55,
              top: `${[10, 70, 30, 85, 50][i]}%`,
              left: `${[8, 80, 55, 22, 88][i]}%`,
              animation: `wof-float ${2.5 + i * 0.4}s ease-in-out infinite`,
              animationDelay: `${i * 0.4}s`,
              pointerEvents: 'none', zIndex: 1,
            }}
          >
            {e}
          </div>
        ))}
      </div>

      <div
        className="wof-animate-in"
        style={{
          position: 'relative', zIndex: 2,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          height: '100%', padding: '24px 20px 32px', gap: 16,
        }}
      >
        {/* Main window card */}
        <div className="kawaii-window" style={{ width: '100%', maxWidth: 360 }}>
          {/* macOS dots */}
          <div className="kawaii-window-dots">
            <div className="kawaii-window-dot" style={{ background: 'var(--kawaii-dot-yellow)' }} />
            <div className="kawaii-window-dot" style={{ background: 'var(--kawaii-dot-green)' }} />
            <div className="kawaii-window-dot" style={{ background: 'var(--kawaii-dot-pink)' }} />
          </div>

          <div className="kawaii-window-inner" style={{ textAlign: 'center' }}>
            {/* Status icon */}
            <div
              className="wof-float"
              style={{ fontSize: 56, lineHeight: 1, marginBottom: 10 }}
            >
              {isWaiting ? '⏳' : '🎉'}
            </div>

            <h2 style={{ fontSize: 20, fontWeight: 900, color: '#FF4D8D', marginBottom: 6 }}>
              {isWaiting ? 'في انتظار شريكك... ⏳' : `${p2Name ?? '...'} دخل اللعبة! 🎉`}
            </h2>

            <p style={{ fontSize: 13, color: 'var(--wof-text-secondary)', marginBottom: 20, lineHeight: 1.6 }}>
              {isWaiting
                ? 'أرسل رمز الغرفة لشريكك ليدخل اللعبة ❤️'
                : 'كلاكما جاهز — اللعبة ستبدأ الآن! ✨'}
            </p>

            {/* Room code card */}
            <div
              className="kawaii-card"
              style={{ marginBottom: 16, cursor: 'pointer' }}
              onClick={copyCode}
            >
              <div style={{ fontSize: 12, color: 'var(--wof-text-secondary)', marginBottom: 6, fontWeight: 700 }}>
                🔑 رمز الغرفة
              </div>
              <div className="kawaii-code">{roomCode}</div>
              {copied && (
                <div style={{ fontSize: 13, color: '#77B89A', marginTop: 8, fontWeight: 700 }}>
                  ✅ تم النسخ!
                </div>
              )}
            </div>

            {/* Players row */}
            <div
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-around',
                background: 'rgba(255,245,250,0.8)',
                borderRadius: 18,
                padding: '14px 10px',
                border: '2px solid rgba(232,143,160,0.25)',
                marginBottom: 20,
              }}
            >
              {/* Player 1 */}
              <div className="kawaii-player-slot">
                <div className="kawaii-avatar">🧑</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--wof-text)' }}>{p1Name}</div>
                <div
                  style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: '#77B89A',
                    margin: '6px auto 0',
                    boxShadow: '0 0 0 2px rgba(119,184,154,0.3)',
                  }}
                />
              </div>

              {/* Heart separator */}
              <div
                className="wof-pulse-heart"
                style={{ fontSize: 28, color: '#FF4D8D', padding: '0 8px' }}
              >
                ❤️
              </div>

              {/* Player 2 */}
              <div className="kawaii-player-slot">
                <div className={`kawaii-avatar${p2Name ? '' : ' waiting'}`}>
                  {p2Name ? '👩' : '❓'}
                </div>
                <div style={{ fontSize: 14, fontWeight: 800, color: p2Name ? 'var(--wof-text)' : 'var(--wof-text-secondary)' }}>
                  {p2Name ?? 'في انتظاره...'}
                </div>
                <div
                  style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: p2Name ? '#77B89A' : 'rgba(232,143,160,0.2)',
                    margin: '6px auto 0',
                    border: p2Name ? 'none' : '1.5px dashed rgba(232,143,160,0.4)',
                  }}
                />
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {isWaiting && (
                <button className="kawaii-btn" onClick={shareCode}>
                  📤 مشاركة الرمز
                </button>
              )}

              {!isWaiting && (
                <p style={{ fontSize: 13, color: 'var(--wof-text-secondary)', textAlign: 'center', marginBottom: 4 }}>
                  <span className="wof-loading-dots"><span /><span /><span /></span>
                  {' '}جاري تحميل اللعبة...
                </p>
              )}

              <button
                className="kawaii-btn kawaii-btn-outline"
                onClick={() => {
                  useGameStore.getState().clearRoom();
                  router.push('/');
                }}
                style={{ fontSize: 14, minHeight: 48 }}
              >
                ← العودة للرئيسية
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
