// UX-031: زائر الرابط المباشر /room/CODE بدون هوية لاعب كاملة يرى شاشة
// إدخال الاسم داخل الغرفة بدلًا من الطرد إلى الصفحة الرئيسية.
'use client';
import { useState } from 'react';
import { api, getOrCreatePlayerId } from '@/lib/api';
import { useGameStore } from '@/store/useGameStore';

export default function RoomJoinScreen({ code }: { code: string }) {
  const { setPlayer, setRoom } = useGameStore();
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setError('الاسم قصير جدًا — اكتب اسمًا من حرفين على الأقل');
      return;
    }
    setBusy(true);
    setError(null);
    const pid = getOrCreatePlayerId();
    const res = await api.joinRoom(code, pid, trimmed);
    setBusy(false);
    if (res.error || !res.data) {
      // UX-031: لا فشل صامت — رسالة صريحة قابلة للمحاولة مجددًا
      setError(res.error || 'فشل الانضمام — الغرفة قد تكون ممتلئة أو غير موجودة');
      return;
    }
    // إنشاء هوية لاعب كاملة في المتجر
    const isPlayer1 = res.data.role === 'player1';
    setPlayer({ id: pid, name: trimmed, role: isPlayer1 ? 'player1' : 'player2' });
    const roomData = res.data.room as {
      id?: string | number; code?: string;
      player1Id?: string; player1Name?: string;
      player2Id?: string; player2Name?: string;
      status?: string;
    } | undefined;
    if (roomData) {
      setRoom({
        id: Number(roomData.id ?? 0),
        code: roomData.code ?? code,
        player1Id: roomData.player1Id ?? '',
        player1Name: roomData.player1Name ?? '',
        player2Id: roomData.player2Id ?? null,
        player2Name: roomData.player2Name ?? null,
        status: roomData.status ?? 'waiting',
      });
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: 'var(--wof-bg)', padding: 24,
      }}
    >
      <div
        style={{
          background: 'var(--wof-card, #ffffff)', borderRadius: 24, padding: 32,
          maxWidth: 400, width: '100%', textAlign: 'center',
          boxShadow: '0 8px 40px rgba(0,0,0,0.12)', direction: 'rtl',
        }}
      >
        <div style={{ fontSize: 44, marginBottom: 8 }}>🚪</div>
        <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>
          غرفة «{code}» تنتظرك!
        </h1>
        <p style={{ fontSize: 15, opacity: 0.7, marginBottom: 24 }}>
          ما اسمك في اللعبة؟
        </p>
        <input
          type="text"
          value={name}
          maxLength={20}
          dir="rtl"
          placeholder="اكتب اسمك هنا"
          autoFocus
          onKeyDown={(e) => { if (e.key === 'Enter' && !busy) submit(); }}
          onChange={(e) => setName(e.target.value)}
          style={{
            width: '100%', padding: '12px 16px', fontSize: 16, borderRadius: 14,
            border: '2px solid var(--wof-border, #eee)', outline: 'none',
            background: 'var(--wof-input-bg, #fafafa)', textAlign: 'right',
            boxSizing: 'border-box',
          }}
        />
        {error && (
          <p style={{ color: '#d33', fontSize: 13, marginTop: 12, marginBottom: 4 }}>
            ⚠️ {error}
          </p>
        )}
        <button
          onClick={submit}
          disabled={busy}
          style={{
            marginTop: 16, width: '100%', padding: '14px 0', fontSize: 17,
            fontWeight: 800, color: '#fff', borderRadius: 14, border: 'none',
            background: busy ? '#999' : 'var(--wof-accent, #ff4d8d)',
            cursor: busy ? 'wait' : 'pointer',
          }}
        >
          {busy ? 'جارٍ الانضمام…' : '🚪 انضم للغرفة'}
        </button>
      </div>
    </div>
  );
}
