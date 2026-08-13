'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signIn } from 'next-auth/react';
import { api, getOrCreatePlayerId } from '@/lib/api';
import { useGameStore } from '@/store/useGameStore';
import {
  getPlayerStats, loadStatsFromDB, ACHIEVEMENT_META,
  type PlayerStats,
} from '@/lib/player-stats';

const DEFAULT_NAMES = ['عبدو', 'أنفال'];

// ─── Session moods (ميزة onboarding مستوحاة من Desire + Lovify) ────────────────
const SESSION_MOODS = [
  { id: 'romantic',  emoji: '🌹', label: 'رومانسية',     desc: 'أسئلة الحب والمشاعر' },
  { id: 'deep',      emoji: '🧠', label: 'عميقة',        desc: 'نكتشف أعماق بعض' },
  { id: 'fun',       emoji: '😂', label: 'مرحة وخفيفة',  desc: 'ضحك وتحديات' },
  { id: 'bold',      emoji: '🔥', label: 'جريئة',        desc: 'أسئلة لا تُنسى' },
  { id: 'future',    emoji: '💭', label: 'عن المستقبل',  desc: 'أحلام ومشاريع' },
  { id: 'surprise',  emoji: '🎲', label: 'مفاجأة',       desc: 'اتركها للعجلة!' },
];

/* ─── Kawaii Background ─────────────────────────────────────────────────────── */
function KawaiiBackground() {
  return (
    <div className="kawaii-bg" style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden' }}>
      {['🌸', '✨', '💕', '⭐', '🌷', '💫'].map((e, i) => (
        <div key={i} style={{
          position: 'absolute', fontSize: `${16 + i * 4}px`, opacity: 0.55,
          top: `${[8, 72, 22, 85, 45, 60][i]}%`,
          left: `${[5, 82, 52, 18, 90, 42][i]}%`,
          animation: `wof-float ${2.5 + i * 0.4}s ease-in-out infinite`,
          animationDelay: `${i * 0.35}s`, pointerEvents: 'none', zIndex: 1,
        }}>{e}</div>
      ))}
    </div>
  );
}

/* ─── Streak chip ─────────────────────────────────────────────────────────── */
function StreakChip({ stats }: { stats: PlayerStats }) {
  if (stats.totalSessions === 0) return null;
  return (
    <div style={{
      display: 'flex', gap: 10, justifyContent: 'center',
      flexWrap: 'wrap', marginBottom: 4,
    }}>
      {stats.currentStreak > 0 && (
        <div style={{
          background: 'linear-gradient(135deg,rgba(255,165,0,0.15),rgba(255,120,50,0.1))',
          border: '1.5px solid rgba(255,140,0,0.35)', borderRadius: 999,
          padding: '5px 14px', fontSize: 13, fontWeight: 700,
          color: '#E08000', display: 'flex', alignItems: 'center', gap: 5,
        }}>
          🔥 {stats.currentStreak} {stats.currentStreak === 1 ? 'يوم' : 'أيام'} متتالية
        </div>
      )}
      <div style={{
        background: 'rgba(232,143,160,0.1)', border: '1.5px solid rgba(232,143,160,0.3)',
        borderRadius: 999, padding: '5px 14px', fontSize: 13, fontWeight: 700,
        color: 'var(--wof-accent)', display: 'flex', alignItems: 'center', gap: 5,
      }}>
        🎡 {stats.totalSessions} جلسة
      </div>
    </div>
  );
}

