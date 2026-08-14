'use client';
// ─── بطاقة تحدي — +2 سؤال ─────────────────────────────────────────────────────
import React, { useState } from 'react';
import { api } from '@/lib/api';
import { useGameStore } from '@/store/useGameStore';

import { getQuestionById, CATEGORY_LABELS } from '@/lib/questions';

interface ChallengeCardProps {
  roomCode: string;
  challengeQuestionsLeft: number;   // 2 or 1
  challengeQuestionId: number | null;
  challengeAnswer: string | null;
  challengeBy: string | null;
  isPlayer1: boolean;
  player1Name: string;
  player2Name: string;
  currentCategory: string | null;
}

export default function ChallengeCard({
  roomCode,
  challengeQuestionsLeft,
  challengeQuestionId,
  challengeAnswer,
  challengeBy,
  isPlayer1,
  player1Name,
  player2Name,
  currentCategory,
}: ChallengeCardProps) {
  const { player, isActionPending, setActionPending, setActionError, setGameState, setRoom, setMessages, setOnlineStatus } = useGameStore();

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
  const [answerText, setAnswerText] = useState('');

  const myId = player?.id ?? '';
  const isChallengedPlayer = myId !== challengeBy;
  const questionText = challengeQuestionId ? (getQuestionById(challengeQuestionId)?.text ?? '') : '';
  const challengerName = challengeBy
    ? (challengeBy === (isPlayer1 ? player?.id : player?.id) ? 'أنت' : (isPlayer1 ? player2Name : player1Name))
    : '?';

  // Who challenged whom
  const myName = isPlayer1 ? player1Name : player2Name;
  const partnerName = isPlayer1 ? player2Name : player1Name;

  const submitAnswer = async () => {
    if (!answerText.trim() || isActionPending || !player) return;
    setActionPending(true);
    setActionError(null);
    const res = await api.sendAction(roomCode, {
      type: 'challenge_answer',
      playerId: player.id,
      answer: answerText.trim(),
    });
    setActionPending(false);
    if (res.error) {
      setActionError(res.error);
    } else {
      setAnswerText('');
      await fetchState();
    }
  };

  const totalQuestions = 2;
  const answeredCount = totalQuestions - challengeQuestionsLeft;
  const progress = (answeredCount / totalQuestions) * 100;

  return (
    <div
      className="wof-animate-in"
      style={{
        background: 'linear-gradient(135deg, #1a0533 0%, #2d0a5c 50%, #1a0533 100%)',
        border: '2px solid #9B59B6',
        borderRadius: 20,
        padding: '20px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        boxShadow: '0 0 32px rgba(155,89,182,0.4)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Shine effect */}
      <div
        style={{
          position: 'absolute', top: -60, left: -60,
          width: 160, height: 160, borderRadius: '50%',
          background: 'rgba(155,89,182,0.15)',
          filter: 'blur(30px)',
          pointerEvents: 'none',
        }}
      />

      {/* Header */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 40, lineHeight: 1 }}>🃏</div>
        <div
          style={{
            fontSize: 11, fontWeight: 800, letterSpacing: 3,
            color: '#C39BD3', marginTop: 6, textTransform: 'uppercase',
          }}
        >
          تحدي  +{challengeQuestionsLeft}  سؤال
        </div>
        <h3
          style={{
            fontSize: 20, fontWeight: 900, color: 'white',
            margin: '6px 0 0', textAlign: 'center',
          }}
        >
          {isChallengedPlayer
            ? `🔥 ${partnerName.split(' ')[0]} تحداك!`
            : `⚡ تحديت ${partnerName.split(' ')[0]}!`}
        </h3>
        <p style={{ fontSize: 13, color: '#C39BD3', margin: '4px 0 0', textAlign: 'center' }}>
          {isChallengedPlayer
            ? `أجب على ${challengeQuestionsLeft} سؤال${challengeQuestionsLeft > 1 ? 'ين إضافيين' : ' إضافي'} من نفس الفئة`
            : `في انتظار ${partnerName} للإجابة…`}
        </p>
      </div>

      {/* Progress bar */}
      <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 8, overflow: 'hidden', height: 8 }}>
        <div
          style={{
            height: '100%', width: `${100 - progress}%`,
            background: 'linear-gradient(90deg, #9B59B6, #E91E8C)',
            borderRadius: 8,
            transition: 'width 0.5s ease',
          }}
        />
      </div>
      <p style={{ fontSize: 12, color: '#C39BD3', textAlign: 'center', margin: '-8px 0 0' }}>
        متبقي {challengeQuestionsLeft} من {totalQuestions} أسئلة
      </p>

      {/* Category badge */}
      {currentCategory && (
        <div style={{ textAlign: 'center' }}>
          <span
            style={{
              background: 'rgba(155,89,182,0.25)',
              border: '1px solid rgba(155,89,182,0.5)',
              borderRadius: 20, padding: '4px 14px',
              fontSize: 13, color: '#E8DAEF', fontWeight: 600,
            }}
          >
            فئة: {CATEGORY_LABELS[currentCategory as keyof typeof CATEGORY_LABELS] ?? currentCategory}
          </span>
        </div>
      )}

      {/* Question */}
      {questionText ? (
        <div
          style={{
            background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 14,
            padding: '14px 16px',
          }}
        >
          <p style={{ fontSize: 16, fontWeight: 700, color: 'white', textAlign: 'center', lineHeight: 1.6, margin: 0 }}>
            {questionText}
          </p>
        </div>
      ) : (
        <div style={{ textAlign: 'center', color: '#C39BD3', fontSize: 14 }}>جارٍ تحميل السؤال…</div>
      )}

      {/* Answer input — only for challenged player */}
      {isChallengedPlayer && questionText && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <textarea
            value={answerText}
            onChange={(e) => setAnswerText(e.target.value)}
            placeholder="اكتب إجابتك هنا…"
            rows={3}
            autoComplete="off"
            inputMode="text"
            style={{
              width: '100%', padding: '12px 14px',
              background: 'rgba(255,255,255,0.08)',
              border: '1.5px solid rgba(155,89,182,0.5)',
              borderRadius: 12, color: 'white', fontSize: 15,
              fontFamily: 'var(--font-cairo, Cairo), sans-serif',
              resize: 'none', outline: 'none', direction: 'rtl',
              boxSizing: 'border-box',
              userSelect: 'text', WebkitUserSelect: 'text', touchAction: 'manipulation',
            }}
            onFocus={(e) => { e.target.style.borderColor = '#9B59B6'; }}
            onBlur={(e) => { e.target.style.borderColor = 'rgba(155,89,182,0.5)'; }}
          />
          <button
            onClick={submitAnswer}
            disabled={isActionPending || !answerText.trim()}
            style={{
              background: answerText.trim()
                ? 'linear-gradient(135deg, #9B59B6, #E91E8C)'
                : 'rgba(155,89,182,0.2)',
              border: 'none', borderRadius: 12,
              padding: '13px 20px', color: 'white',
              fontSize: 15, fontWeight: 700, cursor: 'pointer',
              transition: 'all 200ms', opacity: isActionPending ? 0.7 : 1,
            }}
          >
            {isActionPending
              ? <span className="wof-loading-dots" style={{ filter: 'brightness(2)' }}><span /><span /><span /></span>
              : '✅ أرسل الإجابة'}
          </button>
        </div>
      )}

      {/* Waiting message for challenger */}
      {!isChallengedPlayer && (
        <div
          style={{
            background: 'rgba(155,89,182,0.15)',
            border: '1px dashed rgba(155,89,182,0.4)',
            borderRadius: 12, padding: '12px 16px',
            textAlign: 'center',
          }}
        >
          <span className="wof-loading-dots" style={{ margin: '0 auto' }}><span /><span /><span /></span>
          <p style={{ fontSize: 13, color: '#C39BD3', margin: '6px 0 0' }}>
            {partnerName} يكتب…
          </p>
        </div>
      )}
    </div>
  );
}
