'use client';
import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useGameStore } from '@/store/useGameStore';

interface KnowMeProps {
  roomCode: string;
  question: string | null;
  answer: string | null;
  guess: string | null;
  answerBy: string | null;
  guessBy: string | null;
  isPlayer1: boolean;
  player1Name: string;
  player2Name: string;
}

export default function KnowMe({
  roomCode,
  question,
  answer,
  guess,
  answerBy,
  guessBy,
  isPlayer1,
  player1Name,
  player2Name,
}: KnowMeProps) {
  const { player, setActionPending, setActionError } = useGameStore();
  const [myText, setMyText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const myName = isPlayer1 ? player1Name : player2Name;

  // Am I the answerer or guesser?
  const shouldAnswer = !answer;
  const shouldGuess = !!answer && !guess;

  const submit = async () => {
    if (!myText.trim()) return;
    setSubmitting(true);
    const type = shouldAnswer ? 'know_me_answer' : 'know_me_guess';
    const res = await api.sendAction(roomCode, {
      type,
      playerId: player?.id,
      text: myText.trim(),
    });
    setSubmitting(false);
    if (res.error) setActionError(res.error);
    else setMyText('');
  };

  const continueGame = async () => {
    setActionPending(true);
    const res = await api.sendAction(roomCode, { type: 'end_know_me', playerId: player?.id });
    setActionPending(false);
    if (res.error) setActionError(res.error);
  };

  return (
    <div className="wof-animate-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48 }}>🔮</div>
        <h3 className="wof-title" style={{ fontSize: 20, marginTop: 8, marginBottom: 4 }}>هل تعرفني؟</h3>
        <p className="wof-body" style={{ fontSize: 14 }}>
          جولة خاصة — أحدكما يجيب، والآخر يخمّن!
        </p>
      </div>

      {/* Question */}
      {question && (
        <div
          className="wof-card"
          style={{
            background: 'linear-gradient(135deg, #f0e8ff 0%, white 100%)',
            border: '2px solid #C8A8E0',
            padding: '16px',
          }}
        >
          <p style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.7, margin: 0 }}>{question}</p>
        </div>
      )}

      {/* Stages */}
      {!answer ? (
        <div>
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--wof-text-secondary)', marginBottom: 8 }}>
            {answerBy === player?.id ? 'أجب عن السؤال — شريكك سيخمّن:' : `في انتظار إجابة ${answerBy === player?.id ? myName : (isPlayer1 ? player2Name : player1Name)}…`}
          </p>

          {answerBy === player?.id || (!answerBy) ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <textarea
                className="wof-textarea"
                rows={3}
                placeholder="إجابتك هنا…"
                value={myText}
                onChange={(e) => setMyText(e.target.value)}
                autoComplete="off"
                inputMode="text"
                style={{
                  resize: 'none', fontFamily: 'var(--wof-font)', fontSize: 15,
                  userSelect: 'text', WebkitUserSelect: 'text', touchAction: 'manipulation',
                }}
              />
              <button
                className="wof-btn wof-btn-primary wof-btn-full"
                onClick={submit}
                disabled={submitting || !myText.trim()}
              >
                {submitting ? <span className="wof-loading-dots"><span /><span /><span /></span> : '✅ إرسال الإجابة'}
              </button>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <span className="wof-loading-dots"><span /><span /><span /></span>
            </div>
          )}
        </div>
      ) : !guess ? (
        <div>
          <div
            className="wof-card"
            style={{ background: 'var(--wof-success-soft, #F0FAF0)', border: '1.5px solid var(--wof-success)', marginBottom: 12 }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--wof-success)', marginBottom: 4 }}>✅ تمت الإجابة</div>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 500, lineHeight: 1.65 }}>{answer}</p>
          </div>

          {guessBy === player?.id || (!guessBy) ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <label style={{ fontSize: 14, fontWeight: 600, color: 'var(--wof-text-secondary)' }}>
                ما تخمينك لإجابة شريكك؟
              </label>
              <textarea
                className="wof-textarea"
                rows={2}
                placeholder="أعتقد أنه/أنها سيقول…"
                value={myText}
                onChange={(e) => setMyText(e.target.value)}
                autoComplete="off"
                inputMode="text"
                style={{
                  resize: 'none', fontFamily: 'var(--wof-font)', fontSize: 15,
                  userSelect: 'text', WebkitUserSelect: 'text', touchAction: 'manipulation',
                }}
              />
              <button
                className="wof-btn wof-btn-secondary wof-btn-full"
                onClick={submit}
                disabled={submitting || !myText.trim()}
              >
                {submitting ? <span className="wof-loading-dots"><span /><span /><span /></span> : '🔮 أرسل تخمينك'}
              </button>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <span className="wof-loading-dots"><span /><span /><span /></span>
            </div>
          )}
        </div>
      ) : (
        <div className="wof-animate-in" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div
            className="wof-card"
            style={{ background: 'var(--wof-success-soft, #F0FAF0)', border: '1.5px solid var(--wof-success)' }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--wof-success)', marginBottom: 4 }}>✅ الإجابة الحقيقية</div>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 500, lineHeight: 1.65 }}>{answer}</p>
          </div>
          <div
            className="wof-card"
            style={{ background: 'var(--wof-primary-soft)', border: '1.5px solid var(--wof-primary)' }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--wof-primary)', marginBottom: 4 }}>🔮 التخمين</div>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 500, lineHeight: 1.65 }}>{guess}</p>
          </div>
          <p style={{ textAlign: 'center', fontSize: 15, color: 'var(--wof-text-secondary)', fontWeight: 600 }}>
            هل كان التخمين صحيحاً؟ ❤️ ناقشا معاً!
          </p>
          <button
            className="wof-btn wof-btn-primary wof-btn-full"
            onClick={continueGame}
          >
            متابعة اللعبة ▶
          </button>
        </div>
      )}
    </div>
  );
}
