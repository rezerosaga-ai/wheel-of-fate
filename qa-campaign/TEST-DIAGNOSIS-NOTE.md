# تشخيص فشل "جولة كاملة" — النهائي

## السبب الجذري المؤكد
اختبار "جولة كاملة" (القديم والجديد) يعتمد على تدفق: `spin_start → spin → spin_category → spin_category_ack → spin_question → spin_question_ack → question → ...`.

لكن في الكود الحالي هناك **عدم تطابق بين منطق `spin` ومنطق `spin_category_ack`**:

- `spin` من `spin_start` ينتقل إلى `spin_category` مع `pendingSpinResult: null` (السطر 391-401).
- `spin` من `spin_category` يضبط `pendingSpinResult` ويبقى في `spin_category` (السطر 402-417).
- `spin_category_ack` **يتطلب** `pendingSpinResult` غير فارغة (سطر 483) وإلا يرجع `updates: {}` صامت.

إذن المسار الكامل عبر `spin` من `spin_category` + `spin_category_ack` يعمل، لكن فقط عندما تكون phase قبل `spin` هي `spin_category` بالفعل. عند التشغيل، الاختبار نجح في الوصول إلى `spin_category`، ثم `spin_category_ack` أعاد updates:{} لأن الحالة وصلت عبر lobby spin؟ لا — في النسخة الجديدة نبدأ من `spin_start` ثم `spin` ينقل إلى `spin_category` مع **pending=null**، ثم ACK يُرفض صامتًا.

الحل في منطق اللعبة: `spin` من `spin_category` (عجلة الفئة الحقيقية) يحتاج أن يتبعه ACK. لكن ACK يتطلب pending. يجب أن يكون `spin` من `spin_category` يضبط pending (وهو يفعل — سطر 402+)، لكن الشرط `['spin_category', 'round_end', 'spin_question'].includes(state.phase)` صحيح. إذن عند وصولنا إلى `spin_category` من lobby spin (بدون pending)، نحتاج **spin ثانية** حقيقية قبل ACK. الاختبار القديم كان يرسل spin في فرع else (من spin_question في round تراكمي)... في الاختبار الجديد من غرفة مستقلة: بعد lobby spin، phase=spin_category وpending=null → يجب إرسال spin (عجلة الفئة) ثم ACK.

## المسار الصحيح للاختبار (غرفة مستقلة)
1. spin_start → spin → spin_category (pending=null)
2. spin (عجلة الفئة، currentPlayer) → spin_category (pending=نتيجة)
3. spin_category_ack (currentPlayer) → spin_question (pending=سؤال)
4. spin_question_ack → question
5. answer → reaction → react_love → round_end
6. end_round → spin_category (pending=null) ثم يمكن التوقف.

## الخلاصة
الاختبار القديم كان "يمر صدفة" عندما كان round التراكمي يترك الحالة بحيث spin يُرسَل من spin_category صحيحًا ثم ACK يعمل. إعادة كتابته بالمسار الصحيح الكامل تحل المشكلة نهائيًا وتوثق العقد الصحيح بين العجلة والـ ACK.
