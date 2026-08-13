'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { useGameStore } from '@/store/useGameStore';
import { useRouter } from 'next/navigation';
import { recordSession, getPlayerStats, ACHIEVEMENT_META } from '@/lib/player-stats';
import type { PlayerStats } from '@/lib/player-stats';

interface SessionEndProps {
  roomCode: string;
  player1Name: string;
  player2Name: string;
  player1Score: number;
  player2Score: number;
  loveCounter: number;
  roundNumber: number;
}

type Step = 'results' | 'reflection' | 'analysis' | 'done';

/* ─── Share helper ────────────────────────────────────────────────────────── */
function buildShareText(
  p1: string, p2: string, s1: number, s2: number,
  love: number, rounds: number, mood: string,
): string {
  const moodEmoji: Record<string, string> = {
    romantic: '🌹', deep: '🧠', fun: '😂', bold: '🔥', future: '💭', surprise: '🎲',
  };
  const winner = s1 > s2 ? p1 : s2 > s1 ? p2 : null;
  const lines = [
    `${moodEmoji[mood] ?? '🎡'} Wheel of Fate — جلسة ${rounds} جولة`,
    ``,
    `👫 ${p1} × ${p2}`,
    `🏆 ${p1}: ${s1} نقطة  |  ${p2}: ${s2} نقطة`,
    `❤️  لحظات حب: ${love}`,
    winner ? `✨ تألّق ${winner} الليلة!` : `🤝 تعادل جميل بيننا!`,
    ``,
    `اشحن علاقتك مع Wheel of Fate 🎡`,
  ];
  return lines.join('\n');
}

