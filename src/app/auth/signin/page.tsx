'use client';
import React from 'react';
import { signIn } from 'next-auth/react';

export default function SignInPage() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--wof-bg)', padding: 24,
    }}>
      <div style={{
        background: 'white', borderRadius: 24, padding: '36px 32px',
        boxShadow: '0 8px 40px rgba(217,108,131,0.15)',
        border: '1.5px solid rgba(232,143,160,0.25)',
        maxWidth: 380, width: '100%', textAlign: 'center',
      }}>
        <div style={{ fontSize: 56, marginBottom: 12 }}>🎡</div>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: '#FF4D8D', marginBottom: 8 }}>
          Wheel of Fate
        </h1>
        <p style={{ fontSize: 14, color: 'var(--wof-text-secondary)', lineHeight: 1.7, marginBottom: 28 }}>
          سجّل دخولك بحساب Google لحفظ تقدمك وإنجازاتك عبر الأجهزة ❤️
        </p>

        <button
          onClick={() => void signIn('google', { callbackUrl: '/' })}
          style={{
            width: '100%', padding: '14px 20px',
            background: 'linear-gradient(135deg, #FF6FA3, #FF4D8D)',
            border: 'none', borderRadius: 16, cursor: 'pointer',
            fontSize: 16, fontWeight: 800, color: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            boxShadow: '0 4px 20px rgba(255,77,141,0.35)',
            transition: 'all 200ms',
          }}
        >
          <GoogleIcon />
          الدخول بـ Google
        </button>

        <p style={{ fontSize: 11, color: 'rgba(100,60,80,0.45)', marginTop: 20, lineHeight: 1.6 }}>
          يمكنك اللعب بدون تسجيل دخول — لكن بياناتك ستكون محلية فقط
        </p>
        <div style={{ marginTop: 12 }}>
          <a href="/" style={{ fontSize: 13, color: 'var(--wof-primary)', fontWeight: 700, textDecoration: 'none' }}>
            تخطي الآن →
          </a>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#fff"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#fff" fillOpacity=".7"/>
      <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#fff" fillOpacity=".5"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#fff" fillOpacity=".3"/>
    </svg>
  );
}
