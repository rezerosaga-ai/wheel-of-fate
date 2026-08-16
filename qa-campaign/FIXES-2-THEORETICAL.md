# إصلاحات 2 — السجل النظري (فرضيات + محاكاة قبل لمس الكود)

**التاريخ:** 16 أغسطس 2026 | **المنهجية:** Repair Lab — تشخيص ← فرضية ← محاكاة ← اختيار الإصلاح الأكثر تكاملًا

## S2-01 (CRITICAL): إصلاح WHEEL-OF-FATE-3 — «Rendered more hooks than during the previous render»

**التشخيص:** خطأ Sentry من الإنتاج، 16 حدثًا في `/room/[code]` من HeadlessChrome. الفحص الآلي للمكونات كشف المرشحين.

**الفرضيات:**

| # | الفرضية | الدليل | الاحتمال |
|---|---|---|---|
| A | `RoomPage` (page.tsx): `useEffect` بعد `return` مشروط | السطر 46: `if (!player?.id) return null;` ثم لا hooks بعده — نظيف | منخفضة |
| B | `GameRoom` (L392): `if (phase === 'waiting') return null;` بعد hooks ثم **لا hooks بعده** — نظيف أيضًا (return مشروط لكن بقية المكوّن يُنفذ hooksه كاملة في render التالي... انتظر: إذا render الأول phase≠waiting نفّذ كل الـ hooks، ثم phase انتقلت لـ waiting → hooks أقل! **انتهاك قاعدة hooks**) | تطابق تام مع الرسالة + HeadlessChrome يمر برحلة كاملة (phase تتغير كثيرًا) | **عالية** |
| C | Hook داخل if-block | الفحص الآلي: صفر حالات | معدومة |

**المحاكاة النظرية (قبل اللمس):**
- الحالة B: إذا مرّ render بعدد N من hooks (phase=spin_start) ثم في render التالي phase=waiting → return null مبكرًا → عدد hooks أقل → React يرمي «Rendered more hooks than during the previous render». **هذا السيناريو ممكن تمامًا:** عند انتقال round_end → waiting (انتهاء الجولة) أو refresh أثناء انتقال.
- هل `phase === 'waiting'` يحدث فعلًا داخل GameRoom؟ GameRoom يُعرض فقط عند `GAME_PHASES.has(phase)` — و'waiting' **ليست** في GAME_PHASES... لكن race condition: useGameStore يُحدّث phase عبر polling → render وسط انتقالي مع phase=waiting → GameRoom يُصيّر ثم return null. HeadlessChrome (harness) يسبب هذا النمط بكثافة.

**الإصلاح المقترح (B):** استبدال `if (phase === 'waiting') return null;` بـ rendering شاشة الانتظار بدل null — أو الأسلم: إزالة الـ early return كليًا وجعل GameRoom يتعامل مع كل الأطوار غير المصنفة كشاشة افتراضية (spinner). الأنسب تكاملًا: **عرض WaitingRoom داخل GameRoom عند phase=waiting** (لا ينقص عدد hooks، سلوك متسق).

**تحذير تكامل:** GameRoomLayout يعتمد على gameState — عند waiting قد تكون gameState فارغة → يجب guard.

## S2-02 (LOW): حل WHEEL-OF-FATE-1 و2 في Sentry (أحداث إعداد تجريبية) — resolve عبر Sentry API لتنظيف القائمة.

## S2-03 (MEDIUM — ملاحظة): UAT-2 timeout — عولج في الثلاثية (testTimeout=15000). موثّق هنا للاكتمال.

## S2-04 (مستبعد، لا إجراء): AnswerReveal useState/useEffect (L988-990) — مكون مستقل بنفس عدد الـ hooks دومًا — نظيف.

## قرار المصفاة (ما يدخل إصلاحات 3)
S2-01 يدخل مؤكد (CRITICAL من الإنتاج). S2-02 يدخل كتنظيف. S2-03 مغلق. S2-04 لا إجراء.
