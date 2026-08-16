# مختبر المرحلة A — الاستقرار (البوابة المحجوبة)

منهجية إلزامية: Diagnose → Hypothesize → Simulate → Test → Compare → Select → Document → Implement → Verify.
القاعدة: لا نلمس الكود الحقيقي قبل إثبات الحل الأكثر تكاملًا في المختبر.

---

## A1 — React error #310 عند «ابدأ اللعبة» (UX-BH01/02)

### Diagnosis (من الكود الفعلي)

في `src/components/screens/GameRoom.tsx`:
- السطر 374: `if (phase === 'waiting') return null;`
- عدة early returns قبل السطر 479: `session_end` (س 364)، `spin_start`، `fate_card`، `know_me`، `challenge`...
- السطر 479: `const roundEndTimerRef = useRef(...)` والسطر 480: `useEffect(...)` — **hooks معلنة بعد early returns متعددة**.

قاعدة React: hooks يجب أن تُستدعى بنفس الترتيب في كل render. إذا انتقل اللاعب من phase تُعيد early return (لم تُستدعَ hooks) إلى phase تمر منها، يختل ترتيب hooks → Invalid hook call → React error #310 → صفحة سقطت إلى «This page couldn't load» أو render فارغ (مطابقة حيّة من harness: UX-BH01 صفحة انجليزية، UX-BH02 error #310).

### Hypotheses

| فرضية | الوصف | المحاكاة النظرية |
|---|---|---|
| **A1-α (المفضلة)** | نقل `roundEndTimerRef` + `useEffect` إلى أعلى المكوّن (قبل كل early return) | الحل الجراحي الأصغر: لا يغير سلوك أي phase، يضمن ترتيب hooks ثابتًا دائمًا. timer لا يعمل في early-return phases — صحيح منطقيًا (لا حاجة لـ round-end timer قبل بداية اللعب). |
| A1-β | استبدال early returns بمكوّنات فرعية render conditional (بدون return من المكوّن الرئيسي) | صحيح قواعديًا لكنه refactoring ضخم (س 240-700) — سطح كسر عالٍ، يخالف مبدأ «تقليل التعقيد». |
| A1-γ | إضافة useMemo للـ ref + try/catch حول المكوّن | try/catch لا يمنع كسر قواعد hooks؛ ref لا يقبل useMemo بشكل قانوني. مرفوضة. |

### Compatibility Test (نظري)

- الموسيقى (BGM.play في useEffect موجود أعلى الملف؟ نعم — hooks العلوية سليمة) → A1-α لا تمسها.
- roundEndTimerRef يستخدمه round_end فقط → في early-return phases لا يعمل، وهذا مطابق للسلوك الحالي (الواجهة تعتمد على roundEndTimerRef الموجود فقط عند round_end).
- لا تغيير في الـ props ولا الـ state machine.

### الاختبارات بعد التنفيذ

- **اختبار فشل مقابل:** انتقالات phase ذهابًا وإيابًا عبر waiting→spin→question→round_end→back... ×5 جولات ×10 انتقالات لكل جولة + double-click متعمد لكل زر → لا React errors في console إطلاقًا.
- **اختبار نجاح:** ABDO/ANFAL 5 جولات كاملةQuestion→Answer→Rating→Chat→reaction.

### Selected: A1-α

---

## A2 — ACK crash من النقرة المزدوجة (BUG-001 / UX-C01)

### Diagnosis

`src/lib/game-logic.ts` س 336 (`spin_category_ack`) + س 368 (`spin_question_ack`): **لا يوجد أي guard**. لا phase check ولا currentPlayer check ولا pendingSpinResult null check. نقرة ثانية على ACK:
- تعيد الانتقال إلى نفس المرحلة أو مرحلة null → NaN → crash 500 (مطابق لـ BUG-001: pendingSpinResult=null → NaN → 500).

### Hypotheses

| فرضية | الوصف | المحاكاة النظرية |
|---|---|---|
| **A2-α (المفضلة)** | guard رباعي في كل ACK handler: (1) phase مطابق، (2) playerId = currentPlayer، (3) pendingX غير null، (4) ignore double-ack مع إرجاع success بلا تحديث | حل جراحى: ACK المكرر يُبتلع بصمت (success) — يحفظ «لا نجاح صامت للخطأ» لأنه ليس خطأً بل double-click من المستخدم. يحمي من crash دون تغيير المسار السعيد. |
| A2-β | إعادة ACK مكرر كـ 400 «ack_already_processed» | دقيق تقنيًا لكنه ينتهك قواعد الواجهة (الـ client لا يتوقع fail على ACK — قد يعلّق). A2-α أكثر تكاملًا مع الواجهة الحالية. |
| A2-γ | client-side guard فقط (تعطيل الزر بعد النقر) | يخالف مبدأ «ممنوع الاعتماد على العميل» — server يجب أن يحمي نفسه. مرفوضة كحل وحيد، لكن تكملة اختيارية. |

### Compatibility Test (نظري)

- round_end + transition handlers: لا تُمس.
- refresh/reconnect: ACK يعاد إرساله أحيانًا من الواجهة بعد reconnect → A2-α (success صامت) يحمي من حالة استعادة الـ ACK المكرر — أفضل من A2-β الذي كان سيُرجع أخطاء مزعجة بعد كل reconnect.
- SSE/polling: لا تغيير على الاستجابة.

### الاختبارات بعد التنفيذ

- **اختبار فشل مقابل:** بعد spin، أرسل `spin_category_ack` 10 مرات متتالية من نفس اللاعب + 5 من اللاعب الخاطئ + 5 من phase خاطئة → كلها success بلا crash ولا تغيير حالة (باستثناء الخاطئ الذي يُبتلع). ثم أرسل النقرة الشرعية → المرحلة تتقدم طبيعيًا.
- **اختبار نجاح:** harness ABDO/ANFAL كامل بعد A1.

### Selected: A2-α

---

## Dependency Map للمرحلة A

- A2 يعتمد على A1: لا يمكن اختبار ACK الحي قبل فتح البوابة (بدون A1 اللعبة لا تبدأ أصلًا).
- A1 + A2 معًا يفتحان: chat UI الحي (UX-CH02)، reaction، reveal — كلها محجوبة بالبوابة.
