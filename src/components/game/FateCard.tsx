'use client';
import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useGameStore } from '@/store/useGameStore';
import { FATE_CARDS, type FateCard as FateCardType } from '@/lib/questions';

interface FateCardProps {
  roomCode: string;
  pendingSpinResult?: string | null;  // JSON stringified FateCard
  secretMsg1: string | null;
  secretMsg2: string | null;
  secretMsgRevealed: boolean;
  isPlayer1: boolean;
  player1Name: string;
  player2Name: string;
  phase: string;
}

// Colour map for types
const TYPE_COLORS: Record<string, string> = {
  romantic:    '#F4A8B8',
  funny:       '#F9D080',
  deep:        '#A8C5E8',
  confession:  '#E8B8C1',
  letter:      '#F9C8D3',
  future:      '#B8D8C8',
  challenge:   '#F9D08A',
  secret_msg:  '#F4A8B8',
};

const TYPE_LABELS: Record<string, string> = {
  romantic:   'رومانسي ❤️',
  funny:      'مضحك 😂',
  deep:       'عميق 🧠',
  confession: 'اعتراف 🫣',
  letter:     'رسالة 💌',
  future:     'مستقبل 🔮',
  challenge:  'تحدي 🎭',
  secret_msg: 'رسالة سرية 📩',
};

