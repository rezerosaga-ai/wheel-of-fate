# سجل الأخطاء المركزي — Wheel of Fate

**المستودع:** `rezerosaga-ai/wheel-of-fate` | **الإنتاج:** `https://wheel-of-fate-three.vercel.app`
**تاريخ الإنشاء:** 16 أغسطس 2026 | **المؤلف:** Manus AI
**الغرض:** مرجع دائم — عند بداية أي جلسة إصلاح، يُقرأ هذا الملف أولًا.

## قواعد التصنيف
| الحالة | المعنى |
|---|---|
| OPEN | عيب مؤكد يحتاج إصلاحًا |
| WONTFIX-DECISION | قرار واعٍ بعدم إصلاحه (موثق) |
| KNOWN-LIMITATION | قيد معروف ببيئة الاستضافة، غير قابل للإصلاح داخل الكود |
| STALE-TEST | الاختبار نفسه عتيق، الكود سليم |

---

## 1. أخطاء الإنتاج المؤكدة (OPEN — تحتاج إصلاح)

### BUG-001 — Crash 500 عند ACK مزدوج على نتيجة اللف
- **المعرف:** T10b2 في harness
- **السيناريو:** بعد أن يُختار السؤال (spin_question) يضغط اللاعب على زر "تم اختيار السؤال" (spin_question_ack) مرتين متتاليتين (نقرة مزدوجة شائعة على الهواتف).
- **المسبب الجذري:** ACK الأول يستهلك النتيجة المؤقتة (`pendingSpinResult`) ويضبطها null؛ ACK الثاني يقرأ null → `JSON.parse('{}')` → قيمة رقمية `NaN` → Drizzle يرمي استثناء → **خادم يرجع 500** والغرفة تبقى عالقة.
- **الأثر:** غرفة عالقة تحتاج reload؛ انطباع «اللعبة تحترق».
- **التكرار:** مؤكد في 3/3 دفعات (9 جلسات).
- **الإصلاح المقترح:** في handler: إذا كانت النتيجة مستهلكة مسبقًا → أرجع 200 idempotent مع `alreadyAcknowledged: true` (نفس نمط reactionDone guard).

### BUG-002 — نجاح صامت: conflict_step بلا معالج
- **المعرفان:** T27-evidence + C13
- **السيناريو:** إرسال action نوعه `conflict_step` على غرفة في أي phase.
- **المسبب الجذري:** `switch` في `game-logic.ts` لا يحتوي `case 'conflict_step'` → يسقط في `default` → `success: true, updates: {}` بدون أي تغيير حالة.
- **الأثر:** انتهاك مباشر للمعيار الإلزامي 2.2 (ممنوع النجاح الصامت). لو ظهر في الإنتاج لاستخدمت الغرفة خطوة صراع لا يفعل شيئًا.
- **التكرار:** مؤكد في 3/3 دفعات.
- **الإصلاح المقترح:** إما معالج حقيقي يبدأ وضع الصراع، أو رفض صريح 400 حتى تُبنى الميزة.

### BUG-003 — نجاح صامت ثانٍ: reaction خارج phase
- **المعرف:** run2 (reaction على phase ≠ reaction)
- **المسبب الجذري:** guard `reactionDone=true` أو phase خاطئة → handler يرجع `updates: {}` بينما route يلفّها بـ `success: true`.
- **الإصلاح المقترح:** نمط موحد: كل guard يرمي `AppError('رسالة عربية', 400)` أو يرجع `success: false, reason`.

### BUG-004 — SSE غير موثوق على Vercel
- **المعرف:** T22
- **المسبب الجذري:** `/api/rooms/[code]/stream` يخزن listeners في متغير `in-memory` (roomStreams) — كل نسخة serverless لها ذاكرتها؛ الإصدار الذي يستقبل POST `/action` قد لا يكون نفس الإصدار الذي فتح SSE.
- **الأثر:** إشعارات لحظية لا تصل عشوائيًا. العملاء الحاليون يعتمدون على polling (يعمل) + SSE (مزخرف غير موثوق).
- **التصنيف:** KNOWN-LIMITATION (بنية Vercel serverless) — الحل الهندسي: polling فقط أو WebSocket عبر خدمة خارجية (خارج scope الحالي).

## 2. ميزات غير منفذة في الإنتاج (NOT_IMPLEMENTED)

| المعرف | الميزة | أين ظهرت |
|---|---|---|
| NI-01 | `replyTo` (رد على رسالة بعينها) | schema route chat لا يوجد |
| NI-02 | Emoji reactions على الرسائل | UI + schema لا يوجد |
| NI-03 | Voice messages | schema لا يوجد |
| NI-04 | Conflict Room كامل (alternating dialogue → RESOLVED) | conflict_step بدون handler |
| NI-05 | Love Counter في الواجهة | النقاط تُحسب DB لكن لا تظهر UI |
| NI-06 | Adaptive follow-up questions | route غير موجود |
| NI-07 | CODEOWNERS / Business-tier GitHub sync | Sentry مجاني |

