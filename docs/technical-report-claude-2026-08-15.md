# التقرير التقني — Wheel of Fate (عجلة الحظ)

**التاريخ:** 15 أغسطس 2026 (03:30 UTC)
**مصدر التقرير:** Manus (مطور الواجهة الأمامية والمنطق والاستقرار)
**موجه إلى:** Claude AI — المحلل التقني للمشروع
**الغرض:** نقطة استئناف شاملة تمكّن Claude من متابعة التحليل والتوجيه من هذه النقطة بدقة.

---

## 1. الملخص التنفيذي

مشروع **Wheel of Fate** هو لعبة ويب رومانسية تفاعلية لشخصين (عبدو × أنفال) مبنية على فكرة "عجلة الحظ": يدور اللاعبان عجلة تختار فئة، ثم عجلة ثانية تختار سؤالاً، ثم يجيب أحدهما ويقوّم الآخر ردّه بإيموجي يُترجم إلى نقاط. المشروع مرّ بمرحلة اضطراب سبّبها إضافة ميزات غير ناضجة (متجر، إشعارات، ثيمات) أدت إلى تدمير الاستقرار، وتمت العودة إلى baseline مستقر `4c5777d3` ثم تطبيق إصلاحات استقرار مدروسة فوقه. النتيجة الحالية: **النسخة الجديدة منشورة على الإنتاج، وجميع تدفقات اللعبة (spin → question → answer → reaction → challenge → round_end) تعمل بشكل صحيح عبر API**، بانتظار التحقق البصري النهائي (الفليكر ومدّة دوران العجلة) من جهاز المستخدم.

| البند | الحالة |
|:---|:---|
| استقرار المنطق الخادمي (game-logic) | ✅ مثبت عبر اختبار حي على الإنتاج |
| إصلاح الفليكر (استخراج Layout) | ✅ مدمج في الكود — بانتظار التحقق البصري من المستخدم |
| إصلاح دوران العجلة اللانهائي | ✅ المنطق الخادمي يعمل، بانتظار التحقق البصري |
| إصلاح challenge_answer (حفظ الإجابة) | ✅ مثبت على الإنتاج |
| عرض أسماء اللاعبين بدل Raw IDs | ✅ مثبت على الإنتاج |
| README منظم بروابط مباشرة | ✅ منشور |
| Android TWA (APK) | ⚠️ ملف 432KB في `public/` لكن غير مُختبر منذ العودة للـ baseline |

---

## 2. سياق المشروع

