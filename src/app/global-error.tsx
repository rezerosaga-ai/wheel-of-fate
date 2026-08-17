'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body style={{ margin: 0, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif', background: '#0E0E14', color: '#F5E6D3' }}>
        <h1 style={{ fontSize: '1.5rem' }}>حدث خطأ غير متوقع</h1>
        <p>يمكنك المحاولة مرة أخرى.</p>
        <button onClick={() => reset()} style={{ padding: '0.75rem 1.5rem', borderRadius: '9999px', border: 'none', background: '#E88FA0', color: '#1A1118', fontWeight: 700, cursor: 'pointer' }}>إعادة المحاولة</button>
      </body>
    </html>
  );
}
