import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'سياسة الخصوصية — Wheel of Fate',
  description: 'سياسة خصوصية تطبيق عجلة الحظ',
};

export default function PrivacyPage() {
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
        🔒 سياسة الخصوصية
      </h1>
      <p style={{ color: '#888', fontSize: 13, marginBottom: 32 }}>
        آخر تحديث: يناير 2025
      </p>

      <Section title="1. من نحن">
        <p>
          Wheel of Fate («عجلة الحظ») هو تطبيق ألعاب علاقات تفاعلية للأزواج.
          يُشغَّل التطبيق بواسطة فريق rezerosaga-ai («نحن»، «لنا»).
        </p>
      </Section>

      <Section title="2. البيانات التي نجمعها">
        <ul>
          <li><strong>معرّف اللاعب (Player ID):</strong> رمز عشوائي مجهول الهوية يُنشأ تلقائياً ويُخزَّن محلياً على جهازك. لا يرتبط باسمك أو بريدك الإلكتروني.</li>
          <li><strong>الاسم المُدخَل في اللعبة:</strong> الاسم الذي تختاره أنت فقط داخل اللعبة (مثل «عبدو»). لا يُربط بهويتك الحقيقية.</li>
          <li><strong>رسائل الدردشة:</strong> تُخزَّن مؤقتاً في قاعدة البيانات طوال مدة الجلسة وتُحذف تلقائياً عند انتهائها.</li>
          <li><strong>التأملات الشخصية:</strong> ما تكتبه في خانة التأمل بعد الجلسة. يُخزَّن مشفراً ولا يُشارَك مع أي طرف ثالث.</li>
          <li><strong>إحصاءات الاستخدام (Streak / Achievements):</strong> تُخزَّن محلياً على جهازك فقط (localStorage) ولا تُرسَل إلى خوادمنا.</li>
        </ul>
      </Section>

      <Section title="3. كيف نستخدم البيانات">
        <ul>
          <li>تشغيل الجلسة وربط اللاعبَين في الغرفة نفسها.</li>
          <li>تحليل التأملات الشخصية بالذكاء الاصطناعي (OpenAI) لتقديم ملاحظات شخصية — البيانات لا تُستخدم لتدريب النماذج.</li>
          <li>تحسين تجربة اللعبة بصورة إجمالية ومجهولة الهوية.</li>
        </ul>
      </Section>

      <Section title="4. مشاركة البيانات مع أطراف ثالثة">
        <p>
          <strong>لا نبيع بياناتك ولا نشاركها</strong> مع أي طرف تجاري.
          نستخدم الخدمات التالية فقط:
        </p>
        <ul>
          <li><strong>Vercel</strong> — استضافة التطبيق (سياسة الخصوصية: vercel.com/legal/privacy-policy)</li>
          <li><strong>OpenAI</strong> — تحليل التأملات فقط، بدون تخزين دائم (سياسة OpenAI: openai.com/policies/privacy-policy)</li>
          <li><strong>Neon / PostgreSQL</strong> — قاعدة البيانات المؤقتة للجلسات</li>
        </ul>
      </Section>

      <Section title="5. الفئة العمرية">
        <p>
          التطبيق مخصص للأشخاص الذين <strong>تجاوزوا 17 عاماً</strong>.
          يحتوي التطبيق على محتوى للبالغين في وضع «الجريئة».
          إذا كنت دون السن المحددة، يُرجى عدم استخدام التطبيق.
        </p>
      </Section>

      <Section title="6. حذف البيانات">
        <p>
          لا نخزن بيانات شخصية مرتبطة بهويتك. بيانات الجلسة تُحذف تلقائياً.
          لحذف إحصاءاتك المحلية: اذهب إلى إعدادات المتصفح → مسح بيانات الموقع.
        </p>
      </Section>

      <Section title="7. الأمان">
        <p>
          نستخدم HTTPS مشفراً على جميع الاتصالات. لا نخزن كلمات مرور (لا يوجد نظام تسجيل دخول حالياً).
        </p>
      </Section>

      <Section title="8. التغييرات على هذه السياسة">
        <p>
          سنُبلّغك بأي تغييرات جوهرية عبر تحديث تاريخ «آخر تحديث» أعلى هذه الصفحة.
        </p>
      </Section>

      <Section title="9. التواصل معنا">
        <p>
          لأي استفسار: <a href="mailto:privacy@wheel-of-fate.app" style={{ color: '#FF4D8D' }}>privacy@wheel-of-fate.app</a>
        </p>
      </Section>

      <div style={{
        marginTop: 48, padding: '16px 20px',
        background: '#fff0f5', borderRadius: 12,
        border: '1px solid #ffccd8', fontSize: 13, color: '#888',
      }}>
        © 2025 Wheel of Fate · rezerosaga-ai ·{' '}
        <a href="/terms" style={{ color: '#FF4D8D' }}>شروط الاستخدام</a>
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
