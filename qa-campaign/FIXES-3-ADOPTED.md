# إصلاحات 3 — الإصلاحات المعتمدة (بعد سيناريو المحاكاة النظرية في FIXES-2)

**التاريخ:** 16 أغسطس 2026 | **المصدر:** FIXES-2-THEORETICAL.md

## S3-01 (معتمد — CRITICAL): إصلاح WHEEL-OF-FATE-3

**الإجراء:** في `src/components/screens/GameRoom.tsx` عند L392، استبدال:
```
if (phase === 'waiting') return null;
```
بـ: عرض شاشة الانتظار (نفس WaitingRoom) مع guard لـ gameState — حتى لا ينقص عدد الـ hooks بين renders ولا يحدث return مشروط بعد hooks إطلاقًا.

**التحقق بعد التنفيذ:** (1) tsc نظيف، (2) unit 86/86، (3) integration 21/21، (4) UAT 32/32، (5) محاكاة السيناريو المسبب: إنشاء غرفة → انضمام → انتقال phase ذهابًا وإيابًا عبر waiting (عبر debug-state) ثم العودة — لا رمي hooks error.

## S3-02 (معتمد — CLEANUP): حل WHEEL-OF-FATE-1 و2 في Sentry عبر API (resolve) — أحداث إعداد تجريبية.

## سجل التنفيذ (16 أغسطس 23:45)
- [x] S3-01 مطبّق: `GameRoom.tsx` — استبدال `if (phase === 'waiting') return null;` (L392 سابقًا) بـ `return <WaitingRoom roomCode={roomCode} />;` مع import جديد. بعد التعديل: لا hooks بعد أي early return في GameRoom.
- [x] tsc نظيف (0 أخطاء)؛ فحص آلي للـ hooks: نظيف.
- [x] محاكاة سيناريو hooks: غرفة حقيقية spin×2 → spin_question → action خلال waiting → 400 صريح سليم (لا crash).
- [x] Unit 86/86 ×3، Integration 21/21 ×3، UAT 32/32 ×2 بعد التعديل.
- [x] S3-02: WHEEL-OF-FATE-1 و2 محلولان في Sentry (resolved عبر update_issue).
- [ ] المتبقي: commit + push (skripts qa-campaign) + deploy Vercel + smoke test + تحديث السجلات.

## معايير القبول
- لا return مشروط جديد بعد أي hook في GameRoom أو RoomPage.
- جميع الـ suites أخضر ×3.
- نشر على الإنتاج + smoke test.
<<<<<<< HEAD

## S3-03 (معتمد — HIGH): إصلاح UX-028 — الدخول المباشر للغرفة

**الإجراء:** في `src/app/room/[code]/page.tsx`، guard eject كان يعتمد على `useGameStore.persist.onFinishHydration` الذي لا يُفعَّل دومًا (hydration قد تكتمل قبل subscribe أو تفشل صامتًا). استُبدل بمراقبة نشطة: فحص `localStorage.getItem('wof-player')` متزامنًا عند mount + interval 200ms خلال فترة سماح 5s — eject فقط إذا لم تظهر هوية اللاعب إطلاقًا بعد 5s.

**التحقق بعد التنفيذ (17/08 04:10):**
- [x] TypeScript نظيف (0 أخطاء)
- [x] اختبار في متصفح حقيقي: متصفح جديد بدون هوية → eject صحيح إلى `/` ✓
- [x] اختبار harness: متصفح جديد بهوية صحيحة (`wof-player` بصيغة zustand) → يبقى في `/room/MT67BR` ويستقر URL ✓
- [x] غرفة التفاهم ظهرت فعليًا في المتصفح: «💔➡️💞 غرفة التفاهم — لاحظنا بعض التوتر… تحدثا بصراحة» ✓
- [x] الرحلة الكاملة اكتملت (conflict → dialogue ×2 → agree → loveCounter +3 → السؤال التالي) ✓
=======
>>>>>>> origin/main