export default function FateCard({
  roomCode,
  pendingSpinResult,
  secretMsg1,
  secretMsg2,
  secretMsgRevealed,
  isPlayer1,
  player1Name,
  player2Name,
  phase,
}: FateCardProps) {
  const { player, isActionPending, setActionPending, setActionError } = useGameStore();

  // Parse card data from pendingSpinResult or fallback to secret_msg
  const card: FateCardType | null = (() => {
    if (pendingSpinResult) {
      try {
        const sp = JSON.parse(pendingSpinResult) as { value?: string; id?: number };
        const id = sp.id ?? parseInt(sp.value ?? '', 10);
        if (!isNaN(id)) {
          return FATE_CARDS.find((c) => c.id === id) ?? null;
        }
      } catch { /* ignore */ }
    }
    return null;
  })();

  const isSecretMsg = !card || card.type === 'secret_msg';
  const cardColor = card?.color ?? TYPE_COLORS.secret_msg;

  // Secret message state
  const [myMessage, setMyMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const myMsg = isPlayer1 ? secretMsg1 : secretMsg2;
  const partnerMsg = isPlayer1 ? secretMsg2 : secretMsg1;
  const myName = isPlayer1 ? player1Name : player2Name;
  const partnerName = isPlayer1 ? player2Name : player1Name;

  const submitMessage = async () => {
    if (!myMessage.trim()) return;
    setSaving(true);
    const res = await api.sendAction(roomCode, {
      type: 'submit_secret_msg',
      playerId: player?.id,
      message: myMessage.trim(),
      isPlayer1,
    });
    setSaving(false);
    if (res.error) setActionError(res.error);
  };

  const revealMessages = async () => {
    setActionPending(true);
    const res = await api.sendAction(roomCode, { type: 'reveal_secret', playerId: player?.id });
    setActionPending(false);
    if (res.error) setActionError(res.error);
  };

  const skipCard = async () => {
    setActionPending(true);
    const res = await api.sendAction(roomCode, { type: 'skip_fate_card', playerId: player?.id });
    setActionPending(false);
    if (res.error) setActionError(res.error);
  };

  return (
    <div className="wof-animate-in" style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '0 4px' }}>
      {/* ─── بطاقة القدر Header ────────────────────────────────────────────────── */}
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: `${cardColor}33`,
            border: `1.5px solid ${cardColor}`,
            borderRadius: 'var(--wof-radius-full)',
            padding: '4px 14px',
            fontSize: 12,
            fontWeight: 700,
            color: 'var(--wof-text-secondary)',
            marginBottom: 10,
          }}
        >
          🃏 بطاقة القدر
          {card && (
            <span style={{ color: 'var(--wof-text)' }}>— {TYPE_LABELS[card.type] ?? card.type}</span>
          )}
        </div>
      </div>

      {/* ─── Card body ──────────────────────────────────────────────────────────── */}
      <div
        style={{
          background: `linear-gradient(135deg, ${cardColor}22, white)`,
          border: `2px solid ${cardColor}`,
          borderRadius: 'var(--wof-radius-xl)',
          padding: '24px 20px',
          textAlign: 'center',
          boxShadow: `0 4px 20px ${cardColor}44`,
        }}
      >
        <div style={{ fontSize: 52, lineHeight: 1, marginBottom: 12 }}>
          {card?.icon ?? '📩'}
        </div>
        {card?.title && (
          <h3
            className="wof-title"
            style={{ fontSize: 18, marginBottom: 10, color: 'var(--wof-text)' }}
          >
            {card.title}
          </h3>
        )}
        <p
          style={{
            fontSize: 15,
            fontWeight: 500,
            lineHeight: 1.75,
            color: 'var(--wof-text)',
            margin: 0,
          }}
        >
          {card?.text ?? 'كلٌّ منكما يكتب رسالة قصيرة للآخر، ثم تُكشف في نفس الوقت.'}
        </p>
      </div>

      {/* ─── Secret Message Interaction ─────────────────────────────────────────── */}
      {isSecretMsg && (
        <SecretMessageSection
          myMsg={myMsg}
          partnerMsg={partnerMsg}
          myMessage={myMessage}
          setMyMessage={setMyMessage}
          saving={saving}
          myName={myName}
          partnerName={partnerName}
          secretMsgRevealed={secretMsgRevealed}
          onSubmit={submitMessage}
          onReveal={revealMessages}
          onSkip={skipCard}
          isActionPending={isActionPending}
        />
      )}

      {/* ─── Non-secret card: just a "done" button ──────────────────────────────── */}
      {!isSecretMsg && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <p
            style={{
              fontSize: 13,
              color: 'var(--wof-text-secondary)',
              textAlign: 'center',
              fontWeight: 500,
              lineHeight: 1.6,
            }}
          >
            أنجزا التحدي معاً، ثم تابعا اللعبة ❤️
          </p>
          <button
            className="wof-btn wof-btn-primary wof-btn-full"
            onClick={skipCard}
            disabled={isActionPending}
          >
            {isActionPending
              ? <span className="wof-loading-dots"><span /><span /><span /></span>
              : 'أنجزنا التحدي ✅ — متابعة'}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Secret Message Sub-Component ────────────────────────────────────────────
interface SecretProps {
  myMsg: string | null;
  partnerMsg: string | null;
  myMessage: string;
  setMyMessage: (v: string) => void;
  saving: boolean;
  myName: string;
  partnerName: string;
  secretMsgRevealed: boolean;
  onSubmit: () => void;
  onReveal: () => void;
  onSkip: () => void;
  isActionPending: boolean;
}

function SecretMessageSection({
  myMsg, partnerMsg, myMessage, setMyMessage, saving,
  myName, partnerName, secretMsgRevealed,
  onSubmit, onReveal, onSkip, isActionPending,
}: SecretProps) {
  if (secretMsgRevealed && myMsg && partnerMsg) {
    return (
      <div className="wof-animate-in" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <MessageBubble from={myName} text={myMsg} isMe />
        <MessageBubble from={partnerName} text={partnerMsg} isMe={false} />
        <button
          className="wof-btn wof-btn-primary wof-btn-full"
          onClick={onSkip}
          disabled={isActionPending}
          style={{ marginTop: 4 }}
        >
          {isActionPending
            ? <span className="wof-loading-dots"><span /><span /><span /></span>
            : 'متابعة اللعبة ▶'}
        </button>
      </div>
    );
  }

  if (myMsg) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div
          className="wof-card"
          style={{
            textAlign: 'center',
            background: 'var(--wof-primary-soft)',
            border: '2px dashed var(--wof-primary)',
          }}
        >
          <div style={{ fontSize: 28 }}>✅</div>
          <div style={{ fontWeight: 700, marginTop: 6, fontSize: 15 }}>أرسلت رسالتك!</div>
          <div style={{ fontSize: 13, color: 'var(--wof-text-secondary)', marginTop: 4 }}>
            {partnerMsg
              ? 'كلاكما جاهز — الكشف الآن!'
              : `في انتظار رسالة ${partnerName}…`}
          </div>
          {partnerMsg && !secretMsgRevealed && (
            <button
              className="wof-btn wof-btn-primary"
              onClick={onReveal}
              disabled={isActionPending}
              style={{ marginTop: 12, width: '100%' }}
            >
              ✨ اكشف الرسائل معاً
            </button>
          )}
        </div>
        <button
          onClick={onSkip}
          disabled={isActionPending}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 13, color: 'var(--wof-text-secondary)', textAlign: 'center',
            fontWeight: 600, padding: '4px',
          }}
        >
          تخطّي
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <label
        style={{
          fontSize: 13, fontWeight: 600,
          color: 'var(--wof-text-secondary)', display: 'block', marginBottom: 4,
        }}
      >
        {myName}: رسالتك السرية لـ {partnerName}
      </label>
      <textarea
        className="wof-input"
        rows={3}
        placeholder={`اكتب ما تريد أن يعرفه ${partnerName}…`}
        value={myMessage}
        onChange={(e) => setMyMessage(e.target.value)}
        style={{ resize: 'none', fontFamily: 'var(--wof-font)', fontSize: 15, textAlign: 'right', letterSpacing: 0 }}
      />
      <button
        className="wof-btn wof-btn-primary wof-btn-full"
        onClick={onSubmit}
        disabled={saving || !myMessage.trim()}
      >
        {saving
          ? <span className="wof-loading-dots"><span /><span /><span /></span>
          : '📩 إرسال الرسالة السرية'}
      </button>
      <button
        onClick={onSkip}
        disabled={isActionPending}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 13, color: 'var(--wof-text-secondary)', textAlign: 'center',
          fontWeight: 600, padding: '2px',
        }}
      >
        تخطّي هذه الجولة
      </button>
    </div>
  );
}

function MessageBubble({ from, text, isMe }: { from: string; text: string; isMe: boolean }) {
  return (
    <div
      className="wof-animate-in wof-card"
      style={{
        background: isMe ? 'var(--wof-primary-soft)' : 'white',
        border: `1.5px solid ${isMe ? 'var(--wof-primary)' : 'var(--wof-border)'}`,
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--wof-primary)', marginBottom: 6 }}>
        {isMe ? '💌 رسالتك' : `💌 من ${from}`}
      </div>
      <p style={{ fontSize: 15, fontWeight: 500, lineHeight: 1.65, margin: 0 }}>{text}</p>
    </div>
  );
}
