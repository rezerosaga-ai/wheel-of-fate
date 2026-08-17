'use client';
import Link from 'next/link';
export default function NotFound() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'Cairo, Nunito, sans-serif', background: '#0E0E14', color: '#F5E6D3', textAlign: 'center', padding: '2rem' }}>
      <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>الصفحة غير موجودة</h1>
      <p style={{ marginBottom: '1.5rem', opacity: 0.8 }}>لم نتمكن من العثور على الصفحة التي تبحث عنها.</p>
      <Link href="/" style={{ padding: '0.75rem 1.5rem', borderRadius: '9999px', border: 'none', background: '#E88FA0', color: '#1A1118', fontWeight: 700, textDecoration: 'none', fontSize: '1rem' }}>العودة للصفحة الرئيسية</Link>
    </div>
  );
}
