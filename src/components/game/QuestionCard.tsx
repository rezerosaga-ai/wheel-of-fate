'use client';
import React, { useState } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { api } from '@/lib/api';

// ─── Report helper ────────────────────────────────────────────────────────────
async function reportQuestion(
  questionId: number, reason: string, playerId: string, roomCode: string,
): Promise<void> {
  try {
    await fetch('/api/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionId, reason, playerId, roomCode }),
    });
  } catch { /* silent */ }
}

const REPORT_REASONS: { value: string; label: string }[] = [
  { value: 'inappropriate', label: '🚫 سؤال غير لائق' },
  { value: 'confusing',     label: '❓ سؤال غير واضح' },
  { value: 'duplicate',     label: '🔁 سؤال مكرر' },
  { value: 'other',         label: '📝 سبب آخر' },
];

interface QuestionCardProps {
  questionId: number | null;
  questionText: string;
  category: string | null;
  categoryEmoji: string;
  askingPlayerName: string;
  answeringPlayerName: string;
  isMyTurnToAnswer: boolean;
  answer: string | null;
  answeredBy: string | null;
  phase: string;
  roomCode: string;
  deepenQuestion: string | null;
}

const CATEGORY_LABEL: Record<string, string> = {
  // فئات اللعبة الحالية
  love: 'الحب',
  relationship: 'علاقتنا',
  personality: 'الشخصية والأفكار',
  confessions: 'الاعترافات',
  bold: 'الجريئة',
  future: 'المستقبل',
  laugh: 'الضحك',
  situations: 'المواقف والافتراضات',
  // فئات قديمة للتوافق
  daily_life: 'الحياة اليومية',
  deep_feelings: 'مشاعر عميقة',
  dreams: 'الأحلام والطموح',
  past: 'ذكريات الماضي',
  trust: 'الثقة والقرب',
  fun: 'المرح والضحك',
  growth: 'النمو والتطور',
};