## 3. عتيقات الاختبارات (STALE-TEST)
- UAT-8: يتوقع 8 فئات — الكود توسع لـ 11 عمدًا → يجب تحديث assert إلى 11.
- "pick_question ينتقل إلى question": مسار flow قديم غير موجود (الفلو الحالي: spin_question + ack ثنائي) → إما حذف أو إعادة كتابة.
- integration/api.test.ts + load-test.test.ts + uat-checklist.test.ts موجهة لـ `localhost:13000` → تفشل في أي بيئة بدون خادم محلي → يجب تشغيلها بنسخ موجهة للإنتاج (مثل `regression-prod/`).

## 4. أخطاء جلسة الاختبار اليدوي (من الجلسات السابقة — موثقة)
- **JR-01:** القنبلة كانت تنقل الدور للضاغط بدل المجيب → **مُصلحة** (commit `ede84cd`).
- **JR-02:** ومضات + أوراق احتفال معلقة → **مُصلحة**.
- **JR-03:** APK download مكشوف للعامة → **مُحاط بـ middleware 404** (الملف محفوظ بالمستودع).
- **JR-04:** أسماء تظهر كمعرفات p_17... → **مُصلحة** (اسم اللاعب الظاهر).
- **JR-05:** تأخير ثانية-ثانيتين في إرسال الرد → مُحسَّن (polling 800ms).
- **JR-06:** شاشة سوداء بعد "انجزنا التحدي" → **مُصلحة** (fallback UI في GameRoom).

## 5-أ. نتائج حملة UX/Visual/Audio/Emotional (16 أغسطس 2026 — Observer فقط، لا إصلاحات)
- **UX-C01/UX-C03 (CRITICAL):** ACK المزدوج يسقط الخادم 500 ويجمّد الغرفة نهائيًا (BUG-001 مؤكد 100% على الإنتاج مرتين: غرفة 4X98GV بعد نقرة مزدوجة، وغرفة PPW4CW انهارت في أول ACK شرعي للسؤال الأول — أي غرفة إنتاج جديدة لا تنجو من جولة كاملة). التشخيص الإضافي: الواجهة ترسل نوعي ACK متتابعين (spin_category_ack ثم spin_question_ack) لكل سؤال، فكلاهما يفكّ pending → crash شبه مضمون.
- **UX-C02 (CRITICAL):** الغرفة العالقة بلا مخرج — «أنفال يختار السؤال…» للأبد، بلا خطأ ولا timeout ولا زر مخرج.
- **UX-010/014 (CRITICAL):** reveal الجواب معطل بصريًا: المجيب يجاب (DB يؤكد)، لكن شاشة السائل تبقى «دور... للإجابة» إلى الأبد حتى بعد reload كامل.
- **UX-CH01 (HIGH):** عقد الدردشة مكسور في الواجهة — الواجهة ترسل `message` والـ endpoint ينتظر `content` (+`playerName`) → كل رسائل الدردشة 400 غامض. بالعقد الصحيح chat يعمل (12/12، 312-553ms، عربي RTL، long/emoji، حظر 1000 char صريح، 403 صريح للمعرّفات الأجنبية).
- **UX-C04 + UX-CH05 (HIGH):** نمط «النجاح الصامت» — actions مجهولة (send_reaction/send_emoji) وعمل end_round من دور خاطئ → 200 success=true بلا أثر.
- **UX-V02 (HIGH):** شرائح العجلة canvas معكوسة/مائلة وغير مقروءة في الإنتاج (الصداقة، المستقبل، الضحك...).
- **UX-CH04 (MEDIUM):** لا dedup للدردشة (رسائل مكررة). | **UX-V03 (MEDIUM):** Next.js fatal page إنجليزية بلا fallback عربي. | **UX-CH07 (MEDIUM):** GET /chat → 405 — لا استرجاع مستقل للرسائل.
- **Music State Transitions (تم الفحص منطقيًا):** chiptune synth حسب المرحلة موجود (spin= default، question حسب الفئة، challenge/confession/session_end themes، fade 600-900ms) — لكن: **UX-M01 (LOW):** `BGM.toggle()` يعيد دائمًا 'default' بدل آخر theme نشط؛ وkit/Phaser AudioManager غير مستخدم (مرشح حذف وفق المعيار 2.5). **UX-028 توجيه:** ممنوع حذف حاليًا.
- **Mobile UX:** PASS تصميمي — phone-frame مقصود (430px فوق 480px)، safe-area insets، bottom-sheet بحد 480px، viewport meta سليم. لا layout shifts/clipping في snapshots 375px. **UX-M02 (MEDIUM):** إطار الهاتف دائم على ديسكتوب (مقصود).
- **Refresh/Reconnect حي:** الجلسة تُستعاد بالكامل من localStorage بعد reload (id الحقيقي + الاسم + الغرفة دون إعادة إدخال) — PASS. لكن الحالة المستعادة قد تكون ميتة (UX-H01).
- **Visual Regression:** 16 لقطة موثقة (ux-evidence/) تغطي lobby→wheel→question→chat؛ المراحل بعد reveal معطلة لذا **BLOCKED**: Answer/Rating، Special Round متقدم، Conflict/Resolution/Love Counter final.
- **Reflection privacy:** BLOCKED (reveals لا تحدث أصلًا). **NOT_IMPLEMENTED:** Conflict Room، Voice messages.
- **التسليم النهائي:** NOT_VERIFIED — لا إصلاحات نُفذت؛ النتائج موثقة في `ux-todo.md` و`ux-report-part1.md` بانتظار أمر بدء حملة الإصلاحات.

