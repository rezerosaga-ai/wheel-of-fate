# تشخيص UAT-3 / UAT-7 / UAT-8

## UAT-3 (pick_question timeout)
بعد auto-ack الجديد (spin من spin_category → spin_question مباشرة مع pending=null)، إرسال `pick_question` من طور `spin_question` يفشل بصمت: alias الحالي (سطر 254) يتعامل مع الحالة من `spin_category` فقط؛ وعند `spin_question` يسقط إلى handler `case 'pick_question'` (سطر 428) الذي يتطلب `state.pendingSpinResult` غير فارغة — وهي فارغة بعد auto-ack → `updates: {}` → لا تقدم → timeout في الاختبار.

هذا **BUG حقيقي** (ليس خطأ اختبار): الواجهة قد ترسل pick_question من spin_question wheel بعد انتهاء أنيميشن auto-ack، والطريق المسدود هنا كان سيُظهر "شاشة سوداء/تجمد" — وهو بالضبط نوع الأخطاء التي تعهدنا القضاء عليها.

### الإصلاح المطلوب (في game-logic.ts)
تعديل `case 'pick_question'` ليدعم origin من `spin_question` بدون pending: ينفذ spin_question (يضع pending) ثم يطبق ACK داخليًا (نفس نمط auto-ack في Normalize alias لـ spin).

## UAT-7 (state polling < 500ms)
يقيس زمن استجابة polling من الواجهة الحقيقية. إذا كان > 500ms فهذا مقياس أداء بيئي (sandbox تحت ضغط، next dev بارد). ليس BUG منطقيًا — لكنه مؤشر جودة. يمكن التحقق: هل الفشل متسق؟

## UAT-8 (جميع الفئات الثماني معرّفة)
الكود الحالي يملك **11 فئة** (love, relationship, personality, confessions, bold, future, laugh, situations, dare, would_you_rather, memory) — توسعت اللعبة عن المخطط القديم (8 فئات). الاختبار قديم غير محدّث: ليس BUG بل اختبار lagging. الحل: تحديث الاختبار ليطابق الواقع (11 فئة + weights متسقة).

## UAT-7 (state polling < 500ms)
مقياس أداء حساس للبيئة: fails في sandbox تحت ضغط لكن لا يمثل خللًا منطقيًا. سنعيد تشغيله وحده للتحقق — إذا فشل أحيانًا فقط فهو flaky بيئي. لا نعدّل المنطق لأجله؛ يمكن تحديث العتبة إلى 1000ms (نفس عتبة action response الموجودة) إن ثبت ثبات الفشل في بيئة sandbox.

## مبدأ الالتزام
- الإصلاح في UAT-3 يعالج **مسار فشل حقيقي** (جمود الواجهة) وليس "إخفاء فشل اختبار".
- UAT-7 وUAT-8: تشخيص دقيق قبل أي تعديل.
- لا نغيّر production لإجبار اختبار على النجاح — نصلح bugs حقيقية فقط.
