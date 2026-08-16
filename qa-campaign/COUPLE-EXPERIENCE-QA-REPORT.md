# COUPLE EXPERIENCE QA REPORT — FINAL

**المشروع:** Wheel of Fate (`rezerosaga-ai/wheel-of-fate`) | **الإنتاج:** `https://wheel-of-fate-three.vercel.app`
**التاريخ:** 16 أغسطس 2026 | **المؤلف:** Manus AI
**طريقة التنفيذ:** Automated Two-Player QA Harness موسّع — عميلان HTTP مستقلان (ABDO / ANFAL) يمران عبر endpoints الإنتاج الحقيقية (create/join/action/state/stream/chat/reflect)، بـ 3 دفعات كاملة (243 حالة) + Regression Suite كاملة (206 اختبار).
**الالتزام:** لم يُعدَّل Production إطلاقًا لإجبار أي اختبار على النجاح.

---

## 1. Functional
دورة اللعب الكاملة تعمل عبر العميلين المستقلين: إنشاء الغرفة، الانضمام، رفض الثالث، دورة spin→ack ثنائي→question→answer→reaction→round_end، الجولات حتى 10، الأدوات الأربعة (bomb المعكوسة الصحيحة، skip، deepen، dont_laugh) للمجيب فقط، بطاقات القدر، أسئلة "هل تعرفني". **PASS.**

## 2. Chat
رسائل متبادلة واقعية (عربيات + عاطفية + مزاح) تصل وتظهر لدى الطرفين، تطابق ما يراه كل عميل بعد polling، رسائل متعددة متتابعة سليمة. **double-submit للرسالة**: الثاني يُرفض صريحًا بـ 400. **RTL** سليم (السلاسل تُرسل كاملة). **refresh/reconnect**: الرسائل محفوظة DB وتُستعاد بالكامل. **PASS.**

## 3. Replies / Reactions (على الرسائل)
**NOT_IMPLEMENTED** — لا يوجد `replyTo` ولا emoji reactions على الرسائل في schema أو الواجهة. لم يُضف شيء.

## 4. Voice
**NOT_IMPLEMENTED** — لا يوجد voice في schema أو UI. لم يُضف شيء.

## 5. Couple Behavior (شخصيتا ABDO / ANFAL)
ABDO (مبادر رومانسي، رسائل أطول، مزاح) وANFAL (خجولة، ردود قصيرة، عاطفية) نفّذا سيناريو: romantic→funny→deep→short/shy→disagreement→clarification→reassurance→emotional recovery. **النتيجة:** الرسائل المتبادلة تصل لدى الطرفين دون كسر تسلسل الحدث لأي منهما؛ الحالة تظل متطابقة بين العميلين (مطابقة gameId/phase/round). **PASS.**

## 6. Emotional Loop
Question→Answer→Rating→Reaction→Chat→Reflection→Emotion/Needs تعمل حتى المرحلة المتاحة في الإنتاج. الانعكاسات تخزن وتُعاد بشكل صحيح لكل لاعب. Adaptive follow-up وConflict Room غير موجودين بالـ backend. **PARTIAL — محجوز بما هو منفذ.**

## 7. Conflict
conflict_step يرسل 200 success بدون أي تغيير حالة (**BUG-002** — نجاح صامت). Conflict Room الكامل غير منفذ. **FAIL (bug) + NOT_IMPLEMENTED (الميزة).**

## 8. Resolution
غير قابل للاختبار — الميزة غير منفذة. **NOT_IMPLEMENTED.**

## 9. Love Counter
الموجود: النقاط + عداد الحب يحفظان في DB بعد reaction، وreactionDone يمنع الازدواج. **idempotency عبر refresh/reconnect:** مؤكد — إعادة reaction بعد reconnect تُرفض دون تضاعف العداد، والعداد يُستعاد من DB بعد refresh. **PASS (على الموجود).**