## 5. قرارات لا إصلاح لها (WONTFIX-DECISION)
- حذف SSE كليًا: غير مقرر — polling كافٍ حاليًا.
- APK: يبقى 404 على `/wheel-of-fate.apk` حتى اكتمال الاختبار النهائي ثم يعاد تفعيله.

## 6. التزام الجلسة
- بداية كل جلسة: 1) قراءة هذا الملف، 2) فحص GitHub Issues (Sentry sync)، 3) إصلاح BUG-001 → BUG-003 بالترتيب.

## 7. حلول جاهزة من المشروع المماثل (Wheel Fate الآخر — منشور على wheel-fate-5jm8zgb6.manus.space)

تلقينا تقرير حَلّ كامل من مشروع مماثل لنفس الـ Blueprint. بعد التحقق من الكود الفعلي:

| # | حلهم | ينطبق علينا؟ | الإجراء |
|---|---|---|---|
| BUG-001-مماثل (ER_DATA_TOO_LONG: roomId varchar(32) مقابل UUID بطول 36) | توسيع العمود + migration | **لا** — نحن PostgreSQL ونستخدم `text()` غير مقيد، وroomCode بطول 6 أحرف فقط | لا إجراء |
| ACK idempotency guard (إذا pendingSpinResult=null → إرجاع 200 مع `alreadyAcknowledged` بدل crash) | نعم — هو بالضبط إصلاح BUG-001 لدينا | **نعم** | يُنفذ في roadmap الإصلاح (سطر 368 في game-logic.ts) |
| Conflict Room كامل (detection threshold → alternating dialogue → mutual agreement → RESOLVED → love counter) | مشروعهم تجاوز Stage 11 ونحن لم نبدأه | **مخطط مستقبلًا** | يُدرج في roadmap عند الموافقة (ممنوع إضافة features بدون أمر) |
| Love Counter duplicate guards (refresh/reconnect/client-side manipulation) | نمط مشابه لـ reactionDone guard لدينا | **يُتأكد منه عند الإصلاح** | فحص مزدوج الـ guards في round_end/next_round |
| harness corrections (trim + snapshot قديم في reconnect) | تحسينات harness فقط | **نعم** | تُطبّق على harness عند إعادة التشغيل |

**نتيجة مشروعهم:** VERIFIED بعد إصلاح migration + 103/103 vitest + دورة عاطفية كاملة — مرجع مفيد لمنهجية الإغلاق النهائية (TypeScript → Production Build → Vitest → Harness → Regression → Persistence verification بالترتيب).

## 5-ب. نتائج Couple Browser Automation Harness (16 أغسطس 2026 — Observer فقط)
- UX-BH01 (CRITICAL): «🎡 ابدأ اللعبة!» → crash حي «This page couldn't load» في الإنتاج (معيد إنتاج BUG-001 في مرحلة جديدة).
- UX-BH02 (CRITICAL): نفس الزر في تشغيل لاحق → React error #310 (Invalid element type) + render فارغ.
- UX-BH03 (HIGH): chat من الواجهة FAIL — حقل الدردشة غير مرئي أبدًا حتى بعد اللعب (يتسق مع UX-022: الخادم ينتظر content/playerName).
- UX-BH04 (MEDIUM): صفر عناصر <audio>/Web Audio/audio network requests في كل التشغيلات — الصوت لم يُثبَت تشغيله في headless (NOT_RETESTED).
- UX-BH05 (LOW): انضمام لاعب عبر /room/CODE مباشرة ثم join flow عاد إلى / — فشل إعدادي في harness، لقطات اللوبي 375/412/1280 سليمة.
- الموثق: COUPLE-BROWSER-AUTOMATION-REPORT.md + couple-harness/ (harness.py + evidence/14 لقطة + timeline.json)
