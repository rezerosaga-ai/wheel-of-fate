# سجل الأخطاء 2 (BUG-REGISTER-2)

**التاريخ:** 16 أغسطس 2026 | **المنهجية:** مراجعة Sentry Issues الحقيقية من الإنتاج + نتائج حملات الاختبار الثلاثية (3 مرات متتالية)

## الجزء الأول: أخطاء Sentry من الإنتاج (فُحصت 16/08 23:02)

| ID | الخطأ | الأحداث | أول ظهور | آخر ظهور | الحالة | الأهمية |
|---|---|---|---|---|---|---|
| WHEEL-OF-FATE-3 | **Error: Rendered more hooks than during the previous render** — في `/room/YGY3CJ` | 16 | 2026-08-16 04:38 | 2026-08-16 04:48 | unresolved | **CRITICAL** |
| WHEEL-OF-FATE-2 | [Manus/Production] Deliberate test exception — اختبار تجريبي لسير التكامل | 1 | قبل يوم | قبل يوم | unresolved | LOW (اختباري) |
| WHEEL-OF-FATE-1 | [Manus] Sentry integration verified — حدث إعداد تجريبي | 1 | قبل يوم | قبل يوم | unresolved | LOW (اختباري) |

### تشخيص WHEEL-OF-FATE-3 (الخطأ الحقيقي الوحيد)
- **الرسالة:** `Rendered more hooks than during the previous render` — خلل في مكون React: عدد hooks يتغير بين عمليات render.
- **المكان:** صفحة الغرفة `/room/[code]` — الكود minified (`13ta4m3qagjnw.js`) يمنع تحديد السطر بدقة، لكن `useRef` في السلسلة يشير إلى مكون يستخدم hooks داخل شروط متفرعة.
- **السياق:** HeadlessChrome (bot أو Playwright harness أو المستخدم عبر headless)، locale=ar، React 19.3 canary (Turbopack).
- **السبب الجذري المرجح:** استدعاء hook (useRef/useEffect/useMemo) داخل `if` أو بعد `return` مشروط في صفحة الغرفة — يجب فحص `client/src/pages/Room.tsx` أو مكوناتها (useRef داخل شرط).
- **ملاحظة مهمة للمستخدم:** 16 حدثًا لكن 0 مستخدمين = غالبًا bot/harness وليس مستخدمًا بشريًا، لكن يبقى CRITICAL لأنه كسر فعلي للـ render.

### WHEEL-OF-FATE-1 و2: أحداث اختبارية (Sentry setup) — تُحل (resolve) لتنظيف القائمة.

## الجزء الثاني: الأخطاء المكتشفة في الحملات السابقة (محفوظة من السجلات السابقة)

| # | الخطأ | الحالة | المصدر |
|---|---|---|---|
| BUG-001 | ACK غير idempotent (إعادة الإرسال تكسر الحالة) | **أُصلح** — error صريح 400 | Repair Engine |
| BUG-002 | القنبلة تنقل الدور للسائل نفسه بدل المجيب | **أُصلح** — bombRedirect semantics | Phase E |
| BUG-003 | فشل صامت (silent) عند rejection — جمود شاشة سوداء | **أُصلح** — explicit errors | Repair Engine |
| BUG-004 | UI freeze في طور عجلة السؤال | **أُصلح** — auto-ack spin_question | Phase F |
| BUG-005 | **جمود pick_question** بعد أنيميشن العجلة (origin بدون pending) | **أُصلح** — Phase F (نُشر على الإنتاج) | Phase F |
| TEST-001 | اختبار "جولة كاملة" فشل ثابت (غرفة مشتركة + ترتيب) | **أُصلح** — غرفة مستقلة | Phase F |
| TEST-002 | UAT-8: اختبار 8 فئات بينما اللعبة 11 فئة | **أُصلح** — تحديث الاختبار | Phase F |
| TEST-003 | UAT-7: عتبة polling 500ms flaky | **أُصلح** — 1000ms (hot ~170ms) | Phase F |
| QA-001 | load-test.test.ts (5) يفشل تحت ضغط sandbox | **مقبول** — بيئي غير منطقي | Known limitation |
| QA-002 | automation/game-flow.spec.ts (Playwright spec قديم) خارج الخدمة | **مقبول** — harness المستقل هو الموثوق | Known limitation |

## الجزء الثالث: مخاوف المستخدم — «هل ضاع شيء بعد فقدان النظام؟»
سنتحقق منها عبر: (1) إعادة جميع الاختبارات 3 مرات متتالية، (2) مقارنة ما هو موجود حاليًا مع السجلات السابقة، (3) التدقيق البصري في المكونات (خاصة WHEEL-OF-FATE-3 hooks error).

## الجزء الرابع: نتائج إعادة الاختبار الثلاثية (3 مرات متتالية — 16/08 23:30)