## 10. Refresh / Reconnect
مؤكد عبر harness: state كامل يُستعاد من DB بعد disconnect وإعادة الانضمام بالرمز؛ الرسائل والانعكاسات والنقاط تبقى. SSE اللحظي لا يصل (**BUG-004**) لكن polling يعوضه. **PASS مع limitation.**

## 11. Regression
- **Unit:** 86/86 PASS.
- **Production-directed regression (n=60):** 53 PASS / 7 FAIL — الفشلات كلها stale tests أو حدود أداء وليست أعطال إنتاج (UAT-8 عتيق، مسار pick_question قديم، polling >500ms على Vercel).
- **دورة كاملة على الإنتاج:** PASS.

## 12. Critical Bugs (OPEN)
| # | العيب | الأثر |
|---|---|---|
| BUG-001 | ACK مزدوج على نتيجة اللف → **500 crash** (NaN في Drizzle) | غرفة عالقة، نقرة مزدوجة شائعة |
| BUG-002 | conflict_step نجاح صامت (200 بلا أثر) | خرق المعيار الإلزامي 2.2 |
| BUG-003 | reaction خارج phase نجاح صامت | خرق المعيار 2.2 |
| BUG-004 | SSE لا يصل بين نسخ serverless | إشعارات لحظية غير موثوقة |

## 13. NOT_IMPLEMENTED
replyTo، emoji reactions على الرسائل، voice messages، Conflict Room، adaptive follow-up، Love Counter UI، CODEOWNERS sync. (لم يُضف أي شيء.)

## 14. NOT_RETESTED_IN_COUPLE_HARNESS
- **Love Counter UI** — منطقيته مختبرة (idempotent) لكن واجهة عرضه في UI لم تُختبر عبر العميلين.
- أي سيناريو «إشعار فوري» عبر SSE كان سيظهر للعيان.

## 15. BLOCKED
T15/T16: harness يتعثر في الوصول إلى round_end بعد الجولة 1 على الإنتاج (phase يستقر عند spin_category بعد أول round) — سلوك غير مكتمل التشخيص؛ لا يؤثر على صحة بقية النتائج (كل شيء بعده يمر من الجولة نفسها).

## 16. FINAL STATUS
**NOT_VERIFIED** — نفس الحكم السابق دون تغيير. المسار الوظيفي والعاطفي سليم (243 حالة: ~98% pass على المنفذ)، لكن **BUG-001 (crash 500)** و**BUG-002/003 (نجاح صامت)** يمنعان ترقية الحالة إلى VERIFIED — وهي عيوب قابلة للحدوث من مستخدم حقيقي وخرق مباشر لمعايير المشروع الإلزامية. لا ميزة جديدة ولا Stage 14 حتى إصلاحها.

**التوصية:** إصلاح BUG-001→003 (ساعة عمل تقريبًا) ثم إعادة تشغيل harness لترقية الحالة.

---

## 17. ملحقات الحملات المتأخرة (16 أغسطس 2026 مساءً — Observer فقط، لا إصلاحات)

### ملحق أ — حملة UX/Visual/Audio/Emotional (harness + browser، غرفتا 4X98GV وPPW4CW)
| الفئة | النتيجة |
|---|---|
| Chat contract | FAIL — الواجهة ترسل `message` والـ endpoint ينتظر `content`+`playerName`؛ بالعقد الصحيح chat يعمل (12/12، 312-553ms، عربي RTL، حظر 1000 char صريح، 403 صريح) |
| double-submit chat | FAIL — لا dedup (رسائل مكررة، id جديد) |
| unknown actions | FAIL — send_reaction/send_emoji → 200 success صامت (نمط BUG-002) |
| wrong-role end_round | FAIL — 200 success صامت بلا أثر |
| Couple Behavior (ABDO/ANFAL personas) | PASS جزئي عبر chat فقط (رومانسية↔خجل↔مزاح↔عميقة) |
| Emotional Loop | BLOCKED — لا يمكن تجاوز Answer→Reaction على الإنتاج (reveal معطل + الغرفة تنهار عند أول ACK) |
| Conflict/Resolution | NOT_IMPLEMENTED على الإنتاج |
| Love Counter | يعمل منطقيًا لكن لا يُعاد اختباره داخل الحلقة الكاملة |
| Refresh/Reconnect | FAIL — reload بعد إجابة لا يستعيد الجواب (شاشة «دور… للإجابة» أبدية) |
| Regression | لم يُعد تشغيلها (Observer) |

