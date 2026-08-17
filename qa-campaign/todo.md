
## G-BUILD-02 (17:44): integration tests 16 FAIL — السبب DB pooler

Neon قاعدة البيانات سليمة (run_sql عبر MCP = OK). المشكلة: DATABASE_URL المحلي يشير إلى pooler endpoint (ep-muddy-water-axvda9ly-pooler...) الذي يرفض الاتصالات من sandbox (ECONNREFUSED على مستوى TCP handshake — رغم أن port يبدو مقبولًا في بعض الفحوصات، connection فعليًا مرفوض).
الحل: تغيير host إلى endpoint المباشر ep-muddy-water-axvda9ly.us-east-2.aws.neon.tech (بدون -pooler). لا أستطيع تعديل .env عبر shell (قيود). سأطلب secret عبر webdev_request_secrets.
ملاحظة: production على Vercel يعمل بهذا الـ URL نفسه؟ المستخدم أضافه سابقًا في Vercel settings ونجح تسجيل الدخول — لذا pooler يعمل من Vercel لكنه لا يعمل من sandbox الحالي.

## G-BUILD-02 متابعة (17:52)

الموافقة على تعديل .env.local: تم التعديل من pooler إلى direct host (ep-muddy-water-axvda9ly.c-4.us-east-2.aws.neon.tech، بدون channel_binding، sslmode=require). المستخدم وافق صراحةً.
اختبار node CLI مباشر بنفس URL الجديد: OK (SELECT 1). لكن next dev ما زال ECONNREFUSED (log: "Environments: .env.local" ✓ قراءة صحيحة). rm .next حاول — فشل جزئي (Directory not empty لـ .next/dev).
الفرضية المتبقية: dev server process القديم لم يمت بالكامل (pkill قد يفشل صامتًا) أو neon direct يقبل CLI connections ويرفض connections من process معين؟ غير محتمل. الأرجح: process dev قديم (17:44) ما زال حيًا يقرأ env القديم! pkill -f "next dev" يقتل لكن dev-server3/spawn children قد تبقى. الحل: pkill -f wheel-of-fate ثم إعادة تشغيل نظيف.

## خطة ما تبقى (موافق عليها من المستخدم في آخر رسالة):
1. ✅ تعديل .env.local (تم) → تشغيل regression كامل (unit 86 PASS ✅ سابق، integration 16 FAIL يحتاج fix هذا)
2. ✅ harness 9/9 PASS (audit-18 النهائي معتمد — log-audit-final-9x9.txt + timeline-audit.json + screenshots)
3. توثيق التقرير النهائي + README update (حالة + روابط)
4. push fix/ux-030-031-direct-link → PR → merge main → Vercel deploy → تحقق من production
5. Sentry→GitHub Issues ما زال معلقًا (PAT بدون issues:write) — توثيق فقط
