import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'تحميل عجلة الحظ — تطبيق الأزواج',
  description: 'حمّل تطبيق عجلة الحظ على هاتفك الأندرويد مجاناً — 605 سؤال لتعميق علاقتك',
};

export default function DownloadPage() {
  const apkSize = '1.2 MB';
  const version  = '1.0.0';

  return (
    <main
      dir="rtl"
      style={{
        minHeight: '100dvh',
        background: 'linear-gradient(160deg, #1a0a2e 0%, #2d1155 40%, #1a0a2e 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 20px',
        fontFamily: "'Noto Sans Arabic', 'Cairo', 'Segoe UI', system-ui, sans-serif",
        color: '#fff',
      }}
    >
      {/* Stars background */}
      <div aria-hidden style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
        {['10%,15%','25%,40%','70%,20%','85%,60%','50%,80%','15%,70%','90%,35%','60%,10%'].map((pos, i) => {
          const [left, top] = pos.split(',');
          return (
            <div key={i} style={{
              position: 'absolute', left, top,
              width: i % 3 === 0 ? 4 : 2, height: i % 3 === 0 ? 4 : 2,
              borderRadius: '50%', background: 'rgba(255,255,255,0.6)',
              animation: `twinkle ${2 + i * 0.4}s ease-in-out infinite alternate`,
            }} />
          );
        })}
      </div>

      <style>{`
        @keyframes twinkle { from { opacity: 0.2; } to { opacity: 1; } }
        @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
        @keyframes pulse-ring {
          0% { transform: scale(0.9); box-shadow: 0 0 0 0 rgba(232,143,160,0.5); }
          70% { transform: scale(1); box-shadow: 0 0 0 20px rgba(232,143,160,0); }
          100% { transform: scale(0.9); }
        }
        .dl-btn:hover { opacity: 0.92; transform: translateY(-2px); }
        .dl-btn:active { transform: translateY(0); }
        .feature-card:hover { background: rgba(255,255,255,0.1); }
      `}</style>

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 440, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28 }}>

        {/* App icon */}
        <div style={{
          width: 100, height: 100, borderRadius: 28,
          background: 'linear-gradient(135deg, #E88FA0, #A4C8E8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 52,
          animation: 'float 3s ease-in-out infinite',
          boxShadow: '0 8px 32px rgba(232,143,160,0.4)',
        }}>
          🎡
        </div>

        {/* Title */}
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: 28, fontWeight: 900, margin: 0, marginBottom: 8, letterSpacing: '-0.5px' }}>
            عجلة الحظ
          </h1>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.75)', margin: 0, lineHeight: 1.6 }}>
            لعبة الأزواج الأعمق — 605 سؤال يجعلانكم تعرفان بعضكما من جديد
          </p>
        </div>

        {/* Badges */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
          {[
            { icon: '🇸🇦', text: 'عربي 100%' },
            { icon: '🆓', text: 'مجاني تماماً' },
            { icon: '🔒', text: 'بدون إعلانات' },
            { icon: '💑', text: 'للأزواج فقط' },
          ].map(({ icon, text }) => (
            <div key={text} style={{
              background: 'rgba(255,255,255,0.12)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 99,
              padding: '5px 14px',
              fontSize: 12,
              fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 5,
            }}>
              <span>{icon}</span>
              <span>{text}</span>
            </div>
          ))}
        </div>

        {/* Main Download Button */}
        <a
          href="/wheel-of-fate.apk"
          download="عجلة-الحظ.apk"
          className="dl-btn"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 12, width: '100%',
            background: 'linear-gradient(135deg, #E88FA0, #d4718b)',
            color: 'white', textDecoration: 'none',
            borderRadius: 20, padding: '18px 28px',
            fontSize: 18, fontWeight: 800,
            boxShadow: '0 6px 30px rgba(232,143,160,0.45)',
            transition: 'all 200ms ease',
            animation: 'pulse-ring 2.5s ease-in-out infinite',
          }}
        >
          <span style={{ fontSize: 26 }}>⬇️</span>
          <div style={{ textAlign: 'right' }}>
            <div>تحميل التطبيق</div>
            <div style={{ fontSize: 12, fontWeight: 500, opacity: 0.85 }}>Android APK · {apkSize} · v{version}</div>
          </div>
        </a>

        {/* Instructions */}
        <div style={{
          background: 'rgba(255,255,255,0.07)',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: 18, padding: '20px',
          width: '100%',
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14, color: 'rgba(255,255,255,0.9)' }}>
            📋 خطوات التثبيت
          </div>
          {[
            { n: '1', text: 'اضغط "تحميل التطبيق" أعلاه' },
            { n: '2', text: 'افتح ملف APK بعد التحميل' },
            { n: '3', text: 'إذا ظهر تحذير → اضغط "تثبيت على أي حال"' },
            { n: '4', text: 'افتح التطبيق واستمتعوا معاً 💕' },
          ].map(({ n, text }) => (
            <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: n === '4' ? 0 : 10 }}>
              <div style={{
                minWidth: 26, height: 26, borderRadius: '50%',
                background: 'linear-gradient(135deg,#E88FA0,#A4C8E8)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 800,
              }}>
                {n}
              </div>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.82)' }}>{text}</span>
            </div>
          ))}
        </div>

        {/* Features */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, width: '100%' }}>
          {[
            { icon: '🎡', title: 'عجلة الأسئلة', desc: '605 سؤال بالعربي' },
            { icon: '🎮', title: 'ألعاب صغيرة', desc: 'تحديات وبطاقات مصير' },
            { icon: '🔥', title: 'نظام Streak', desc: '7 إنجازات للفوز بها' },
            { icon: '🤫', title: 'تأملات خاصة', desc: 'تحليل AI لمشاعرك' },
            { icon: '💬', title: 'دردشة فورية', desc: 'أثناء اللعب معاً' },
            { icon: '📊', title: 'إحصاء الجلسة', desc: 'ملخص كل لعبة' },
          ].map(({ icon, title, desc }) => (
            <div
              key={title}
              className="feature-card"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 14, padding: '14px',
                transition: 'background 200ms',
              }}
            >
              <div style={{ fontSize: 22, marginBottom: 4 }}>{icon}</div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{title}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>{desc}</div>
            </div>
          ))}
        </div>

        {/* Alternative: PWA */}
        <div style={{
          textAlign: 'center',
          background: 'rgba(164,200,232,0.1)',
          border: '1px solid rgba(164,200,232,0.25)',
          borderRadius: 16,
          padding: '16px 20px',
          width: '100%',
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6, color: 'rgba(255,255,255,0.9)' }}>
            📱 بديل بدون تثبيت
          </div>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', margin: '0 0 10px' }}>
            يمكنك أيضاً فتح الموقع مباشرة من متصفحك وإضافته لشاشة الرئيسية
          </p>
          <Link
            href="/"
            style={{
              display: 'inline-block',
              background: 'rgba(164,200,232,0.2)',
              border: '1px solid rgba(164,200,232,0.4)',
              borderRadius: 10,
              padding: '8px 20px',
              fontSize: 13, fontWeight: 700,
              color: '#A4C8E8',
              textDecoration: 'none',
            }}
          >
            🌐 العب الآن في المتصفح
          </Link>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: 1.8 }}>
          <div>عجلة الحظ · للأزواج الجريئين 💕</div>
          <div style={{ marginTop: 4 }}>
            <Link href="/privacy" style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>سياسة الخصوصية</Link>
            {' · '}
            <Link href="/terms" style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>شروط الاستخدام</Link>
          </div>
        </div>

      </div>
    </main>
  );
}