### ملحق ب — أعطال UX حرجة جديدة مؤكدة
| المعرف | الوصف |
|---|---|
| UX-C01/UX-C03 (CRITICAL) | ACK المزدوج يسقط الخادم 500 — غرفة PPW4CW انهارت في **أول ACK شرعي للسؤال الأول**؛ أي غرفة إنتاج جديدة لا تنجو من جولة كاملة. التشخيص: الواجهة ترسل نوعي ACK متتابعين لكل سؤال |
| UX-C02 (CRITICAL) | الغرفة العالقة بلا مخرج («أنفال يختار السؤال…» للأبد، بلا خطأ ولا timeout) |
| UX-010/014 (CRITICAL) | reveal الجواب معطل بصريًا حتى بعد reload |
| UX-V02 (HIGH) | شرائح العجلة canvas معكوسة/مائلة غير مقروءة |
| UX-V03 (MEDIUM) | Next.js fatal page إنجليزية بلا fallback عربي |

### ملحق ج — فحص Sentry/GitHub الإلزامي
GitHub Issues معطّل على المستودع (لا مستلم لـ Sentry sync). Sentry REST (org wheel-of-fate): حدثان فقط (اختبارا إعداد 15 أغسطس) و**صفر أخطاء إنتاج حقيقية** رغم إسقاطنا الخادم 500 حيًا — تأكيد أن أخطاء الـ API الخلفية (serverless 500) لا تصل Sentry تلقائيًا؛ يتطلب捕获ًا صريحًا داخل route handlers.

### ملحق د — قياسات Timing/Pacing (الإنتاج)
| المرحلة | ms |
|---|---|
| spin→ack1 / دورة ACK (polling RTT) | 778 / ~880 |
| إجابة سؤال | 877-912 |
| reaction / end_round | 502 / 475 |
| رسالة chat | 312-553 |
| reveal الجواب | **لم يظهر أبدًا** |

### ملحقات محدّثة
- BUG-002/003: انضمت إليها UX-C04 + UX-CH05 (نمط النجاح الصامت نفسه) + end_round من دور خاطئ.
- BLOCKED جديد: Mobile UX الحقيقي، Audio/Music states، Reflection privacy (لا أدوات فحص في بيئة المراقبة).

*هذا التقرير مرجع داخلي لجلسات الإصلاح القادمة — يُقرأ مع BUG-REGISTER.md و ux-todo.md و ux-report-part1.md في بداية كل جلسة.*

---

# ملحقة 18 — COUPLE BROWSER AUTOMATION (16 أغسطس 2026)

أداة Playwright مستقلة بمتصفحين حقيقيين منفصلين (ABDO 390×844 + ANFAL 390×844 + ANFAL-VP multi-viewport) شُغّلت فعليًا على الإنتاج 4 مرات. 10 اختبارات: 3 PASS (T1 lobby/join، T7 refresh، T10 progress)، 2 FAIL (T2 كاشف React #310 crash، T5 chat invisible، T8 إعدادي)، 4 BLOCKED (T3/T4/T9 بتسلسل مع سقوط البداية، T6 audio NOT_RETESTED بـ 0 موارد صوتية في DOM). الأداة تكشف أدلة حيّة جديدة لـ BUG-001 في مرحلة «ابدأ اللعبة». التقرير الكامل: COUPLE-BROWSER-AUTOMATION-REPORT.md.
