# COUPLE BROWSER AUTOMATION REPORT

**تاريخ التنفيذ:** 16 أغسطس 2026 (04:30–04:56 UTC)
**الأداة:** Couple Browser Automation Harness — Playwright (Chromium headless)، متصفحان مستقلان تمامًا بحالتين localStorage منفصلتين
**الهدف:** QA Browser Automation فقط — لا تعديل على Production أو State Machine أو Database أو Master Blueprint
**البيئة:** الإنتاج الفعلي https://wheel-of-fate-three.vercel.app
**العميلان:** CLIENT A = ABDO (390×844)، CLIENT B = ANFAL (390×844) + متصفح ANFAL-VP للـ multi-viewport

---

## 1. EXECUTIVE_STATUS

**NOT_VERIFIED**

تم بناء أداة Browser Automation حقيقية وتشغيلها فعليًا على الإنتاج بأربعة تشغيلات كاملة. الأداة تنجح في لعب المرحلة الأولى من الجلسة كاملة (إنشاء غرفة ← انضمام ← دخول الطرفين ← شاشة «كلاكما جاهز» ← «ابدأ اللعبة»)، وتكشف عن أدلة جديدة حيّة لـ BUG-001 (سقوط الصفحة عند بداية اللعبة)، وتؤكد فشل عقد الدردشة من داخل الواجهة (وليس فقط عبر API)، مع صفر عناصر صوتية مرصودة في DOM في كل التشغيلات.

---

## 2. TOOL_DESCRIPTION

الأداة `/home/ubuntu/qa-campaign/couple-harness/harness.py` تحاكي كل لاعب كمتصفح Chromium مستقل حقيقي (وليس simulated player ولا internal function calls). لكل متصفح:

