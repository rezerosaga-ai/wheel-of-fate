'use client';
import React, { useState, useEffect } from 'react';

interface AgeGateProps {
  onConfirm: () => void;
}

const STORAGE_KEY = 'wof-age-confirmed';

export function useAgeGate(): { confirmed: boolean; confirm: () => void } {
  const [confirmed, setConfirmed] = useState(true); // default true to avoid flash

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    setConfirmed(stored === 'yes');
  }, []);

  const confirm = () => {
    localStorage.setItem(STORAGE_KEY, 'yes');
    setConfirmed(true);
  };

  return { confirmed, confirm };
}

export default function AgeGate({ onConfirm }: AgeGateProps) {
  const [animateOut, setAnimateOut] = useState(false);

  const handleConfirm = () => {
    setAnimateOut(true);
    setTimeout(() => onConfirm(), 350);
  };

  const handleDecline = () => {
    // إعادة توجيه لصفحة محايدة
    window.location.href = 'https://www.google.com';
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'linear-gradient(135deg, #1a0a10 0%, #2d0a1a 50%, #1a0a10 100%)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '32px 24px',
        opacity: animateOut ? 0 : 1,
        transition: 'opacity 350ms ease',
      }}
    >
      {/* floating particles */}
      {['🌹', '💕', '🔥', '✨', '💋', '🌸'].map((e, i) => (
        <div key={i} style={{
          position: 'absolute',
          fontSize: `${14 + i * 3}px`,
          opacity: 0.3,
          top: `${[10, 80, 20, 85, 50, 65][i]}%`,
          left: `${[8, 75, 55, 15, 88, 40][i]}%`,
          animation: `wof-float ${2.5 + i * 0.4}s ease-in-out infinite`,
          animationDelay: `${i * 0.3}s`,
          pointerEvents: 'none',
        }}>{e}</div>
      ))}

      <div style={{
        background: 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(20px)',
        border: '1.5px solid rgba(255,77,141,0.3)',
        borderRadius: 24,
        padding: '40px 32px',
        maxWidth: 360,
        width: '100%',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 64, marginBottom: 16, lineHeight: 1 }}>🔞</div>

        <h1 style={{
          fontSize: 22, fontWeight: 900,
          color: '#FF4D8D', marginBottom: 8,
          fontFamily: 'Cairo, sans-serif',
        }}>
          تحقق من عمرك
        </h1>

        <p style={{
          fontSize: 15, color: 'rgba(255,255,255,0.8)',
          lineHeight: 1.7, marginBottom: 8,
          fontFamily: 'Cairo, sans-serif',
        }}>
          Wheel of Fate يحتوي على محتوى مناسب للبالغين
        </p>

        <div style={{
          background: 'rgba(255,77,141,0.1)',
          border: '1px solid rgba(255,77,141,0.25)',
          borderRadius: 12, padding: '10px 16px',
          marginBottom: 28,
        }}>
          <p style={{
            fontSize: 13, color: 'rgba(255,255,255,0.6)',
            margin: 0, fontFamily: 'Cairo, sans-serif', lineHeight: 1.6,
          }}>
            هل أتممت <strong style={{ color: '#FF6FA3' }}>17 عاماً</strong> من عمرك؟
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button
            onClick={handleConfirm}
            style={{
              background: 'linear-gradient(135deg, #FF4D8D, #FF6FA3)',
              border: 'none', borderRadius: 16,
              padding: '16px 24px',
              color: 'white', fontSize: 16, fontWeight: 800,
              cursor: 'pointer', fontFamily: 'Cairo, sans-serif',
              boxShadow: '0 4px 20px rgba(255,77,141,0.4)',
              transition: 'transform 150ms',
            }}
            onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.97)')}
            onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            ✅ نعم، أنا أكبر من 17 سنة
          </button>

          <button
            onClick={handleDecline}
            style={{
              background: 'transparent',
              border: '1.5px solid rgba(255,255,255,0.15)',
              borderRadius: 16, padding: '14px 24px',
              color: 'rgba(255,255,255,0.5)',
              fontSize: 14, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'Cairo, sans-serif',
            }}
          >
            ❌ لا، أنا أصغر من ذلك
          </button>
        </div>

        <p style={{
          fontSize: 11, color: 'rgba(255,255,255,0.3)',
          marginTop: 20, lineHeight: 1.5,
          fontFamily: 'Cairo, sans-serif',
        }}>
          بالنقر على «نعم» تؤكد موافقتك على{' '}
          <a href="/terms" style={{ color: 'rgba(255,77,141,0.7)' }}>شروط الاستخدام</a>
          {' '}و{' '}
          <a href="/privacy" style={{ color: 'rgba(255,77,141,0.7)' }}>سياسة الخصوصية</a>
        </p>
      </div>
    </div>
  );
}
