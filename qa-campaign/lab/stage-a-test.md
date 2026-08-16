
## إعادة تشغيل 16/8/2026 (بعد إصلاح alias pick_question)
- T1: PASS 12/12 بعد إصلاح pick_question alias (يدعم الآن الاستدعاء من spin_category — المسار الحقيقي من الواجهة).
- الجذر: alias كان يستدعي spin_question مباشرة من spin_category دون استدارة الفئة وأكها — phase check يفشل.
- الإصلاح: دمج spin_category + ACK كامل (double_challenge message) قبل spin_question ثم ACK إلى question.