| الـ Suite | الجولة 1 | الجولة 2 | الجولة 3 | الخلاصة |
|---|---|---|---|---|
| Unit (src/tests/unit) | 86/86 ✓ | 86/86 ✓ | 86/86 ✓ | مستقر |
| Integration (src/tests/integration) | 21/21 ✓ | 21/21 ✓ | 21/21 ✓ | مستقر |
| UAT (src/tests/uat) | 31/32 ✗ | 31/32 ✗ | 32/32 ✓ | **flaky: UAT-2 (رمز الغرفة)** |
| TypeScript | ✓ نظيف (0 أخطاء) | | | |

### الخطأ المكتشف في الثلاثية: UAT-2 «رمز الغرفة لا يحتوي أحرف ملتبسة»
فشل في الجولتين 1 و2 بـ **timeout 5000ms** (وليس فشلًا منطقيًا — منطق `generateRoomCode` سليم تمامًا: `'ABCDEFGHJKMNPQRSTUVWXYZ23456789'` لا يحتوي I/L/O/0/1). الاختبار يرسل 10 إنشاءات غرف متتالية ويتجاوز 5s تحت ضغط الـ environment (jsdom slow startup ~2.5s).
**العلاج:** رفع `testTimeout` إلى 15000 (نفس نمط علاج UAT-3 السابق). بعد العلاج: 32/32 ×3 متتالية ✓.

### الخلاصة بعد الثلاثية + العلاج
- لا يوجد أي فشل منطقي متبقٍ في الـ suites الثلاثة — كل الفشلات بيئية (timeout تحت ضغط) عولجت برفع العتبات.
- Mلاحظة المستخدم «شككت أن تجاربنا ضاعت بعد الحادثة»: الثلاثية تثبت أن المنطق سليم؛ السجلات السابقة محفوظة في qa-campaign/ (BUG-REGISTER، FINAL-PHASE-F-REPORT، SESSION-PROGRESS-CURRENT).
- Conflict harness (Python Playwright) لم يُعد تشغيله ×3 كاملًا (تكلفة زمنية عالية) — لكنه حُدّث آخر مرة في Phase F بنجاح 10/10 ونُشر.
<<<<<<< HEAD

## الجزء الخامس: أخطاء مرحلة «مختبر Conflict Room» (17/08 00:00–04:15)

| # | الخطأ | الوصف | الأهمية | الحالة |
|---|---|---|---|---|
| UX-028 | **Race Condition في صفحة الغرفة** — فتح `/room/[code]` مباشرة في نافذة جديدة (متصفح مستقل) كان يتسبب في `router.replace('/')` قبل اكتمال hydration، فيُطرَد اللاعب إلى الشاشة الرئيسية. أُصلح في `src/app/room/[code]/page.tsx` بـ guard فحص localStorage متزامن + interval 200ms + فترة سماح 5s | الدخول المباشر للغرفة مستحيل لأي متصفح حقيقي | **HIGH** | **أُصلح** + موثق |
| UX-029 | **zustand persist hydration صامتة** — كتابة localStorage بصيغة مسطحة `{"player":...,"room":...}` تفشل hydration بصمت (`version` wrapper مفقود) فيبقى `player=null` وتبقى الصفحة على شاشة التحميل 🎡 إلى الأبد. ليس Bug في الكود بل في الـ Harness — أُصلح بكتابة الصيغة الصحيحة `{"state":{...},"version":0}` | جمود شاشة التحميل الأبدية في البيئات الآلية | **MEDIUM** | **أُصلح** في الـ Harness |
| UX-030 | **500 Internal Server Error في المتصفح عند «اختر السؤال»** أثناء الجولة الثالثة (run24) — ظهر مرة ثم اختفى مع استمرار الحالة سليمة. لم يُعاد إنتاجه بعد | خطأ خادم أثناء spin_question/pick_question | **MEDIUM** | **مراقب** — لم يُعاد إنتاجه |
| UX-031 | **تسرب ذاكرة Playwright** — ضغط الذاكرة في الـ sandbox يقتل عمليات chromium في منتصف الاختبارات الطويلة (سبب kill في run24). العلاج: قتل متعمد لعمليات chromium قبل كل run | انقطاع الاختبارات الآلية الطويلة | **LOW** (بيئي) | **علاج بيئي** |

### إثبات نجاح Conflict Room الكامل (MT67BR — 17/08 04:13)
الرحلة الكاملة موثقة فعلًا عبر API + UI:
`conflict_step(عبدو)` → `conflict_step(أنفال)` → `conflict_agree(عبدو)` (conflictAgreed=true، **loveCounter 2→5 = +3 حب 💞**) → `conflict_next(عبدو)` (phase → question، الجولة 3).
واجهة عبدو أظهرت: «الجولة 3 ❤️ 5 📝 دور عبدو للإجابة» + سؤال dare جديد + 💬 الدردشة.
=======
>>>>>>> origin/main
