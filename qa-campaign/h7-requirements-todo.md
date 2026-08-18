# TODO — متطلبات Claude الإلزامية (2026-08-18)

## حالة البنود

### ✅ بند H7 (AUTH-COVERAGE-001)
تم. السيناريو H7_google_auth_flow مضاف في human_playtest.py (6 فحوصات فرعية).
الجولة الأولى كشف: `redirect: manual` في fetch يرمي CORS error → status=0 (4 FAIL).
الإصلاح: interception عبر page.on("response") لاستخراج Location.
إعادة التشغيل على الإنتاج الحي: **25/25 PASS** (شمل H1–H6 + H7 كامل).
report: pass=25 fail=0 total=25.

### ✅ بند 2.2 (إزالة phaser نهائياً)
commit `4d822c5`: `chore: remove unused phaser dependency (final step of CLEANUP-001)`
`pnpm remove phaser` منفذ + لا مرجع متبقٍ في src + typecheck نظيف. CLEANUP-001 مغلق.

### ✅ HP-BUG-06 (retryWrap err.cause)
تم توسيع retryWrap في المسارات الثلاثة (action/chat/state) بدالة `netErrorSignature`
التي تجمع err.message + كل err.cause حتى عمق 4 (معالجة AggregateError/PostgresError wrapped).
typecheck نظيف. بقي: اختبار unit + commit + push.

### ⏳ المتبقي
1. اختبار unit لـnetErrorSignature (AggregateError wrapped ECONNREFUSED = يعاد + خطأ منطقي غير شبكي لا يعاد).
2. commit + push (اسم موصى: `fix: retryWrap now inspects err.cause chain (HP-BUG-06)`).
3. جولة harness كاملة ثالثة (اختياري: 25/25 تحققت بالفعل في جولة H7).
4. تحديث CLAUDE-FEEDBACK-RESPONSE أو وثيقة إغلاق + commit نهائي.