async function shareResults(text: string): Promise<boolean> {
  if (navigator.share) {
    try {
      await navigator.share({ text, title: 'نتائج Wheel of Fate' });
      return true;
    } catch {
      /* user cancelled */
    }
  }
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/* ─── New Achievement Banner ─────────────────────────────────────────────── */
function NewAchievementBanner({ achievements }: { achievements: string[] }) {
  if (achievements.length === 0) return null;
  return (
    <div style={{
      background: 'linear-gradient(135deg,rgba(255,215,0,0.15),rgba(255,165,0,0.1))',
      border: '1.5px solid rgba(255,165,0,0.4)', borderRadius: 16,
      padding: '12px 16px',
      display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#B8860B', textAlign: 'right' }}>
        🏅 إنجازات جديدة مفتوحة!
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {achievements.map((a) => {
          const meta = ACHIEVEMENT_META[a];
          if (!meta) return null;
          return (
            <div key={a} style={{
              background: 'rgba(255,255,255,0.9)', borderRadius: 999,
              padding: '4px 12px', fontSize: 12, fontWeight: 700, color: 'var(--wof-text)',
              border: '1.5px solid rgba(255,165,0,0.35)',
              display: 'flex', alignItems: 'center', gap: 4,
            }}>
              {meta.emoji} {meta.label}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────────────────── */
export default function SessionEnd({
  roomCode,
  player1Name,
  player2Name,
  player1Score,
  player2Score,
  loveCounter,
  roundNumber,
}: SessionEndProps) {
  const { player } = useGameStore();
  const router = useRouter();

  const [step, setStep] = useState<Step>('results');
  const [reflection, setReflection] = useState('');
  const [saving, setSaving] = useState(false);
  const [analysis, setAnalysis] = useState('');
  const [shareText, setShareText] = useState('');
  const [copied, setCopied] = useState(false);
  const [newAchievements, setNewAchievements] = useState<string[]>([]);
  const [sessionMood, setSessionMood] = useState('surprise');
  const [statsAfter, setStatsAfter] = useState<PlayerStats | null>(null);

  const isPlayer1 = player?.role === 'player1';
  const myName = isPlayer1 ? player1Name : player2Name;
  const partnerName = isPlayer1 ? player2Name : player1Name;

  // ── تسجيل الجلسة ومعالجة الإنجازات عند أول تحميل ───────────────────────
  useEffect(() => {
    const mood = typeof window !== 'undefined'
      ? (localStorage.getItem('wof-session-mood') ?? 'surprise')
      : 'surprise';
    setSessionMood(mood);

    const before = getPlayerStats();
    const after = recordSession(loveCounter);
    setStatsAfter(after);

    const earned = after.achievements.filter((a) => !before.achievements.includes(a));
    setNewAchievements(earned);

    const text = buildShareText(player1Name, player2Name, player1Score, player2Score, loveCounter, roundNumber, mood);
    setShareText(text);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleShare = useCallback(async () => {
    const ok = await shareResults(shareText);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }, [shareText]);

  const saveReflection = async () => {
    if (!reflection.trim()) return;
    setSaving(true);
    const res = await api.saveReflection(roomCode, player?.id ?? '', reflection.trim());
    setSaving(false);
    if (!res.error && res.data?.analysis) {
      setAnalysis(res.data.analysis as string);
      setStep('analysis');
    } else {
      setStep('done');
    }
  };

  // ─── Step 1: نتائج الجلسة ────────────────────────────────────────────────
  if (step === 'results') {
    const winner =
      player1Score > player2Score ? player1Name
      : player2Score > player1Score ? player2Name
      : null;

    const moodEmoji: Record<string, string> = {
      romantic: '🌹', deep: '🧠', fun: '😂', bold: '🔥', future: '💭', surprise: '🎲',
    };

    return (
      <div className="wof-screen wof-safe-top" style={{ justifyContent: 'flex-start', padding: '24px 20px 40px', overflowY: 'auto' }}>
        <div className="wof-animate-in" style={{ width: '100%', maxWidth: 400, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Header */}
          <div style={{ textAlign: 'center' }}>
            <div className="wof-float" style={{ fontSize: 64 }}>🎡</div>
            <h2 className="wof-title" style={{ fontSize: 22, marginTop: 8 }}>انتهت الجلسة!</h2>
            <p className="wof-body" style={{ fontSize: 13, marginTop: 4 }}>
              {moodEmoji[sessionMood] ?? '✨'} {roundNumber} جولة من التقارب والصدق
            </p>
          </div>

          {/* Scores card */}
          <div className="wof-card" style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '20px 16px' }}>
            <ScoreColumn name={player1Name} score={player1Score} isWinner={winner === player1Name} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--wof-text-secondary)', marginBottom: 4 }}>❤️ لحظات</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--wof-primary)' }}>{loveCounter}</div>
            </div>
            <ScoreColumn name={player2Name} score={player2Score} isWinner={winner === player2Name} />
          </div>

          {/* Winner / draw */}
          <div className="wof-card" style={{ textAlign: 'center', background: 'linear-gradient(135deg, var(--wof-primary-soft), white)', border: '1.5px solid var(--wof-secondary)' }}>
            {winner ? (
              <>
                <div style={{ fontSize: 32 }}>🏆</div>
                <div style={{ fontSize: 15, fontWeight: 700, marginTop: 6 }}>{winner} قدّم أعمق الإجابات!</div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 32 }}>🤝</div>
                <div style={{ fontSize: 15, fontWeight: 700, marginTop: 6 }}>تعادل جميل — كلاكما صادق!</div>
              </>
            )}
            <div style={{ fontSize: 12, color: 'var(--wof-text-secondary)', marginTop: 4 }}>
              الهدف لم يكن الفوز، بل التقارب ❤️
            </div>
          </div>

          {/* ─── لوحة إحصاء الجلسة ─────────────────────────────────────────── */}
          <div className="wof-card" style={{
            background: 'linear-gradient(135deg, rgba(164,200,232,0.12), rgba(232,143,160,0.08))',
            border: '1.5px solid rgba(164,200,232,0.3)',
            padding: '16px',
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--wof-text)', marginBottom: 12, textAlign: 'center' }}>
              📊 ملخص جلستكم
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { icon: '🎡', label: 'الجولات', value: roundNumber },
                { icon: '❤️', label: 'لحظات حب', value: loveCounter },
                { icon: '🏆', label: `نقاط ${player1Name.slice(0,6)}`, value: player1Score },
                { icon: '🏆', label: `نقاط ${player2Name.slice(0,6)}`, value: player2Score },
                { icon: '💫', label: 'مجموع النقاط', value: player1Score + player2Score },
                { icon: '📖', label: 'أسئلة أُجيبت', value: Math.max(roundNumber, 1) },
              ].map(({ icon, label, value }) => (
                <div key={label} style={{
                  background: 'rgba(255,255,255,0.7)',
                  borderRadius: 12,
                  padding: '10px 12px',
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: 18, marginBottom: 2 }}>{icon}</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--wof-text)' }}>{value}</div>
                  <div style={{ fontSize: 11, color: 'var(--wof-text-secondary)', fontWeight: 600 }}>{label}</div>
                </div>
              ))}
            </div>
            {/* Progress bar: love meter */}
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--wof-text-secondary)', marginBottom: 4, textAlign: 'center' }}>
                مستوى التقارب
              </div>
              <div style={{ height: 8, background: 'rgba(232,143,160,0.2)', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${Math.min(100, Math.round((loveCounter / Math.max(roundNumber, 1)) * 100))}%`,
                  background: 'linear-gradient(90deg, #F4A8B8, #E88FA0)',
                  borderRadius: 99,
                  transition: 'width 1s ease',
                }} />
              </div>
              <div style={{ fontSize: 10, color: 'var(--wof-text-secondary)', textAlign: 'left', marginTop: 2 }}>
                {Math.min(100, Math.round((loveCounter / Math.max(roundNumber, 1)) * 100))}% لحظات دافئة
              </div>
            </div>
          </div>

          {/* Streak update */}
          {statsAfter && (
            <div style={{
              background: 'linear-gradient(135deg,rgba(255,140,0,0.1),rgba(255,100,50,0.06))',
              border: '1.5px solid rgba(255,140,0,0.3)', borderRadius: 16,
              padding: '10px 16px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 20, marginBottom: 2 }}>🔥 {statsAfter.currentStreak} {statsAfter.currentStreak === 1 ? 'يوم' : 'أيام'} متتالية</div>
              <div style={{ fontSize: 12, color: 'var(--wof-text-secondary)' }}>
                إجمالي {statsAfter.totalSessions} جلسة معاً
                {statsAfter.longestStreak > 1 && ` · أطول streak: ${statsAfter.longestStreak}`}
              </div>
            </div>
          )}

          {/* New achievements */}
          <NewAchievementBanner achievements={newAchievements} />

          {/* Share button */}
          <button
            style={{
              background: 'linear-gradient(135deg,#25D366,#128C7E)',
              border: 'none', borderRadius: 16,
              padding: '14px 20px', color: 'white',
              fontSize: 15, fontWeight: 800, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: '0 4px 16px rgba(37,211,102,0.3)',
              transition: 'opacity 150ms',
            }}
            onClick={handleShare}
          >
            {copied ? '✅ تم النسخ!' : '📤 شارك النتيجة مع الأصدقاء'}
          </button>

          <button className="wof-btn wof-btn-primary wof-btn-full" onClick={() => setStep('reflection')}>
            📝 اكتب تأملك عن الجلسة
          </button>

          <button className="wof-btn wof-btn-secondary wof-btn-full" onClick={() => router.push('/')} style={{ fontSize: 14 }}>
            العودة للرئيسية
          </button>
        </div>
      </div>
    );
  }

  // ─── Step 2: التأمل الشخصي ──────────────────────────────────────────────
  if (step === 'reflection') {
    return (
      <div className="wof-screen wof-safe-top" style={{ justifyContent: 'center', padding: '32px 24px' }}>
        <div className="wof-animate-in" style={{ width: '100%', maxWidth: 380, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48 }}>📝</div>
            <h3 className="wof-title" style={{ fontSize: 20, marginTop: 12, marginBottom: 6 }}>تأملك الخاص</h3>
            <p className="wof-body" style={{ fontSize: 13, maxWidth: 300, margin: '0 auto' }}>
              هذا مساحة خاصة لك — لن يراها {partnerName}
            </p>
          </div>

          <div className="wof-card" style={{
            background: 'linear-gradient(135deg, var(--wof-primary-soft), white)',
            border: '1.5px solid var(--wof-secondary)', fontSize: 14, fontWeight: 500,
            lineHeight: 1.7, color: 'var(--wof-text)',
          }}>
            <div style={{ fontSize: 18, marginBottom: 8 }}>💭</div>
            <em>ماذا شعرت اليوم بخصوص {partnerName}؟</em>
            <div style={{ fontSize: 12, color: 'var(--wof-text-secondary)', marginTop: 8 }}>
              يمكنك الكتابة بحرية تامة — ما أثّر فيك، ما أسعدك، ما أقلقك...
            </div>
          </div>

          <textarea
            className="wof-input"
            rows={5}
            placeholder="ابدأ بما يخطر ببالك الآن…"
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            style={{ resize: 'none', fontFamily: 'var(--wof-font)', fontSize: 15, textAlign: 'right', lineHeight: 1.7 }}
          />

          <button className="wof-btn wof-btn-primary wof-btn-full" onClick={saveReflection} disabled={saving || !reflection.trim()}>
            {saving ? <span className="wof-loading-dots"><span /><span /><span /></span> : '✨ حفظ وتحليل مشاعري'}
          </button>

          <button onClick={() => setStep('done')} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 13, color: 'var(--wof-text-secondary)', textAlign: 'center', fontWeight: 600,
          }}>
            تخطّي التأمل
          </button>
        </div>
      </div>
    );
  }

  // ─── Step 3: التحليل ────────────────────────────────────────────────────
  if (step === 'analysis') {
    return (
      <div className="wof-screen wof-safe-top" style={{ justifyContent: 'center', padding: '32px 24px', overflowY: 'auto' }}>
        <div className="wof-animate-in" style={{ width: '100%', maxWidth: 380, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48 }}>🧠</div>
            <h3 className="wof-title" style={{ fontSize: 20, marginTop: 12, marginBottom: 6 }}>ما يقوله قلبك</h3>
            <p className="wof-body" style={{ fontSize: 13 }}>تحليل تأملك — لك وحدك</p>
          </div>

          <div className="wof-card" style={{
            background: 'linear-gradient(135deg, #F0F4FF, white)', border: '1.5px solid #A8C5E8',
            lineHeight: 1.8, fontSize: 14, color: 'var(--wof-text)',
          }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#4A7FA8', marginBottom: 10 }}>🔍 ما رصدناه في تأملك:</div>
            <p style={{ margin: 0, whiteSpace: 'pre-line' }}>{analysis}</p>
          </div>

          <div className="wof-card" style={{
            textAlign: 'center', background: 'var(--wof-primary-soft)',
            border: '1px dashed var(--wof-primary)', fontSize: 13, color: 'var(--wof-text-secondary)',
          }}>
            <div style={{ fontSize: 20, marginBottom: 6 }}>💡</div>
            في الجلسة القادمة، قد تظهر أسئلة تُعالج ما شعرت به اليوم.
          </div>

          <button className="wof-btn wof-btn-primary wof-btn-full" onClick={() => setStep('done')}>
            شكراً ❤️ — إنهاء الجلسة
          </button>
        </div>
      </div>
    );
  }

  // ─── Step 4: نهاية ──────────────────────────────────────────────────────
  return (
    <div className="wof-screen wof-safe-top" style={{ justifyContent: 'center', alignItems: 'center', padding: '40px 24px' }}>
      <div className="wof-animate-in" style={{ textAlign: 'center', width: '100%', maxWidth: 320, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <div className="wof-float" style={{ fontSize: 72, marginBottom: 12 }}>❤️</div>
          <h3 className="wof-title" style={{ fontSize: 22, marginBottom: 6 }}>حتى المرة القادمة</h3>
          <p className="wof-body" style={{ fontSize: 14, maxWidth: 260, margin: '0 auto' }}>
            كل جلسة تضيف لبنة جديدة... إلى {partnerName} 💕
          </p>
        </div>

        {/* Share one more time */}
        {shareText && (
          <button
            style={{
              background: 'linear-gradient(135deg,#25D366,#128C7E)', border: 'none', borderRadius: 16,
              padding: '12px 20px', color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: '0 4px 12px rgba(37,211,102,0.25)',
            }}
            onClick={handleShare}
          >
            {copied ? '✅ تم!' : '📤 شارك النتيجة'}
          </button>
        )}

        <button className="wof-btn wof-btn-primary wof-btn-full" onClick={() => router.push('/')}>
          العودة للصفحة الرئيسية 🏠
        </button>
      </div>
    </div>
  );
}

function ScoreColumn({ name, score, isWinner }: { name: string; score: number; isWinner: boolean }) {
  return (
    <div style={{ textAlign: 'center', flex: 1 }}>
      {isWinner && <div style={{ fontSize: 18, marginBottom: 2 }}>🏆</div>}
      <div style={{ fontSize: 12, fontWeight: 700, color: isWinner ? 'var(--wof-primary)' : 'var(--wof-text-secondary)', marginBottom: 4 }}>
        {name}
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--wof-text)' }}>{score}</div>
      <div style={{ fontSize: 11, color: 'var(--wof-text-secondary)' }}>نقطة</div>
    </div>
  );
}