| المكوّن | التقنية |
|:---|:---|
| الإطار | Next.js 15 (App Router, Turbopack) |
| اللغة | TypeScript strict |
| التنسيق | CSS Variables في `globals.css` (نمط "وردي/كيوت" بدون Tailwind) |
| قاعدة البيانات | Neon PostgreSQL + Drizzle ORM |
| إدارة الحالة | Zustand |
| الوقت الحقيقي | SSE مع polling fallback كل 3 ثوانٍ |
| العجلة | Canvas 2D (`SpinWheel.tsx`) — quintic + elastic easing مع particles |
| الأصوات | Web Audio API / Oscillator — لا ملفات صوتية خارجية |
| النشر | Vercel (auto-deploy عند push إلى main) |
| Android | APK غلاف TWA (Chrome Custom Tabs) |
| الاختبارات | vitest: 83 unit + integration + load + UAT |
| المستودع | [github.com/rezerosaga-ai/wheel-of-fate](https://github.com/rezerosaga-ai/wheel-of-fate) |

**الإنتاج:** [wheel-of-fate-three.vercel.app](https://wheel-of-fate-three.vercel.app)
**التطبيق:** [صفحة التحميل](https://wheel-of-fate-three.vercel.app/download)

---

## 3. البنية الرئيسية للملفات

```
src/
├── components/screens/
│   ├── GameRoom.tsx            ← منطق اللعبة الرئيسي (741 سطر) — يستدعي GameRoomLayout
│   ├── GameRoomLayout.tsx      ← 296 سطر — Layout مستخرج (إصلاح الفليكر)
│   ├── HomeScreen.tsx          ← الرئيسية + onboarding مزاج
│   └── SessionEnd.tsx          ← نهاية الجلسة + مشاركة
├── components/game/
│   ├── SpinWheel.tsx           ← عجلة Canvas (الفئات + الأسئلة)
│   ├── ChatPanel.tsx           ← دردشة مع onMessageSent callback
│   ├── QuestionCard.tsx        ← بطاقة السؤال
│   ├── ChallengeCard.tsx       ← بطاقة التحدي
│   ├── FateCard.tsx / KnowMe.tsx / PlayerTools.tsx / ScoreBar.tsx
├── hooks/
│   ├── useRoomSSE.ts           ← sync: SSE + polling fallback (3s) + deduping
│   └── usePushNotification.ts  ← push "دورك" notification
├── lib/
│   ├── game-logic.ts           ← آلة الحالة الخادمية (754 سطر) — مصدر الحقيقة الوحيد
│   ├── questions.ts            ← 1027 سطر — بنك الأسئلة
│   ├── sounds.ts               ← محرك الأصوات
│   └── api.ts                  ← client API wrapper
├── app/api/room/
│   ├── create/route.ts, join/route.ts
│   └── [code]/{action, state, chat, stream, reflect}/route.ts
├── db/schema.ts                ← Drizzle schema
└── tests/                      ← vitest suites
```

---

## 4. حالة المستودع (Git)

| Commit | الوصف | ملاحظة |
|:---|:---|:---|
| `4c5777d3` | **Baseline المستقر** — "Remove dual polling flicker + TWA chat fixes" | نقطة الانطلاق الموثوقة |
| `882b3a8` | `refactor: stability` — استخراج GameRoomLayout + إصلاحات الاستقرار | من منا |
| `9ddfd14` | `merge: add 'your turn' push notification` — دمج `notifyTurn` من commit قديم | من منا |
| `384603a` | `docs: rewrite README` — منظم مع روابط مباشرة | HEAD = main |
| ~~`c86483e`~~ | commit من session قديمة (Layout داخلي داخل GameRoom — **نفس سبب الفليكر**) | تم استبداله بـ force-push |
| ~~commits HappySeeds~~ | إضافة متجر/إشعارات/ثيمات أدت لعدم الاستقرار | حُذفت بالكامل |

**تواريخ مهمة:** `4c5777d3` هو نفس baseline الذي كان التطبيق الوردي "عجلة الحظ" (v1.5.0 APK الذي كان يعمل) يعمل عليه.

---

## 5. دورة اللعبة وآلة الحالة (State Machine)

التدفق الرسمي المفروض من `game-logic.ts`:

```
waiting → (انضمام p2) → spin_start → spin_question (عجلة الفئات)
→ question → reaction → round_end → next_round → spin_question → ...
→ session_end (عبر end_session)
```

**تفاصيل التنفيذ:**

1. **الانضمام** (`join`): عندما ينضم اللاعب الثاني، تتحول الحالة تلقائياً من `waiting` إلى `spin_start`.
2. **العجلات:** واجهة المستخدم ترسل action بسيط `spin`، و`game-logic.ts` يحتوي **aliases** تحوّله:
   - من `spin_start`/`waiting` → `spin_start` (يبدأ العجلة)
   - من `spin_category` → `spin_category` + auto-ack → `spin_question` (اختيار الفئة فوراً)
   - UI ترسل `pick_question` من `spin_question` → auto-ack → `question`
3. **الردود والإيموجي:** `answer` → `reaction` → إيموجي الطرف الآخر (`react_love`/`laugh`/`deep`/`touching`/`bold`/`close`) يُحوَّل إلى `submit_reaction` بنقاط +1/+1/+2/+2/+2/+3 → `round_end`.
4. **التحدي:** من `reaction` يمكن إصدار `use_challenge` (ينتقل إلى `challenge`) ثم `challenge_answer` يحفظ إجابة المتحدّى في DB ويقلّص `challengeQuestionsLeft`.
5. **الأدوات:** قنبلة 💣، تخطّي ⏭️، تعمّق 🔍، لا تضحك 😂، رسالة سرية 💌.

**Action aliases الكاملة** (الواجهة ترسل اليسار، الخادم يستقبل اليمين):

| واجهة | خادم (canonical) |
|:---|:---|
| `spin` | spin_start / spin_category(+auto-ack) |
| `pick_question` | spin_question (+auto-ack) |
| `answer` | `submit_answer` |
| `react_love` … `react_close` | `submit_reaction` بنقاط مختلفة |

---

## 6. الإصلاحات المطبقة فوق baseline (وهي جوهر هذه المرحلة)

### 6.1 إصلاح الفليكر (الأهم)

**المشكلة:** كان `Layout` يُعرَّف **داخل** مكوّن `GameRoom` كدالة — كل polling (حتى SSE) يعيد بناء الدالة ويعطيها مرجعاً جديداً → React يزيل ويعيد بناء DOM بالكامل → وميض أبيض مرئي + فقدان حالة العجلة أثناء الدوران (دوران لانهائي >15 ثانية).

**الحل:** استخراج `GameRoomLayout` إلى وحدة مستقلة `src/components/screens/GameRoomLayout.tsx` (296 سطر) يستقبل props ثابتة، فلا يُعاد بناؤه مع كل state update. بالإضافة إلى `backface-visibility: hidden` و`-webkit-tap-highlight-color: transparent` في `globals.css`.

**ملاحظة تحليلية مهمة لـ Claude:** نفس الخطأ كان موجوداً في commit `c86483e` الذي حاول حل المشكلة سابقاً — أي أن الجلسة القديمة لم تفهم الجذر الحقيقي.

### 6.2 إصلاح دوران العجلة اللانهائي

**المشكلة:** العجلة تدور دون توقف أو أن التوقف لا يتزامن مع arrival الحالة الصحيحة من الخادم.

**الحل (منطق):** aliases تجعل اختيار الفئة والسؤال يتمان في خطوة خادم واحدة (spin → auto-ack → spin_question فوراً)، فلا يعتمد العرض على انتظار polling لاحق. UI يبدأ أنيميشن العجلة فور استلام response (fix داخل `doAction`).

### 6.3 إصلاح challenge_answer

**المشكلة:** `challengeAnswer` كان يُعيَّن `null` قبل الحفظ في DB — إجابات التحدي كانت تضيع.

**الحل:** الحفظ يحدث دائماً بالـ `trimmedAnswer` سواء في منتصف التحدي أو نهايته.

### 6.4 إصلاح مزامنة الدردشة

**المشكلة:** رسالة الدردشة تُرسل بنجاح لكن لا تظهر عند الطرف الآخر حتى polling التالي (~3 ثوانٍ).

**الحل:** `ChatPanel.send()` يستدعي `onMessageSent` → `GameRoom` يمرر `poll` → تحديث فوري.

### 6.5 إصلاح Raw IDs

**المشكلة:** تظهر أسماء مثل `p_123...` بدلاً من أسماء اللاعبين.

**الحل:** `room` response يتضمن `player1Name`/`player2Name` وتستخدمهما المكونات مباشرة.

### 6.6 مزامنة قوية (useRoomSSE)

- SSE هو القناة الأساسية + **polling fallback كل 3 ثوانٍ** عند انقطاع SSE.
- deduping: مقارنة `updatedAt` قبل `setState` لتجنب re-renders زائدة.

### 6.7 إشعار "دورك" (notifyTurn)

دمج إصلاح من session قديمة: عند انتهاء reaction round، يُستدعى `POST /api/push/send` لإرسال إشعار "دورك" للطرف الآخر (يُستدعى من action route عند الحاجة).

### 6.8 تحديث الفئات الـ 11

إضافة 3 فئات جديدة (commit سابق `7808411`) + تحديث كل labels العربية والإيموجي:

| الفئة | بالعربي | الإيموجي |
|:---|:---|:---|
| love | الحب | 💕 |
| relationship | علاقتنا | 💞 |
| personality | شخصيتك | 🧠 |
| confessions | اعترافات | 💌 |
| bold | الجريئة | 🔥 |
| future | المستقبل | 💭 |
| laugh | المضحك | 😂 |
| situations | المواقف | 🎭 |
| dare | تحدي جرئ | 🎯 |
| would_you_rather | لو خيّرتك | 🤔 |
| memory | الذكريات | 📸 |

**تنبيه للمحلل:** ملف `questions.ts` يحتوي 11 فئة في `CATEGORIES` لكن `Category` union type كان ناقصاً (يبدو أن `memory` غائبة من union رغم وجودها في القائمة — يستحق فحصاً دقيقاً؛ الاختبارات تمرر لكن يجب التحقق من `questions.ts` line 4 مقابل line 880).

---

## 7. نتائج الاختبار الحي على الإنتاج (15 أغسطس 2026)

غرفة الاختبار: `7AV2QU` (player1: manus-qa-1، player2: anfal-qa-1). كل الاستدعاءات عبر `https://wheel-of-fate-three.vercel.app/api/room/...`.

| # | الخطوة | النتيجة المرصودة |
|:---|:---|:---|
| 1 | إنشاء غرفة | ✅ status=waiting، code=7AV2QU |
| 2 | انضمام p2 | ✅ auto-transition إلى spin_start |
| 3 | spin (جولة 1) | ✅ → spin_question، category=`would_you_rather` |
| 4 | pick_question | ✅ → question، q=625 |
| 5 | answer | ✅ → reaction، ansBy=manus-qa-1 |
| 6 | react_love من p2 | ✅ → round_end، p2Score=+1 |
| 7 | next_round | ✅ → دور p2، spin_category |
| 8 | spin + pick_question (جولة 2) | ✅ q=552، category=`bold` |
| 9 | answer + react_laugh | ✅ round_end، p1Score=+1، scores 1-1 |
| 10 | next_round (جولة 3) | ✅ دور p1 |
| 11 | spin + pick + answer + react_deep | ✅ category=`situations`، q=520، scores 3-1 |
| 12 | use_challenge من p1 | ✅ → phase=challenge، message=`challenge_issued` |
| 13 | challenge_answer من p2 | ✅ الإجابة تُحفظ في DB، left=1 (إصلاح يعمل) |
| 14 | end_session | ✅ → session_end |
| 15 | chat (playerName عربي) | ✅ يظهر "AnfalQA" وليس Raw ID |

**الخلاصة الخادمية:** كل تدفقات `game-logic.ts` تعمل بشكل صحيح على الإنتاج. لا توجد حلقات state، لا أخطاء 500، لا فقدان إجابات.

**المحدودية:** الاختبار كان عبر API (curl/Python) — لم يتحقق من **التجربة البصرية** على المتصفح/الهاتف: الفليكر، مدة أنيميشن العجلة، ورقة الاحتفال المعلقة في منتصف الشاشة. هذه تحتاج فحصاً يدوياً من المستخدم.

---

## 8. المشاكل المرصودة سابقاً (من المستخدم) والتي تنتظر التحقق

| # | المشكلة | الوصف | الحالة |
|:---|:---|:---|:---|
| 1 | الفليكر | وميض شاشة البداية + ومضات خفيفة في الغرفة (3 ومضات متتالية قبل نهاية الجولة 1) | إصلاح Layout مدمج — بانتظار التحقق البصري |
| 2 | دوران العجلة الطويل | العجلة بقيت تدور أكثر من 15 ثانية قبل الإصلاحات | المنطق ثابت — بانتظار التحقق البصري |
| 3 | ورقة الاحتفال المعلقة | confetti تعلق في منتصف الشاشة ثم تذهب ثم تظهر العجلة | غير مفحوص بعد الإصلاح |
| 4 | التحدي المتأخر | التحدي ظهر بعد مدة زمنية بدل الفوري | منطقياً يعمل الآن — بانتظار التحقق |

---

## 9. البيئة التشغيلية (للاستخدام)

| البند | القيمة |
|:---|:---|
| المستودع | `rezerosaga-ai/wheel-of-fate` (public) |
| branch | main — deploy تلقائي على Vercel |
| Production URL | wheel-of-fate-three.vercel.app |
| Vercel team | wheel2 |
| قاعدة البيانات | Neon (US East-2) — connection string في Vercel env |
| env vars | DATABASE_URL, NEXTAUTH_URL, NEXTAUTH_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET |
| dev port | 3000 (sandbox الحالي: `pnpm dev`) |
| الاختبارات | `pnpm test` (vitest — 83 unit)، `pnpm typecheck` |
| APK | `public/wheel-of-fate.apk` (432KB) — تُرفع مع كل deployment |
| assetlinks | `public/.well-known/assetlinks.json` (SHA-256 محدث) |

**نقاط تحقق Vercel عبر API:**
```bash
curl -H "Authorization: Bearer <token>" \
  "https://api.vercel.com/v6/deployments?projectId=prj_P3iXrWZugiYCf3c4JCT1zTqHAe2y&teamId=team_s9EqTRxTO1jEwfvJ8OcCyxl6&limit=5"
```
(v13 API يعيد 400 — استخدم v6).

---

## 10. قرارات استراتيجية وثّقتها الجلسة السابقة (قواعد غير قابلة للكسر)

1. **المتجر/Shop مُعلَّق:** لا تُعاد إضافة أي كود متجر/إشعارات/ثيمات قبل إثبات استقرار كامل. الكود المتبقي منها حُذف.
2. **HappySeeds شريك سابق:** توقف التعاون؛ لا تُعتمد إصلاحاته دون فحص (commit `c86483e` الخاص به كرّر نفس خطأ الفليكر).
3. **الbaseline الموثوق:** `4c5777d3` — أي تراجع مستقبلي يكون إليه.
4. **APK v1.5.0 (bubblewrap)** كان النسخة المستقرة (1.2MB، "عجلة الحظ" الوردي). الـ APK الحالي (432KB) من session قديمة غير مختبر.
5. **قاعدة البيانات لا تُسترد** — حذر شديد مع DDL/DML المدمر.
6. **المحتوى المخصص (أسئلة عبدو×أنفال) هو جوهر المنتج** — أي APIs خارجية طبقة إضافية فقط.

---

## 11. الخطة القادمة المقترحة (بعد اكتمال التحقق البصري)

| المرحلة | المحتوى | الأولوية |
|:---|:---|:---|
| 1 | اختبار بصري نهائي من المستخدم (فليكر، العجلة، confetti) | فورية |
| 2 | إصلاح أي ملاحظة بصرية تظل قائمة (confetti، timers) | عالية |
| 3 | إعادة بناء APK v1.5.0 عبر bubblewrap + POST_NOTIFICATIONS فقط | متوسطة |
| 4 | إضافة محتوى خارجي (JokeAPI, aztro, YesNo) عبر `api/external/` كما اقترح تقرير public-apis | لاحقة |

---

## 12. أسئلة مفتوحة على المحلل (Claude)

1. هل يوجد خطر في اعتماد pattern الـ "aliases" في `game-logic.ts` (spin/pick_question) مقابل explicit two-phase spin؟ هل يمكن أن يحصل double-apply عند latency عالي؟
2. ورقة الاحتفال المعلقة (confetti) — هل سببها محتمل أن confetti تُطلَق من `onSpinEnd` + `doAction` في نفس tick؟ مراجعة `GameRoom.tsx` lines ~280-300.
3. هل مدة أنيميشن العجلة (quintic+elastic في SpinWheel) قابلة للتقليل إلى <3 ثوانٍ مع الحفاظ على الإحساس الفيزيائي؟
4. SSE + polling fallback: هل هناك سيناريو double-update عند وصول نفس البيانات عبر القناتين؟

---

*أُعدّ بواسطة Manus — 15 أغسطس 2026. الملف قابل للتوسع: أضف تحديثاتك في نهاية الأقسام المناسبة مع التاريخ.*
