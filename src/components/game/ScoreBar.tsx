'use client';
import React from 'react';

interface ScoreBarProps {
  player1Name: string;
  player2Name: string;
  player1Score: number;
  player2Score: number;
  loveCounter: number;
  roundNumber: number;
  currentPlayerIdx: number;
  answerPhase?: boolean;
}

export default function ScoreBar({
  player1Name,
  player2Name,
  player1Score,
  player2Score,
  loveCounter,
  roundNumber,
  currentPlayerIdx,
  answerPhase = false,
}: ScoreBarProps) {
  const total = player1Score + player2Score;
  const p1Pct = total === 0 ? 50 : Math.round((player1Score / total) * 100);
  const p1Active = currentPlayerIdx === 0;

  return (
    <div
      style={{
        background: 'linear-gradient(160deg, #d0e8f8 0%, #e8d4f0 40%, #fbd5df 100%)',
        borderBottom: '2px solid rgba(232,143,160,0.3)',
        padding: '10px 14px 8px',
        boxShadow: '0 3px 16px rgba(232,143,160,0.18)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Top row: round + hearts + turn */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span
          style={{
            fontSize: 11, fontWeight: 700, color: 'var(--wof-text-secondary)',
            background: 'rgba(232,143,160,0.12)',
            borderRadius: 20, padding: '3px 10px', letterSpacing: 0.5,
          }}
        >
          الجولة {roundNumber}
        </span>

        {/* Love hearts — animated */}
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            background: 'linear-gradient(135deg, #FFE8EE, #FFF0F4)',
            border: '1.5px solid rgba(232,143,160,0.35)',
            borderRadius: 20, padding: '4px 12px',
          }}
        >
          <span style={{ fontSize: 16, lineHeight: 1 }}>❤️</span>
          <span style={{ fontSize: 14, fontWeight: 900, color: '#D96C83', minWidth: 20, textAlign: 'center' }}>
            {loveCounter}
          </span>
        </div>

        <span
          style={{
            fontSize: 11, fontWeight: 700,
            color: p1Active ? 'var(--wof-accent)' : 'var(--wof-text-secondary)',
            background: p1Active ? 'rgba(217,108,131,0.1)' : 'rgba(232,143,160,0.08)',
            borderRadius: 20, padding: '3px 10px', letterSpacing: 0.3,
          }}
        >
          {answerPhase
            ? `📝 دور ${p1Active ? player2Name : player1Name} للإجابة`
            : p1Active
              ? `✨ دور ${player1Name}`
              : `✨ دور ${player2Name}`}
        </span>
      </div>

      {/* Players score row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* Player 1 */}
        <div
          style={{
            flex: 1, textAlign: 'right',
            opacity: p1Active ? 1 : 0.65,
            transition: 'opacity 300ms',
          }}
        >
          <div
            style={{
              fontSize: 11, fontWeight: 700, marginBottom: 2, color: 'var(--wof-text-secondary)',
              display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4,
            }}
          >
            {p1Active && <span style={{ color: 'var(--wof-accent)', fontSize: 7 }}>●</span>}
            {player1Name}
          </div>
          <div
            style={{
              fontSize: 22, fontWeight: 900,
              color: p1Active ? 'var(--wof-accent)' : 'var(--wof-text)',
              lineHeight: 1,
            }}
          >
            {player1Score}
            <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--wof-text-secondary)', marginRight: 2 }}>
              نقطة
            </span>
          </div>
        </div>

        {/* VS chip */}
        <div
          style={{
            width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg, #E88FA0, #D96C83)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, fontWeight: 800, color: 'white',
            boxShadow: '0 2px 8px rgba(217,108,131,0.4)',
          }}
        >
          VS
        </div>

        {/* Player 2 */}
        <div
          style={{
            flex: 1, textAlign: 'left',
            opacity: !p1Active ? 1 : 0.65,
            transition: 'opacity 300ms',
          }}
        >
          <div
            style={{
              fontSize: 11, fontWeight: 700, marginBottom: 2, color: 'var(--wof-text-secondary)',
              display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: 4,
            }}
          >
            {player2Name}
            {!p1Active && <span style={{ color: 'var(--wof-accent)', fontSize: 7 }}>●</span>}
          </div>
          <div
            style={{
              fontSize: 22, fontWeight: 900,
              color: !p1Active ? 'var(--wof-accent)' : 'var(--wof-text)',
              lineHeight: 1,
            }}
          >
            {player2Score}
            <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--wof-text-secondary)', marginRight: 2 }}>
              نقطة
            </span>
          </div>
        </div>
      </div>

      {/* Score progress bar */}
      <div
        style={{
          marginTop: 8,
          height: 5, borderRadius: 99,
          background: 'rgba(232,143,160,0.18)',
          overflow: 'hidden', position: 'relative',
        }}
      >
        {/* p1 fills from right */}
        <div
          style={{
            position: 'absolute', right: 0, top: 0, height: '100%',
            width: `${p1Pct}%`,
            background: 'linear-gradient(90deg, #D96C83, #E88FA0)',
            borderRadius: 99,
            transition: 'width 700ms cubic-bezier(0.34,1.56,0.64,1)',
          }}
        />
        {/* p2 fills from left */}
        <div
          style={{
            position: 'absolute', left: 0, top: 0, height: '100%',
            width: `${100 - p1Pct}%`,
            background: 'linear-gradient(90deg, #A8C5E8, #C9B8E8)',
            borderRadius: 99,
            transition: 'width 700ms cubic-bezier(0.34,1.56,0.64,1)',
          }}
        />
      </div>
    </div>
  );
}
