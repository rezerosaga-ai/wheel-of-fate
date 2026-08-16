
## تحديث 16/8/2026 — Phase A مكتملة فعليًا (12/12 PASS)
- BUG-001 (Double-ACK crash): ACK guards في spin_category_ack + spin_question_ack → PASS
- BUG-002/003 (Silent successes): أفعال غير معروفة ترجع error صريحًا → PASS
- React #310: إعادة ترتيب hooks في GameRoom.tsx → تم سابقًا
- T1: إصلاح alias pick_question ليدعم الاستدعاء من spin_category (المسار الحقيقي من الواجهة) — دمج استدارة الفئة + ACK كامل (مع double_challenge) قبل استدارة السؤال.
- ملاحظة QA: أخطاء TS2554 في stage-a-test.ts كانت بسبب check() يتطلب 3 args — أُصلحت بـ default param.