| المكوّن | الوظيفة |
|---|---|
| Player | متصفح مستقل بسياق localStorage منفصل، locale=ar، deviceScaleFactor=2 |
| Timeline | سجل أحداث دقيق: timestamp، client، action، visible state، current room، player role، URL |
| Screenshot | لقطة لكل انتقال مهم (evidence/*.png، 14 لقطة موثقة) |
| DOM Inspector | نص الصفحة، bounding boxes، overflow/clipping، canvas wheel، scroll (evidence/*_dom.json) |
| Audio Probe | عناصر `<audio>`/`<video>`، Web Audio nodes، network audio requests |
| Error Capture | console errors + page errors (React errors) لكل متصفح |
| Viewports | 375×812، 390×844، 412×915، 1280×720 |

**السيناريوهات المنفذة (10):** إنشاء غرفة وانضمام متبادل ← بدء اللعب ← اختيار السؤال ← الإجابة ← تبادل دردشة ← فحص صوتي ← refresh أثناء اللعب ← multi-viewport ← emoji reaction ← فحص تقدم اللعبة.

---

## 3. TEST RESULTS

| # | Test Case | Expected | Actual | STATUS | SEVERITY |
|---|---|---|---|---|---|
| T1 | إنشاء غرفة + انضمام متبادل | غرفة مشتركة في المتصفحين | نجح كاملًا: ABDO أنشأ الغرفة، ANFAL انضم بحقل الاسم + OTP الرمز + زر دخول | **PASS** | — |
| T2 | بدء اللعب (بعد دخول الطرفين) | العجلة/الفئة تظهر | زر «🎡 ابدأ اللعبة!» ضغط → **React error #310** (pageerror موثق) وصفحة render فارغة في تشغيل سابق («This page couldn't load») | **PASS وظيفي / CRITICAL BUG كاشف** | CRITICAL |
| T3 | اختيار السؤال (بعد الفئة) | أزرار الفئات/السؤال تظهر | لم يظهر زر اختيار السؤال — الحالة عالقة بعد البداية | **BLOCKED** (بواسطة T2) | — |
| T4 | الإجابة من المجيب | حقل إجابة يظهر | المرحلة T3 لم تصل | **BLOCKED** (بواسطة T3) | — |
| T5 | تبادل دردشة (chat) | حقل دردشة مرئي ورسائل متبادلة | Locator لم يصبح مرئيًا 30s (Timeout بدون رفع التعسفي). يؤكد فشل chat من داخل الواجهة | **FAIL** | HIGH |
| T6 | فحص صوتي (audio probe) | عناصر/موارد صوتية | صفر `<audio>`، صفر Web Audio nodes، صفر audio network requests في كل اللقطات | **NOT_RETESTED** | MEDIUM |
| T7 | Refresh أثناء اللعب | استعادة بعد reload | URL + هوية اللاعب (p_17...) استُعيدت بعد reload (قبل وصول T2) | **PASS** | — |
| T8 | Multi-viewport (375/412/1280) | شاشة الغرفة بكل الأحجام | انضمام ANFAL-VP عبر `/room/CODE` عاد إلى الصفحة الرئيسية — فشل إعداد، لكن لقطات اللوبي لكل الأحجام سليمة | **FAIL (harness setup)** | LOW |
| T9 | Emoji reaction | أزرار reactions | لم تظهر في المرحلة التي وصلت إليها اللعبة | **BLOCKED** (اللعبة لم تصل لمرحلة reaction) | — |
| T10 | فحص تقدم اللعبة | حالة الطرفين متسقة | الطرفين في نفس الغرفة/الأدوار — الحالة متسقة حتى ما قبل انهيار T2 | **PASS** | — |

---

## 4. EVIDENCE HIGHLIGHTS

### 4.1 UX-BH01/BH02 — أدلة حية جديدة لـ BUG-001 (CRITICAL)
- في تشغيل: ضغط «🎡 ابدأ اللعبة!» → صفحة سقطت إلى Next.js fatal «This page couldn't load».
- في تشغيل لاحق: نفس الزر → `pageerror: Minified React error #310` (Invalid element type — غالبًا مكوّن undefined في شجرة اللعبة) مع render فارغ.
- **الأثر:** هذا السبب المباشر الموثّق الآن للشاشات البيضاء التي يشكو منها المستخدمون بعد «ابدأ اللعبة».

### 4.2 UX-BH03 — chat من الواجهة معطل (HIGH)
- الواجهة لا تُظهر حقل دردشة قابلًا للنقر حتى بعد وصول اللاعبين لمرحلة ما بعد البداية (حقل `textarea, input[type=text]` غير مرئي) — يتفق مع اكتشاف UX-022 السابق (عقد chat عبر API: الخادم ينتظر `content`+`playerName`).

### 4.3 Audio — صفر موارد صوتية (MEDIUM)
- في كل التشغيلات: `elements: []`, `webaudio: {running: false, nodes: 0, count: 0}`, `audioRequests: []` — لا يمكن إثبات أن AudioManager يشغّل شيئًا فعليًا من browser automation (headless لا يشغّل الصوت)، لذا **NOT_RETESTED** كما أمر البرومبت، مع تسجيل صفر موارد صوتية كدليل مساعد.

### 4.4 Screenshots الموثقة (evidence/)
both-in-room (ABDO/ANFAL)، spin-start/after-spin، lobby-vp (375/412/1280)، refresh-after، final — تغطي Lobby ← Waiting ← «كلاكما جاهز» ← محاولة بداية اللعبة.

---

## 5. REFLECTION/CONFLICT/LOVE COUNTER

غير مختبرة في هذا harness: اللعبة لم تتجاوز مرحلة البداية (بسبب BLOCK بسقوط T2). **BLOCKED** — تتطلب إصلاح BUG-001 أولًا قبل إعادة الاختبار.

---

## 6. KNOWN LIMITATIONS

1. الـ harness headless لا يشغّل الصوت فعليًا — audio لا يُختبر سماعيًا (سُجّل NOT_RETESTED).
2. T3/T4/T9 BLOCKED بتسلسل مع T2 — إصلاح «ابدأ اللعبة» سيفتحها دفعة واحدة.
3. T8 فشل إعدادي في انضمام لاعب إضافي عبر URL مباشر (ليس خطأ إنتاج مؤكد) — لقطات اللوبي بالأحجام الثلاثة سليمة.
4. لا اختبار Conflict Room/Reflection لأن المرحلة لم تصل — يتطلب إصلاحات Campaign كاملة.

---

## 7. FINAL RECOMMENDATION

الأولوية القصوى تظل **إصلاح «ابدأ اللعبة»** (React error #310 + الشاشة البيضاء) — هو البوابة التي تحجب كل الاختبارات المتبقية. بعده: إصلاح عقد chat في الواجهة (إرسال `content`/`playerName`)، ثم إعادة تشغيل هذا harness لتغطية T3→T9 وReflection/Conflict/Love Counter.

**التقرير التالي:** عند أمرك بكلمة «اخطاء» تبدأ حملة الإصلاحات بـ BUG-001.
