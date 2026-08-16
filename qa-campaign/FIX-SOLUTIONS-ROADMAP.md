# ملف الإصلاحات (ROADMAP) + تقرير Couple Browser Automation (البرومبت 1/2)

**تاريخ الإنشاء:** 16 أغسطس 2026
**الغرض:** مرجع موحد يجمع خطة الإصلاحات الجاهزة + تقرير اختبار البرومبت 1/2، ليُستأنف منه العمل عند أمر «اخطاء».
**الحالة:** لا شيء نُفذ بعد — Observer فقط حتى الآن.

---

# القسم الأول: ملف الإصلاحات (ROADMAP)

## قاعدة الإلزامية (معايير Claude)
كل إصلاح في هذا الرودماب يجب أن يتضمن: 1) اختبار فشل واحد على الأقل مقابل له، 2) لا نجاح صامت (`success=true` بدون أثر = ممنوع)، 3) تحديث التوثيق المتأثر.

## الترتيب المنفذ (بحسب الخطورة المكتشفة)

| # | العنصر | المصدر | الحل الجاهز | ملاحظات |
|---|---|---|---|---|
| R1 | **React error #310 عند «🎡 ابدأ اللعبة!»** (UX-BH02) + crash «This page couldn't load» (UX-BH01) | Couple Browser Harness + جلسة المستخدم اليدوية | فحص شجرة مكوّنات GameRoom: مكوّن `undefined` يُستدعى في transition من lobby إلى play (غالبًا import دائري أو شرط عرض غير محروس في phase=playing). الحل: ErrorBoundary عربي بدل crash + إصلاح المكوّن المفقود | **أولوية قصوى — البوابة التي تحجب كل الاختبارات** |
| R2 | BUG-001 — ACK guard (pendingSpinResult=null → 200 + `alreadyAcknowledged` بدل crash 500) | BUG-REGISTER §1 + حلول المشروع المماثل | سطر ~368 في `src/lib/game-logic.ts` — guard idempotency | الحل مستعار ومُتحقق منه |
| R3 | BUG-002/003 — النجاح الصامت (conflict_step + reaction خارج phase) | BUG-REGISTER §1 | معالجات صريحة + 400 برسالة عربية واضحة | مبدأ «ممنوع النجاح الصامت» |
| R4 | UX-CH01 / UX-022 — عقد الدردشة: الخادم ينتظر `content` + `playerName` بينما الواجهة ترسل `message` | حملات chat + harness T5 | توحيد العقد في الواجهة (chat payload: `{content, playerId, playerName}`) — الخادم سليم | يفتح مرحلة chat كاملًا |
| R5 | UX-010 — reveal الجواب معطل بصريًا حتى بعد reload | حملة UX | إصلاح حالة reveal في client (polling phase + transition) | |
| R6 | الشرائح المائلة/غير المقروءة في العجلة | UX-009 | ضبط زاوية رسم شرائح canvas RTL | |
| R7 | BUG-004 — SSE على Vercel | BUG-REGISTER §1 | إبقاء REST/Polling مع polling interval أقصر (≤2s) + استبعاد SSE نهائيًا | |
| R8 | UX-M01 — music toggle يعود دائمًا للـ default | حملة UX | حفظ التفضيل في localStorage | |
| R9 | مخرج طوارئ للغرف العالقة (زر «إنهاء الجولة» / timeout تلقائي 60s مع رسالة عربية) | UX-007 | إضافة safe-exit من أي حالة | |
| R10 | فحص Guards الازدواجية في round_end/next_round (Love Counter idempotency) | حلول المشروع المماثل | إعادة استخدام نمط reactionDone guard | |

### منهجية الإغلاق النهائية (مستعارة من المشروع المماثل — كان 103/103 vitest)
TypeScript clean → Production Build → Vitest → Browser Harness → Regression → Persistence verification (DB) — بالترتيب.

---

# القسم الثاني: تقرير Couple Browser Automation (البرومبت 1/2)

