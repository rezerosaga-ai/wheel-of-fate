'use client';
import React from 'react';
import { api } from '@/lib/api';
import { useGameStore } from '@/store/useGameStore';


interface PlayerToolsProps {
  roomCode: string;
  myBomb: number;
  mySkip: number;
  myDeepen: number;
  myDontLaugh: number;
  phase: string;
  isMyTurn: boolean;
  currentAnswer: string | null;
}

// ─── الردود الست مع النقاط ───────────────────────────────────────────────────
const REACTIONS = [
  { emoji: '❤️',  label: 'أحببته',   type: 'react_love',     points: 1, color: '#F4A8B8' },
  { emoji: '😂',  label: 'مضحكة',    type: 'react_laugh',    points: 1, color: '#F9D080' },
  { emoji: '🧠',  label: 'عميقة',    type: 'react_deep',     points: 2, color: '#A8C5E8' },
  { emoji: '🥹',  label: 'مؤثرة',    type: 'react_touching', points: 2, color: '#F9C8D3' },
  { emoji: '🔥',  label: 'جريئة',    type: 'react_bold',     points: 2, color: '#E8926A' },
  { emoji: '⭐',  label: 'مميزة',    type: 'react_close',    points: 3, color: '#F9D08A' },
];

export default function PlayerTools({
  roomCode,
  myBomb,
  mySkip,
  myDeepen,
  myDontLaugh,
  phase,
  isMyTurn,
  currentAnswer,
}: PlayerToolsProps) {
  const { player, setActionPending, setActionError, isActionPending, setGameState, setRoom, setMessages, setOnlineStatus } = useGameStore();

  // Direct fetch fallback (replaces useRoomPolling which caused constant re-render flicker)
  const fetchState = async () => {
    try {
      const res = await fetch(`/api/room/${roomCode}/state?playerId=${encodeURIComponent(player?.id ?? '')}`, { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      if (data.gameState) setGameState(data.gameState);
      if (data.room) setRoom(data.room);
      if (data.messages) setMessages(data.messages);
      if (data.onlineStatus) setOnlineStatus(data.onlineStatus);
    } catch { /* ignore */ }
  };

  const dispatch = async (type: string) => {
    if (!player || isActionPending) return;
    setActionPending(true);
    setActionError(null);
    const res = await api.sendAction(roomCode, { type, playerId: player.id });
    setActionPending(false);
    if (res.error) {
      setActionError(res.error);
    } else {
      const resData = res.data as { gameState?: Parameters<typeof setGameState>[0] } | undefined;
      if (resData?.gameState) {
        setGameState(resData.gameState);
      } else {
        await fetchState();
      }
    }
  };

  const canUseTool = ['question', 'spin_category', 'spin_question'].includes(phase);
  // الأسكر يرد — وهو اللاعب الحالي (isMyTurn)
  const canReact = phase === 'reaction' && !!currentAnswer && isMyTurn;

  return (
    <div>
      {/* ─── أدوات اللاعب ─────────────────────────────────────────────────────── */}
      {canUseTool && (
        <div
          style={{
            background: 'white',
            border: '1px solid var(--wof-border)',
            borderRadius: 'var(--wof-radius)',
            padding: '12px 14px',
            marginBottom: 12,
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--wof-text-secondary)', marginBottom: 10 }}>
            🎒 أدواتك
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <ToolButton
              emoji="💣"
              label="قنبلة"
              count={myBomb}
              tooltip="أرسل السؤال للآخر"
              disabled={!isMyTurn || myBomb <= 0 || isActionPending}
              onClick={() => dispatch('use_bomb')}
            />
            <ToolButton
              emoji="⏭"
              label="تخطّي"
              count={mySkip}
              tooltip="تخطّي السؤال — ٣ مرات فقط"
              disabled={!isMyTurn || mySkip <= 0 || isActionPending}
              onClick={() => dispatch('use_skip')}
            />
            <ToolButton
              emoji="🔍"
              label="تعمّق"
              count={myDeepen}
              tooltip="اطلب إجابة أعمق"
              disabled={!isMyTurn || myDeepen <= 0 || isActionPending}
              onClick={() => dispatch('use_deepen')}
            />
            <ToolButton
              emoji="😂"
              label="لا تضحك"
              count={myDontLaugh}
              tooltip="تحدّي: ٣٠ ثانية بدون ضحك!"
              disabled={myDontLaugh <= 0 || isActionPending}
              onClick={() => dispatch('use_dont_laugh')}
            />
          </div>
        </div>
      )}

      {/* ─── ردود الفعل الست ─────────────────────────────────────────────────── */}
      {canReact && (
        <div
          style={{
            background: 'white',
            border: '1px solid var(--wof-border)',
            borderRadius: 'var(--wof-radius)',
            padding: '14px',
            marginBottom: 12,
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--wof-text-secondary)', marginBottom: 12 }}>
            ✨ ردّك على الإجابة
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 8,
            }}
          >
            {REACTIONS.map((r) => (
              <button
                key={r.type}
                // onPointerDown + preventDefault يمنع blur على أي input في الصفحة
                // مما يمنع تراقص لوحة المفاتيح عند الضغط على أزرار النقاط
                onPointerDown={(e) => {
                  e.preventDefault();
                  if (!isActionPending) dispatch(r.type);
                }}
                disabled={isActionPending}
                style={{
                  background: isActionPending ? 'var(--wof-bg)' : `${r.color}22`,
                  border: `1.5px solid ${r.color}`,
                  borderRadius: 'var(--wof-radius)',
                  padding: '10px 8px',
                  cursor: isActionPending ? 'not-allowed' : 'pointer',
                  opacity: isActionPending ? 0.6 : 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 3,
                  transition: 'all 150ms',
                  WebkitTapHighlightColor: 'transparent',
                  touchAction: 'manipulation',
                }}
              >
                <span style={{ fontSize: 24 }}>{r.emoji}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--wof-text)' }}>
                  {r.label}
                </span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: 'var(--wof-text-secondary)',
                    background: `${r.color}44`,
                    borderRadius: 99,
                    padding: '1px 6px',
                  }}
                >
                  +{r.points}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tool Button ─────────────────────────────────────────────────────────────
function ToolButton({
  emoji,
  label,
  count,
  tooltip,
  disabled,
  onClick,
}: {
  emoji: string;
  label: string;
  count: number;
  tooltip: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onPointerDown={(e) => { e.preventDefault(); if (!disabled) onClick(); }}
      disabled={disabled}
      title={tooltip}
      style={{
        background: disabled ? 'var(--wof-bg)' : 'white',
        border: `1.5px solid ${disabled ? 'var(--wof-border)' : 'var(--wof-secondary)'}`,
        borderRadius: 'var(--wof-radius)',
        padding: '7px 12px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        fontSize: 13,
        fontWeight: 600,
        color: disabled ? 'var(--wof-text-secondary)' : 'var(--wof-text)',
        display: 'flex',
        alignItems: 'center',
        gap: 5,
        transition: 'all 150ms',
        position: 'relative',
        WebkitTapHighlightColor: 'transparent',
        touchAction: 'manipulation',
      }}
    >
      <span style={{ fontSize: 16 }}>{emoji}</span>
      <span>{label}</span>
      {count > 0 && (
        <span
          style={{
            background: 'var(--wof-primary)',
            color: 'white',
            borderRadius: '50%',
            width: 17,
            height: 17,
            fontSize: 10,
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'absolute',
            top: -6,
            right: -6,
          }}
        >
          {count}
        </span>
      )}
    </button>
  );
}