export default function QuestionCard({
  questionId,
  questionText,
  category,
  categoryEmoji,
  answeringPlayerName,
  isMyTurnToAnswer,
  answer,
  answeredBy,
  phase,
  roomCode,
  deepenQuestion,
}: QuestionCardProps) {
  const { player, setActionPending, setActionError } = useGameStore();
  const [myAnswer, setMyAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showReflection, setShowReflection] = useState(false);
  const [reflection, setReflection] = useState('');
  const [reflectionSaved, setReflectionSaved] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportDone, setReportDone] = useState(false);

  const submitAnswer = async () => {
    if (!myAnswer.trim()) return;
    setSubmitting(true);
    setActionPending(true);
    const res = await api.sendAction(roomCode, {
      type: 'answer',
      playerId: player?.id,
      answer: myAnswer.trim(),
    });
    setSubmitting(false);
    setActionPending(false);
    if (res.error) setActionError(res.error);
    else setMyAnswer('');
  };

  const saveReflection = async () => {
    if (!reflection.trim()) return;
    const res = await api.saveReflection(roomCode, player?.id ?? '', reflection.trim());
    if (!res.error) {
      setReflectionSaved(true);
      setTimeout(() => setShowReflection(false), 1500);
    }
  };

  const currentQuestion = deepenQuestion ?? questionText;

  const handleReport = async (reason: string) => {
    if (!questionId) return;
    await reportQuestion(questionId, reason, player?.id ?? 'unknown', roomCode);
    setReportDone(true);
    setTimeout(() => { setShowReport(false); setReportDone(false); }, 1800);
  };

  return (
    <div>
      {/* Category badge */}
      {category && (
        <div
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'var(--wof-bg-card)', border: '1.5px solid var(--wof-border)',
            borderRadius: 'var(--wof-radius-full)', padding: '4px 14px',
            fontSize: 13, fontWeight: 600, marginBottom: 12,
          }}
        >
          <span>{categoryEmoji}</span>
          <span>{CATEGORY_LABEL[category] ?? category}</span>
        </div>
      )}

      {/* Question */}
      <div
        className="wof-card"
        style={{
          background: 'linear-gradient(135deg, var(--wof-primary-soft) 0%, white 100%)',
          border: '2px solid var(--wof-border)',
          padding: '20px 18px',
          marginBottom: 16,
        }}
      >
        {deepenQuestion && (
          <div
            style={{
              fontSize: 12, fontWeight: 600, color: 'var(--wof-primary)',
              marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4,
            }}
          >
            <span>🔍</span> سؤال تعمّق
          </div>
        )}
        <p style={{ fontSize: 17, fontWeight: 600, lineHeight: 1.7, color: 'var(--wof-text)', margin: 0 }}>
          {currentQuestion}
        </p>

        {/* Report button — subtle, bottom-right */}
        {questionId && !deepenQuestion && (
          <div style={{ textAlign: 'left', marginTop: 10 }}>
            {!showReport ? (
              <button
                onClick={() => setShowReport(true)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 11, color: 'var(--wof-text-secondary)',
                  opacity: 0.55, padding: 0,
                }}
                aria-label="إبلاغ عن هذا السؤال"
              >
                ⚑ إبلاغ
              </button>
            ) : reportDone ? (
              <span style={{ fontSize: 11, color: 'var(--wof-success)', fontWeight: 700 }}>✅ تم الإبلاغ</span>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                {REPORT_REASONS.map((r) => (
                  <button
                    key={r.value}
                    onClick={() => { void handleReport(r.value); }}
                    style={{
                      background: 'rgba(220,50,50,0.08)', border: '1px solid rgba(220,50,50,0.2)',
                      borderRadius: 8, padding: '3px 9px', fontSize: 11, cursor: 'pointer',
                      color: '#C0392B', fontFamily: 'var(--wof-font)',
                    }}
                  >
                    {r.label}
                  </button>
                ))}
                <button
                  onClick={() => setShowReport(false)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: 11, color: 'var(--wof-text-secondary)', padding: '3px 6px',
                  }}
                >
                  إلغاء
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Who answers */}
      <div style={{ fontSize: 13, color: 'var(--wof-text-secondary)', textAlign: 'center', marginBottom: 12 }}>
        {isMyTurnToAnswer ? (
          <span style={{ color: 'var(--wof-primary)', fontWeight: 700 }}>دورك للإجابة ✨</span>
        ) : (
          <span>دور <strong>{answeringPlayerName}</strong> للإجابة…</span>
        )}
      </div>

      {/* Waiting spinner */}
      {!isMyTurnToAnswer && !answer && (
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <span className="wof-loading-dots"><span /><span /><span /></span>
        </div>
      )}

      {/* Answer input */}
      {isMyTurnToAnswer && !answer && phase === 'question' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <textarea
            className="wof-textarea"
            rows={3}
            placeholder="اكتب إجابتك هنا…"
            value={myAnswer}
            onChange={(e) => setMyAnswer(e.target.value)}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            inputMode="text"
            style={{
              resize: 'none',
              fontFamily: 'var(--wof-font)',
              fontSize: 15,
              userSelect: 'text',
              WebkitUserSelect: 'text',
              touchAction: 'manipulation',
            }}
          />
          <button
            className="wof-btn wof-btn-primary wof-btn-full"
            onClick={submitAnswer}
            disabled={submitting || !myAnswer.trim()}
          >
            {submitting ? <span className="wof-loading-dots"><span /><span /><span /></span> : '✅ أرسل الإجابة'}
          </button>
        </div>
      )}

      {/* Show answer */}
      {answer && (
        <div className="wof-animate-in">
          <div
            className="wof-card"
            style={{
              background: 'var(--wof-success-soft, #F0FAF0)',
              border: '1.5px solid var(--wof-success)',
              padding: '14px 16px',
              marginBottom: 12,
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--wof-success)', marginBottom: 6 }}>
              ✅ إجابة {answeredBy}
            </div>
            <p style={{ fontSize: 15, fontWeight: 500, lineHeight: 1.65, margin: 0 }}>{answer}</p>
          </div>

          {/* Save reflection */}
          {!showReflection ? (
            <button
              onClick={() => setShowReflection(true)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 13, color: 'var(--wof-text-secondary)', fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: 4, padding: '4px 0',
              }}
            >
              📝 احفظ تأملاً خاصاً
            </button>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
              <textarea
                className="wof-textarea"
                rows={2}
                placeholder="ما الذي لفت انتباهك في هذه الإجابة؟"
                value={reflection}
                onChange={(e) => setReflection(e.target.value)}
                autoComplete="off"
                inputMode="text"
                style={{
                  resize: 'none',
                  fontFamily: 'var(--wof-font)',
                  fontSize: 14,
                  userSelect: 'text',
                  WebkitUserSelect: 'text',
                  touchAction: 'manipulation',
                }}
              />
              {reflectionSaved ? (
                <div style={{ color: 'var(--wof-success)', fontWeight: 700, textAlign: 'center', fontSize: 14 }}>
                  ✅ تم الحفظ!
                </div>
              ) : (
                <button
                  className="wof-btn wof-btn-secondary"
                  onClick={saveReflection}
                  disabled={!reflection.trim()}
                  style={{ fontSize: 13, padding: '8px 16px' }}
                >
                  حفظ التأمل
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