**تاريخ التنفيذ:** 16 أغسطس 2026 (04:30–04:56 UTC)
**البيئة:** الإنتاج https://wheel-of-fate-three.vercel.app
**الأداة:** Playwright Harness بمتصفحين مستقلين (ABDO 390×844 + ANFAL 390×844 + ANFAL-VP)
**الحالة:** NOT_VERIFIED | 4 تشغيلات كاملة | Observer فقط — لا إصلاحات

## الأداة
`qa-campaign/harness.py` — لكل متصفح: Timeline دقيق (timestamp/client/action/visible state/role/URL) + Screenshots (14 لقطة) + DOM inspector (نص/visibility/bounding boxes/overflow/canvas/scroll) + Audio probe + اعتراض أخطاء console. Viewports: 375×812، 390×844، 412×915، 1280×720.

## النتائج (10 اختبارات)

| # | Test | STATUS | ملخص |
|---|---|---|---|
| T1 | إنشاء غرفة + انضمام متبادل | **PASS** | ABDO أنشأ، ANFAL انضم (اسم + رمز + دخول) |
| T2 | بدء اللعب | **PASS وظيفي / كاشف CRITICAL** | «🎡 ابدأ اللعبة!» → React error #310 + render فارغ / crash حي سابق |
| T3 | اختيار السؤال | BLOCKED | بتسلسل مع سقوط T2 |
| T4 | الإجابة من المجيب | BLOCKED | بتسلسل مع T3 |
| T5 | تبادل دردشة | **FAIL** | حقل الدردشة غير مرئي من الواجهة (Timeout حقيقي، لا retry لإخفاء) |
| T6 | Audio probe | **NOT_RETESTED** | صفر `<audio>`/Web Audio nodes/audio requests في كل التشغيلات |
| T7 | Refresh أثناء اللعب | **PASS** | URL + هوية اللاعب p_17... استُعيدت |
| T8 | Multi-viewport | **FAIL (إعدادي)** | انضمام ANFAL-VP عبر /room/CODE عاد لـ / — لقطات اللوبي بالأحجام الثلاثة سليمة |
| T9 | Emoji reaction | BLOCKED | المرحلة لم تصل |
| T10 | فحص تقدم اللعبة | **PASS** | حالة الطرفين متسقة حتى ما قبل انهيار T2 |

## الأدلة الحرجة الجديدة

1. **UX-BH01 (CRITICAL):** «🎡 ابدأ اللعبة!» → «This page couldn't load» حيًا في الإنتاج.
2. **UX-BH02 (CRITICAL):** نفس الزر → `Minified React error #310` (Invalid element type) — مكوّن undefined في شجرة اللعبة عند transition إلى مرحلة اللعب.
3. **UX-BH03 (HIGH):** chat من الواجهة FAIL — يتسق مع اكتشاف UX-022 (الخادم ينتظر `content`+`playerName`).
4. **UX-BH04 (MEDIUM):** صفر موارد صوتية في DOM — الصوت غير مثبت تشغيله من browser automation.
5. **UX-BH05 (LOW):** فشل إعدادي في انضمام لاعب إضافي عبر URL مباشر.

## Reflection/Conflict/Love Counter
**BLOCKED** — اللعبة لم تتجاوز مرحلة البداية بسبب R1. تعاد الاختبارات بعد الإصلاحات.

---

# ملخص الحالة النهائية (16 أغسطس 2026)

- **الحالة الكلية: NOT_VERIFIED**
- الأولوية القصوى: **R1 (React #310 عند بداية اللعبة)** — يحجب كل ما بعده.
- بعده: R2 (ACK guard) → R3 (النجاح الصامت) → R4 (عقد chat) → R5/R6 → R8/R9.
- عند الانتهاء من الإصلاحات: إعادة تشغيل هذا harness + Regression Suite → التحقق النهائي.
- كلمة البدء: **«اخطاء»** من صاحب المشروع.