/* ─── Main Home Screen ────────────────────────────────────────────────────── */
export default function HomeScreen() {
  const router = useRouter();
  const { data: session } = useSession();
  const { setPlayer, setRoom, player } = useGameStore();

  const [screen, setScreen] = useState<'home' | 'create' | 'join'>('home');
  const [playerName, setPlayerName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedMood, setSelectedMood] = useState<string>('surprise');
  const [stats, setStats] = useState<PlayerStats>(() => getPlayerStats());

  useEffect(() => {
    if (player?.name) setPlayerName(player.name);
    // تحميل الإحصاءات من DB (مع fallback محلي)
    const playerId = getOrCreatePlayerId();
    if (playerId) {
      loadStatsFromDB(playerId).then(setStats);
    } else {
      setStats(getPlayerStats());
    }
  }, [player]);

  const handleCreate = async () => {
    if (!playerName.trim()) { setError('أدخل اسمك أولاً ❤️'); return; }
    setLoading(true); setError('');
    const playerId = getOrCreatePlayerId();
    const res = await api.createRoom(playerId, playerName.trim());
    setLoading(false);
    if (res.error) { setError(res.error); return; }
    const { room, code } = res.data!;
    // حفظ المزاج المختار في localStorage لاستخدامه لاحقاً في الجلسة
    try { localStorage.setItem('wof-session-mood', selectedMood); } catch { /* */ }
    setPlayer({ id: playerId, name: playerName.trim(), role: 'player1' });
    setRoom(room as Parameters<typeof setRoom>[0]);
    router.push(`/room/${code}`);
  };

  const handleJoin = async () => {
    if (!playerName.trim()) { setError('أدخل اسمك أولاً ❤️'); return; }
    if (!joinCode.trim() || joinCode.length < 6) { setError('أدخل رمز الغرفة كاملاً'); return; }
    setLoading(true); setError('');
    const playerId = getOrCreatePlayerId();
    const res = await api.joinRoom(joinCode.trim().toUpperCase(), playerId, playerName.trim());
    setLoading(false);
    if (res.error) {
      if (res.error.includes('not found')) setError('الرمز غير صحيح 🥺');
      else if (res.error.includes('full')) setError('الغرفة ممتلئة');
      else setError(res.error);
      return;
    }
    const { room, role } = res.data!;
    setPlayer({ id: playerId, name: playerName.trim(), role: role as 'player1' | 'player2' });
    setRoom(room as Parameters<typeof setRoom>[0]);
    router.push(`/room/${joinCode.trim().toUpperCase()}`);
  };

  /* ── Create screen — مع Onboarding اختيار المزاج ── */
  if (screen === 'create') {
    return (
      <div className="wof-screen wof-safe-top" style={{ overflow: 'hidden' }}>
        <KawaiiBackground />
        <div className="wof-animate-in" style={{
          position: 'relative', zIndex: 2,
          display: 'flex', flexDirection: 'column',
          height: '100%', padding: '16px 20px 28px',
          overflowY: 'auto',
        }}>
          <button className="kawaii-back-btn" onClick={() => { setScreen('home'); setError(''); }}>←</button>

          <div className="kawaii-window" style={{ marginTop: 12, flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div className="kawaii-window-dots">
              <div className="kawaii-window-dot" style={{ background: 'var(--kawaii-dot-yellow)' }} />
              <div className="kawaii-window-dot" style={{ background: 'var(--kawaii-dot-green)' }} />
              <div className="kawaii-window-dot" style={{ background: 'var(--kawaii-dot-pink)' }} />
            </div>

            <div className="kawaii-window-inner" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 48, lineHeight: 1, marginBottom: 8 }}>🎡</div>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: '#FF4D8D', marginBottom: 4 }}>غرفة جديدة</h2>
                <p style={{ fontSize: 12, color: 'var(--wof-text-secondary)', lineHeight: 1.5 }}>
                  أدخل اسمك، اختر مزاج الجلسة، وأرسل الرمز لشريكك 💕
                </p>
              </div>

              {/* Name */}
              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: '#FF6FA3', display: 'block', marginBottom: 6, textAlign: 'right' }}>
                  ✏️ اسمك في اللعبة
                </label>
                <input
                  className="kawaii-input"
                  placeholder="مثال: عبدو"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  maxLength={20}
                  style={{ textAlign: 'right' }}
                  autoFocus
                />
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 8 }}>
                  {DEFAULT_NAMES.map((name) => (
                    <button key={name} className={`kawaii-name-chip${playerName === name ? ' active' : ''}`}
                      onClick={() => setPlayerName(name)}>{name}</button>
                  ))}
                </div>
              </div>

              {/* ─── Mood Selector — الميزة الجديدة ─────────────────────────── */}
              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: '#FF6FA3', display: 'block', marginBottom: 8, textAlign: 'right' }}>
                  🎭 ما مزاج جلستكم الليلة؟
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {SESSION_MOODS.map((mood) => (
                    <button
                      key={mood.id}
                      onClick={() => setSelectedMood(mood.id)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: 16,
                        border: `2px solid ${selectedMood === mood.id ? '#FF6FA3' : 'rgba(232,143,160,0.3)'}`,
                        background: selectedMood === mood.id
                          ? 'linear-gradient(135deg,rgba(255,111,163,0.12),rgba(255,77,141,0.07))'
                          : 'white',
                        cursor: 'pointer',
                        textAlign: 'right',
                        transition: 'all 180ms cubic-bezier(0.34,1.56,0.64,1)',
                        transform: selectedMood === mood.id ? 'scale(1.04)' : 'scale(1)',
                        boxShadow: selectedMood === mood.id
                          ? '0 4px 16px rgba(255,77,141,0.2)'
                          : '0 1px 4px rgba(0,0,0,0.04)',
                      }}
                    >
                      <div style={{ fontSize: 22, marginBottom: 2 }}>{mood.emoji}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: selectedMood === mood.id ? '#FF4D8D' : 'var(--wof-text)' }}>
                        {mood.label}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--wof-text-secondary)', marginTop: 2 }}>
                        {mood.desc}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {error && <div className="kawaii-error">⚠️ {error}</div>}

              <button
                className="kawaii-btn"
                onClick={handleCreate}
                disabled={loading || !playerName.trim()}
                style={{ marginTop: 'auto' }}
              >
                {loading
                  ? <span className="wof-loading-dots"><span /><span /><span /></span>
                  : `${SESSION_MOODS.find(m => m.id === selectedMood)?.emoji ?? '✨'} إنشاء الغرفة`}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── Join screen ── */
  if (screen === 'join') {
    return (
      <div className="wof-screen wof-safe-top" style={{ overflow: 'hidden' }}>
        <KawaiiBackground />
        <div className="wof-animate-in" style={{
          position: 'relative', zIndex: 2,
          display: 'flex', flexDirection: 'column',
          height: '100%', padding: '20px 20px 32px',
        }}>
          <button className="kawaii-back-btn" onClick={() => { setScreen('home'); setError(''); }}>←</button>

          <div className="kawaii-window" style={{ flex: 1, marginTop: 16, display: 'flex', flexDirection: 'column' }}>
            <div className="kawaii-window-dots">
              <div className="kawaii-window-dot" style={{ background: 'var(--kawaii-dot-yellow)' }} />
              <div className="kawaii-window-dot" style={{ background: 'var(--kawaii-dot-green)' }} />
              <div className="kawaii-window-dot" style={{ background: 'var(--kawaii-dot-pink)' }} />
            </div>

            <div className="kawaii-window-inner" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 52, lineHeight: 1, marginBottom: 10 }}>🚪</div>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: '#FF4D8D', marginBottom: 6 }}>الانضمام</h2>
                <p style={{ fontSize: 13, color: 'var(--wof-text-secondary)', lineHeight: 1.6 }}>
                  أدخل الرمز الذي أرسله لك شريكك ❤️
                </p>
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: '#FF6FA3', display: 'block', marginBottom: 8, textAlign: 'right' }}>
                  ✏️ اسمك في اللعبة
                </label>
                <input
                  className="kawaii-input"
                  placeholder="مثال: أنفال"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  maxLength={20}
                  style={{ textAlign: 'right' }}
                />
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 8 }}>
                  {DEFAULT_NAMES.map((name) => (
                    <button key={name} className={`kawaii-name-chip${playerName === name ? ' active' : ''}`}
                      onClick={() => setPlayerName(name)}>{name}</button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: '#FF6FA3', display: 'block', marginBottom: 8, textAlign: 'right' }}>
                  🔑 رمز الغرفة
                </label>
                <input
                  className="kawaii-input"
                  placeholder="X X X X X X"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
                  maxLength={6}
                  autoCapitalize="characters"
                  style={{ letterSpacing: 6, fontWeight: 900 }}
                />
              </div>

              {error && <div className="kawaii-error">⚠️ {error}</div>}

              <button
                className="kawaii-btn"
                onClick={handleJoin}
                disabled={loading || !playerName.trim() || joinCode.length < 6}
                style={{ marginTop: 'auto' }}
              >
                {loading
                  ? <span className="wof-loading-dots"><span /><span /><span /></span>
                  : 'دخول ❤️'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── Landing screen ── */
  return (
    <div className="wof-screen wof-safe-top" style={{ overflow: 'hidden' }}>
      <KawaiiBackground />
      <div className="wof-animate-in" style={{
        position: 'relative', zIndex: 2,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        height: '100%', padding: '32px 24px', gap: 0,
      }}>
        {/* Stats streak bar */}
        <StreakChip stats={stats} />

        {/* Main card */}
        <div className="kawaii-window" style={{ width: '100%', maxWidth: 360, marginTop: stats.totalSessions > 0 ? 12 : 0 }}>
          <div className="kawaii-window-dots">
            <div className="kawaii-window-dot" style={{ background: 'var(--kawaii-dot-yellow)' }} />
            <div className="kawaii-window-dot" style={{ background: 'var(--kawaii-dot-green)' }} />
            <div className="kawaii-window-dot" style={{ background: 'var(--kawaii-dot-pink)' }} />
          </div>

          <div className="kawaii-window-inner" style={{ textAlign: 'center' }}>
            <div className="wof-float" style={{ fontSize: 72, lineHeight: 1, marginBottom: 4 }}>🎡</div>
            <h1 style={{ fontSize: 26, fontWeight: 900, color: '#FF4D8D', marginBottom: 6, letterSpacing: 0.5 }}>
              Wheel of Fate
            </h1>
            <div style={{ fontSize: 13, color: 'var(--wof-text-secondary)', lineHeight: 1.7, marginBottom: 24, maxWidth: 260, margin: '0 auto 20px' }}>
              لعبة صغيرة لشخصين...<br />
              لكن أسئلتها قد تفتح أشياء كبيرة ❤️
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button className="kawaii-btn" onClick={() => setScreen('create')}>
                🎡 ابدأ لعبة جديدة
              </button>
              <button className="kawaii-btn kawaii-btn-outline" onClick={() => setScreen('join')}>
                🚪 انضم إلى غرفة
              </button>
            </div>
          </div>
        </div>

        {/* Achievements badges (if any) */}
        {stats.achievements.length > 0 && (
          <div style={{
            marginTop: 16, display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap',
            maxWidth: 360,
          }}>
            {stats.achievements.slice(-3).map((a) => {
              const meta = ACHIEVEMENT_META[a];
              if (!meta) return null;
              return (
                <div key={a} title={meta.label} style={{
                  background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(8px)',
                  borderRadius: 999, padding: '5px 12px',
                  border: '1.5px solid rgba(232,143,160,0.35)',
                  fontSize: 12, fontWeight: 700, color: 'var(--wof-text)',
                  display: 'flex', alignItems: 'center', gap: 4,
                }}>
                  {meta.emoji} {meta.label}
                </div>
              );
            })}
          </div>
        )}

        <div style={{
          marginTop: 16, background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(8px)',
          borderRadius: 999, padding: '8px 20px',
          border: '1.5px solid rgba(232,143,160,0.35)',
          fontSize: 14, fontWeight: 800, color: '#FF4D8D', letterSpacing: 1,
        }}>
          عبدو × أنفال ❤️
        </div>

        {/* Google Auth button */}
        {!session ? (
          <button
            onClick={() => void signIn('google')}
            style={{
              marginTop: 14,
              background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(8px)',
              border: '1.5px solid rgba(232,143,160,0.35)',
              borderRadius: 999, padding: '8px 20px',
              fontSize: 13, fontWeight: 700, color: 'var(--wof-text)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
              transition: 'all 180ms',
            }}
          >
            🔗 اربط بـ Google لحفظ تقدمك
          </button>
        ) : (
          <div style={{
            marginTop: 14,
            background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(8px)',
            border: '1.5px solid rgba(120,200,150,0.4)',
            borderRadius: 999, padding: '7px 18px',
            fontSize: 12, fontWeight: 700, color: '#3a8a5a',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            ✅ {session.user?.name ?? 'مسجّل'}
          </div>
        )}

        {/* Privacy + Terms links */}
        <div style={{
          marginTop: 10, display: 'flex', gap: 16, justifyContent: 'center',
          fontSize: 11, color: 'rgba(100,60,80,0.55)',
        }}>
          <a href="/privacy" style={{ color: 'inherit', textDecoration: 'underline' }}>سياسة الخصوصية</a>
          <span>·</span>
          <a href="/terms" style={{ color: 'inherit', textDecoration: 'underline' }}>شروط الاستخدام</a>
        </div>
      </div>
    </div>
  );
}
