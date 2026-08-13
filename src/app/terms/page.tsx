import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'شروط الاستخدام — Wheel of Fate',
  description: 'شروط استخدام تطبيق عجلة الحظ',
};

export default function TermsPage() {
  return (
    <main dir="rtl" style={{
      fontFamily: 'Cairo, sans-serif',
      maxWidth: 720,
      margin: '0 auto',
      padding: '40px 24px',
      color: '#222',
      lineHeight: 1.9,
    }}>
      <h1 style={{ fontSize: 28, fontWeight: 900, color: '#FF4D8D', marginBottom: 8 }}>
        📋 شروط الاستخدام
      </h1>
      <p style={{ color: '#888', fontSize: 13, marginBottom: 32 }}>
        آخر تحديث: يناير 2025
      </p>

      <Section title="1. القبول بالشروط">
        <p>
          باستخدامك لتطبيق Wheel of Fate، فأنت توافق على هذه الشروط كاملةً.
          إذا لم توافق، يُرجى عدم استخدام التطبيق.
        </p>
      </Section>

      <Section title="2. الفئة العمرية المستهدفة">
        <p>
          التطبيق مخصص للأشخاص الذين <strong>تجاوزوا 17 عاماً</strong>.
          بعض المحتوى (وضع «الجريئة») مناسب فقط للبالغين.
          أنت تؤكد أن عمرك يتجاوز 17 عاماً باستخدامك للتطبيق.
        </p>
      </Section>

      <Section title="3. استخدام التطبيق">
        <ul>
          <li>التطبيق مخصص للاستخدام الشخصي الترفيهي بين الأزواج.</li>
          <li>يُحظر استخدام التطبيق لأغراض تجارية أو لإيذاء الآخرين.</li>
          <li>أنت مسؤول عن محتوى الرسائل التي ترسلها في الدردشة.</li>
          <li>يُحظر إرسال محتوى مسيء أو عنيف أو غير قانوني.</li>
        </ul>
      </Section>

      <Section title="4. المحتوى والملكية الفكرية">
        <p>
          جميع الأسئلة والتصميمات والأصوات هي ملك لفريق rezerosaga-ai.
          لا يجوز نسخها أو توزيعها دون إذن مسبق كتابي.
        </p>
      </Section>

      <Section title="5. إخلاء المسؤولية">
        <ul>
          <li>التطبيق مقدَّم «كما هو» بدون ضمانات من أي نوع.</li>
          <li>نحن لسنا مسؤولين عن أي أضرار مباشرة أو غير مباشرة تنتج عن استخدام التطبيق.</li>
          <li>التطبيق ليس بديلاً عن الاستشارة النفسية أو العلاجية.</li>
        </ul>
      </Section>

      <Section title="6. انقطاع الخدمة">
        <p>
          قد تتوقف الخدمة مؤقتاً للصيانة أو التحديثات دون إشعار مسبق.
          لا نضمن توفر الخدمة على مدار الساعة.
        </p>
      </Section>

      <Section title="7. التعديلات على الشروط">
        <p>
          نحتفظ بحق تعديل هذه الشروط في أي وقت.
          الاستمرار في استخدام التطبيق بعد التعديل يُعدّ قبولاً للشروط الجديدة.
        </p>
      </Section>

      <Section title="8. القانون المطبّق">
        <p>
          تخضع هذه الشروط لقوانين المملكة العربية السعودية.
        </p>
      </Section>

      <Section title="9. التواصل">
        <p>
          للاستفسار: <a href="mailto:support@wheel-of-fate.app" style={{ color: '#FF4D8D' }}>support@wheel-of-fate.app</a>
        </p>
      </Section>

      <div style={{
        marginTop: 48, padding: '16px 20px',
        background: '#fff0f5', borderRadius: 12,
        border: '1px solid #ffccd8', fontSize: 13, color: '#888',
      }}>
        © 2025 Wheel of Fate · rezerosaga-ai ·{' '}
        <a href="/privacy" style={{ color: '#FF4D8D' }}>سياسة الخصوصية</a>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 32 }}>
      <h2 style={{ fontSize: 18, fontWeight: 800, color: '#333', marginBottom: 10, borderBottom: '2px solid #ffccd8', paddingBottom: 6 }}>
        {title}
      </h2>
      <div style={{ fontSize: 15 }}>{children}</div>
    </section>
  );
}
