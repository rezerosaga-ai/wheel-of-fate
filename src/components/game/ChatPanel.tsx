'use client';
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { api } from '@/lib/api';

// Quick emoji reactions bar
const QUICK_EMOJIS = ['❤️', '😂', '🔥', '🥹', '😍', '👏'];

interface ChatPanelProps {
  roomCode: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function ChatPanel({ roomCode, isOpen, onClose }: ChatPanelProps) {
  const { player, messages } = useGameStore();
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);
  // نتجنب auto-focus لمنع تراقص لوحة المفاتيح على الجوال
  const didOpen   = useRef(false);

  // Scroll to bottom on new messages — بدون focus
  useEffect(() => {
    if (isOpen) {
      const t = setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'auto', block: 'end' });
      }, 100);
      return () => clearTimeout(t);
    }
  }, [messages, isOpen]);

  // عند فتح الدردشة: نتأخر بما يكفي حتى تنتهي الـ layout animation
  // ثم نمنح focus مرة واحدة فقط (ليس في كل re-render)
  useEffect(() => {
    if (isOpen && !didOpen.current) {
      didOpen.current = true;
      // لا نُشغّل focus تلقائياً على الموبايل — اللاعب يضغط بنفسه
    }
    if (!isOpen) {
      didOpen.current = false;
    }
  }, [isOpen]);

  // B-FIX: لا نجاح صامت — خطأ الإرسال يُعرض صراحة داخل اللوحة (UX-BH03)
  const [sendError, setSendError] = useState<string | null>(null);
  const send = useCallback(async (content = text) => {
    const trimmed = content.trim();
    if (!trimmed || !player || sending) return;
    setSending(true);
    setSendError(null);
    const res = await api.sendChat(roomCode, player.id, player.name, trimmed);
    setSending(false);
    if (res.error) {
      setSendError(res.error);
      // إخفاء التنبيه بعد 4 ثوانٍ
      setTimeout(() => setSendError((e) => (e === res.error ? null : e)), 4000);
      return;
    }
    setText('');
  }, [text, player, sending, roomCode]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send(); }
  };

  if (!isOpen) return null;

  // Group consecutive messages from same sender
  type MessageItem = typeof messages[0];
  type Group = { senderId: string; senderName: string; msgs: MessageItem[]; isMe: boolean };
  const groups: Group[] = [];
  messages.forEach((msg) => {
    const isMe = msg.playerId === player?.id;
    const last = groups[groups.length - 1];
    if (last && last.senderId === msg.playerId) {
      last.msgs.push(msg);
    } else {
      groups.push({ senderId: msg.playerId, senderName: msg.playerName, msgs: [msg], isMe });
    }
  });

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        display: 'flex', flexDirection: 'column',
        background: '#ECE5DD',
        direction: 'rtl',
      }}
    >
      {/* ── Header ────────────────────────────────────────────────────────────── */}
      <div
        style={{
          background: 'linear-gradient(135deg, #D96C83 0%, #E88FA0 100%)',
          padding: 'calc(env(safe-area-inset-top, 0px) + 10px) 16px 12px',
          display: 'flex', alignItems: 'center', gap: 12,
          boxShadow: '0 2px 12px rgba(217,108,131,0.35)',
          flexShrink: 0,
        }}
      >
        <button
          onClick={onClose}
          style={{
            background: 'rgba(255,255,255,0.2)', border: 'none',
            borderRadius: '50%', width: 40, height: 40,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', fontSize: 20, color: 'white',
            backdropFilter: 'blur(4px)',
            WebkitTapHighlightColor: 'transparent',
            touchAction: 'manipulation',
          }}
        >
          ←
        </button>

        <div
          style={{
            width: 42, height: 42, borderRadius: '50%',
            background: 'rgba(255,255,255,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, border: '2px solid rgba(255,255,255,0.5)',
          }}
        >
          💕
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 17, color: 'white', lineHeight: 1.2 }}>
            دردشة خاصة
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 2 }}>
            ✨ فضاؤكما الخاص
          </div>
        </div>
      </div>

      {/* ── Messages area ─────────────────────────────────────────────────────── */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          // نستخدم -webkit-overflow-scrolling للتمرير السلس على iOS
          WebkitOverflowScrolling: 'touch' as React.CSSProperties['WebkitOverflowScrolling'],
          padding: '12px 10px',
          display: 'flex', flexDirection: 'column', gap: 2,
        }}
      >
        {messages.length === 0 && (
          <div
            style={{
              margin: 'auto', textAlign: 'center',
              background: 'rgba(255,255,255,0.85)',
              borderRadius: 16, padding: '20px 28px',
              boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
            }}
          >
            <div style={{ fontSize: 40, marginBottom: 8 }}>💬</div>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#3D3035', margin: 0 }}>ابدأ المحادثة</p>
            <p style={{ fontSize: 13, color: '#888', margin: '4px 0 0' }}>شاركا لحظاتكما ❤️</p>
          </div>
        )}

        {groups.map((group, gi) => (
          <div
            key={gi}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: group.isMe ? 'flex-end' : 'flex-start',
              marginBottom: 6,
            }}
          >
            {!group.isMe && (
              <span style={{ fontSize: 12, fontWeight: 700, color: '#D96C83', marginBottom: 3, paddingRight: 10 }}>
                {group.senderName}
              </span>
            )}

            {group.msgs.map((msg, mi) => {
              const isLast = mi === group.msgs.length - 1;
              const isFirst = mi === 0;
              return (
                <div key={msg.id} style={{ maxWidth: '78%', marginBottom: isLast ? 1 : 2 }}>
                  <div
                    style={{
                      background: group.isMe
                        ? 'linear-gradient(135deg, #E88FA0 0%, #D96C83 100%)'
                        : 'white',
                      color: group.isMe ? 'white' : '#3D3035',
                      borderRadius: group.isMe
                        ? (isFirst ? '18px 4px 18px 18px' : (isLast ? '18px 4px 4px 18px' : '18px 4px 4px 18px'))
                        : (isFirst ? '4px 18px 18px 18px' : (isLast ? '4px 18px 18px 4px' : '4px 18px 18px 4px')),
                      padding: '10px 14px',
                      fontSize: 15, lineHeight: 1.55,
                      boxShadow: group.isMe
                        ? '0 2px 8px rgba(217,108,131,0.35)'
                        : '0 1px 4px rgba(0,0,0,0.1)',
                      wordBreak: 'break-word',
                    }}
                  >
                    {msg.content}
                    <span
                      style={{
                        fontSize: 11, opacity: 0.7, marginRight: 8,
                        float: 'left', marginTop: 3,
                        color: group.isMe ? 'rgba(255,255,255,0.85)' : '#888',
                      }}
                    >
                      {new Date(msg.createdAt).toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' })}
                      {group.isMe && ' ✓✓'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ))}

        <div ref={bottomRef} />
      </div>

      {/* ── Send error banner (B-FIX: no silent failures) ─────────────────────── */}
      {sendError && (
        <div
          style={{
            background: '#FDECEC', color: '#C0392B',
            padding: '8px 16px', fontSize: 13, fontWeight: 700,
            borderBottom: '1px solid rgba(192,57,43,0.2)',
            display: 'flex', alignItems: 'center', gap: 8,
            animation: 'wof-bounce-in 300ms ease both',
          }}
        >
          ⚠️ لم تصل الرسالة: {sendError} — جرّب مرة أخرى.
        </div>
      )}

      {/* ── Quick emoji bar ───────────────────────────────────────────────────── */}
      <div
        style={{
          background: 'rgba(255,255,255,0.95)',
          borderTop: '1px solid rgba(217,108,131,0.15)',
          padding: '8px 12px',
          display: 'flex', gap: 6, justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {QUICK_EMOJIS.map((em) => (
          <button
            key={em}
            onPointerDown={(e) => { e.preventDefault(); void send(em); }}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 22, padding: '6px 8px', borderRadius: 8,
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {em}
          </button>
        ))}
      </div>

      {/* ── Input row ─────────────────────────────────────────────────────────── */}
      <div
        style={{
          padding: '8px 10px',
          paddingBottom: 'calc(8px + env(safe-area-inset-bottom, 0px))',
          background: '#F0EBE8',
          display: 'flex', gap: 8, alignItems: 'center',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            flex: 1, display: 'flex', alignItems: 'center',
            background: 'white', borderRadius: 24,
            padding: '0 16px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
            border: '1.5px solid rgba(217,108,131,0.2)',
            minHeight: 46,
          }}
        >
          <input
            ref={inputRef}
            placeholder="اكتب رسالة…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKey}
            autoComplete="off"
            // لا نستخدم autoFocus — اللاعب يضغط بنفسه لتجنب تراقص لوحة المفاتيح
            inputMode="text"
            enterKeyHint="send"
            style={{
              flex: 1, border: 'none', outline: 'none',
              fontSize: 15, background: 'transparent',
              fontFamily: 'var(--font-cairo, Cairo), sans-serif',
              color: '#3D3035', direction: 'rtl',
              userSelect: 'text',
              WebkitUserSelect: 'text',
              touchAction: 'manipulation',
            }}
          />
        </div>

        <button
          onPointerDown={(e) => {
            // نستخدم pointerDown لمنع blur على input أثناء الإرسال
            e.preventDefault();
            void send();
          }}
          disabled={sending || !text.trim()}
          style={{
            width: 46, height: 46, borderRadius: '50%', border: 'none',
            cursor: text.trim() ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, flexShrink: 0,
            background: text.trim()
              ? 'linear-gradient(135deg, #E88FA0, #D96C83)'
              : 'rgba(217,108,131,0.2)',
            boxShadow: text.trim() ? '0 3px 12px rgba(217,108,131,0.4)' : 'none',
            transition: 'all 200ms',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          {sending ? '⋯' : '🕊️'}
        </button>
      </div>
    </div>
  );
}
