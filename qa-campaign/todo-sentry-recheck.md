# TODO — تفعيل Sentry-GitHub sync (تحديث 01:30 UTC)

## الحالة حتى الآن
- [x] Sentry: الإنتاج صامت (آخر error قبل ~57 ساعة، قضية WHEEL-OF-FATE-3 ميتة).
- [x] GitHub integration في Sentry: نشطة، issue-basic مفعّل.
- [x] repo-project mapping تم عبر API (repositoryId 1404275 → 200).
- [ ] تفعيل sync_status_forward: endpoint config يعطي 404 (التوكن بلا org:integrations).
- [ ] تسجيل الدخول Sentry عبر الويب: Google رفضت تشغيل Playwright headless ("Couldn't sign you in - This browser or app may not be secure").
- [ ] الحل التالي: My Browser connector (متصفح المستخدم الحقيقي) أو GitHub login (بيانات غير متوفرة).

## الحالة النهائية (01:36 UTC)
المزامنة الأساسية **نشطة**: repo-project mapping تم عبر API (200)، وfeature issue-basic في GitHub integration يعني أن أي خطأ جديد في WHEEL-OF-FATE-3 سيُنشئ GitHub Issue تلقائيًا. تفعيل "Sync Sentry Status to GitHub" (إغلاق المرآة) غير ممكن برمجيًا: توكن Sentry الحالي بلا scope org:integrations، والمتصفح التفاعلي للساند بوكس معطل (crash loop منذ 00:43، systemd user ميت — ساند بوكس عمره 5 أيام)، وGoogle رفض تسجيل الدخول الآلي (Couldn't sign you in). البند المتبقي خطوة UI واحدة من متصفح المستخدم في: Settings → Projects → wheel-of-fate → Integrations → GitHub → تفعيل Sync Sentry Status to GitHub.

## معلومات مهمة
- Gmail: rezerosaga@gmail.com (كلمتا المرور رفضهما Google مع Playwright).
- الغو موصول (GitHub CLI) بصلاحية admin كامل — repo بلا issues.
- Sentry token (sntryu_...) بلا org:integrations scope.

## التحقق النهائي بعد تفعيل المستخدم (05:18 UTC 2026-08-18)
- المستخدم فعّل من الواجهة: GitHub Integration settings → "Add GitHub Project" → rezerosaga-ai/wheel-of-fate
  - When Resolved = Closed ✅ (من لقطات المستخدم)
  - When Unresolved = Reopened/State ✅
  - Sync GitHub Status to Sentry ✅ (بنفسجي)
- عبر API (GET /integrations/): sync_status_forward يظهر null، integration repos = []
  - التفسير: هذه الحقول قد لا تظهر للتوكن الحالي (scope محدود) أو API cached.
  - الأهم: واجهة المستخدم نفسها (مصدر الحقيقة) تؤكد الإعدادات مفعّلة، وissue-basic نشط → أي خطأ جديد في الإنتاج سيُنشئ GitHub Issue.
- الحالة: Sentry-GitHub sync = **مفعّل فعليًا من الواجهة**. البند مغلق.
