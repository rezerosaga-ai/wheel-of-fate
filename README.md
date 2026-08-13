# 🎡 Wheel of Fate — عجلة الحظ
> **للوكيل الذكي:** اقرأ هذا الملف كاملاً قبل أي تعديل. يحتوي على كل ما تحتاجه لاستئناف البناء بدون شرح إضافي.

لعبة علاقة تفاعلية لشخصين بالوقت الفعلي، عربية RTL كاملة، مبنية بـ Next.js 15 + PostgreSQL.

---

## 🔗 روابط المشروع

| الرابط | الوصف |
|--------|-------|
| **Production** | `https://wheel-of-fate-three.vercel.app` |
| **GitHub** | `https://github.com/rezerosaga/wheel-of-fate` |
| **Vercel Dashboard** | `https://vercel.com/wheel2/wheel-of-fate` |
| **Dev Server** | `http://localhost:13000` (port ثابت) |

---

## 🛠 البيئة التقنية

```
Framework:     Next.js 15 (App Router, Turbopack)
Language:      TypeScript (strict, no @ts-ignore allowed)
Styling:       CSS Variables (globals.css) — NO Tailwind
Database:      PostgreSQL + Drizzle ORM
State:         Zustand
Package Mgr:   pnpm
Dev Port:      13000
Deploy:        Vercel (auto-deploy on push to main)
```

### الأوامر الأساسية
```bash
pnpm dev          # تشغيل المطور على port 13000
pnpm build        # بناء الإنتاج
pnpm typecheck    # فحص TypeScript بدون emit
pnpm test         # تشغيل الاختبارات (vitest)

# في بيئة sandbox:
supervisorctl restart dev-server   # إعادة تشغيل الخادم
```

### متغيرات البيئة المطلوبة
```env
DATABASE_URL=postgresql://...        # Neon PostgreSQL
OPENAI_API_KEY=sk-...               # اختياري — للتحليل الذكي
```
**ملاحظة:** هذه المتغيرات موجودة في `.env.local` (مستثنى من git) وفي Vercel Dashboard → Settings → Environment Variables.

---

## 📁 هيكل الملفات المهم

```
src/
├── app/
│   ├── page.tsx              ← نقطة الدخول — يحتوي AgeGate
│   ├── layout.tsx            ← RTL، Cairo font، PWA manifest
│   ├── globals.css           ← كل CSS Variables + kawaii design tokens
│   ├── privacy/page.tsx      ← صفحة سياسة الخصوصية (مطلوبة لـ Google Play)
│   ├── terms/page.tsx        ← صفحة شروط الاستخدام (مطلوبة لـ Google Play)
│   └── api/room/[code]/
│       ├── action/route.ts   ← تنفيذ الأفعال (spin, answer, skip...)
│       ├── chat/route.ts     ← الدردشة (حد 1000 حرف)
│       ├── reflect/route.ts  ← حفظ التأملات + AI analysis
│       └── state/route.ts    ← polling حالة اللعبة
│
├── components/
│   ├── AgeGate.tsx           ← تحقق العمر (17+) — يُعرض مرة واحدة فقط
│   ├── screens/
│   │   ├── HomeScreen.tsx    ← الرئيسية + Onboarding mood + Streak
│   │   ├── GameRoom.tsx      ← الغرفة الرئيسية (كل مراحل اللعبة)
│   │   ├── SessionEnd.tsx    ← نهاية الجلسة + Share + Achievements
│   │   └── WaitingRoom.tsx   ← انتظار اللاعب الثاني
│   └── game/
│       ├── SpinWheel.tsx     ← عجلة Canvas (quintic+elastic, HiDPI, particles)
│       ├── ChatPanel.tsx     ← دردشة glassmorphism
│       ├── QuestionCard.tsx
│       ├── ChallengeCard.tsx
│       ├── FateCard.tsx
│       ├── KnowMe.tsx
│       ├── PlayerTools.tsx   ← bomb/skip/deepen/dontlaugh
│       └── ScoreBar.tsx
│
├── lib/
│   ├── game-logic.ts         ← آلة الحالة الخادمية (state machine)
│   ├── questions.ts          ← 405 سؤال عربي، 8 تصنيفات
│   ├── sounds.ts             ← Web Audio API engine
│   ├── player-stats.ts       ← Streak + 7 Achievements (localStorage)
│   ├── api.ts                ← client API wrapper
│   └── llm.ts                ← LLM integration
│
├── db/schema.ts              ← Drizzle ORM schema
├── store/useGameStore.ts     ← Zustand global store
│
└── tests/
    ├── unit/                 ← 83 اختبار (vitest)
    ├── integration/          ← 23 اختبار
    ├── load/                 ← 5 اختبارات حمل
    └── uat/                  ← 32 اختبار قبول
```

---

## 🗄 قاعدة البيانات (Drizzle Schema)

```sql
wof_rooms              — الغرف (code, player1_id, player2_id, status)
wof_game_states        — حالة اللعبة الحية (phase, scores, current_question...)
wof_chat_messages      — رسائل الدردشة (max 1000 chars)
wof_reflections        — تأملات بعد الجلسة
wof_topics             — الموضوعات
wof_conflict_sessions  — جلسات النزاع
```

**تحذير:** لا تعدّل الـ schema بدون migration. استخدم `pnpm drizzle-kit generate` ثم `pnpm drizzle-kit push`.

---

## 🎮 منطق اللعبة (Game Flow)

```
lobby → spinning → question → answering → round_end → [repeat] → game_over
```

- اللاعب يدور العجلة → تختار سؤالاً عشوائياً من التصنيف
- كلا اللاعبَين يجيبان → يصوّت كل منهما على إجابة الآخر
- النقاط تُحسب → round_end يعرض النتيجة → جولة جديدة
- بعد N جولات → game_over → SessionEnd

**الـ Polling:** كل 1.5 ثانية `GET /api/room/[code]/state`

---

## 📊 حالة المشروع

### ✅ مكتمل (المرحلة 0 + المرحلة 1 جزئياً)
- [x] العجلة Canvas + فيزياء + أصوات Web Audio
- [x] Multiplayer polling real-time
- [x] 405 سؤال عربي 8 تصنيفات
- [x] Mini-games: know_me, challenge, fate_card
- [x] AI reflection analysis
- [x] Onboarding mood selector (6 أمزجة)
- [x] Streak يومي + 7 Achievements (localStorage)
- [x] Share النتيجة (Web Share API + clipboard)
- [x] **Privacy Policy** صفحة `/privacy`
- [x] **Terms of Service** صفحة `/terms`
- [x] **Age Gate** تحقق 17+ عند أول دخول
- [x] **manifest.json** محدَّث للـ TWA
- [x] **assetlinks.json** جاهز في `/.well-known/`
- [x] اختبارات: 83 unit + 23 integration + 5 load + 32 UAT

---

## 🗺 خارطة الطريق للـ Google Play

### المرحلة 1 — الحد الأدنى للنشر ✅ مكتملة
```
✅ Privacy Policy (/privacy)
✅ Terms of Service (/terms)
✅ Age Gate (17+) — يُخزن في localStorage
✅ manifest.json محدَّث (TWA-ready)
✅ assetlinks.json في /.well-known/
⏳ توليد APK عبر PWABuilder (يدوي — انظر تعليمات أدناه)
⏳ اختبار على 3 أجهزة أندرويد
```

**لتوليد APK (خطوات يدوية):**
1. افتح https://www.pwabuilder.com
2. أدخل `https://wheel-of-fate-three.vercel.app`
3. اختر Android → Trusted Web Activity
4. Package name: `ai.rezerosaga.wheeloffate`
5. حمّل الـ APK + keystore
6. أضف SHA256 fingerprint من الـ keystore في `/public/.well-known/assetlinks.json`

---

### المرحلة 2 — استقرار الإنتاج ⏳ لم تبدأ

**المشاكل الحالية:**
- الـ Polling (كل 1.5 ثانية) سيُرهق الخادم مع 1000+ مستخدم
- لا يوجد نظام مصادقة → المستخدم يفقد بياناته عند تغيير الجهاز
- قاعدة البيانات Neon مجانية → محدودية في الاتصالات المتزامنة

**المطلوب:**
```
□ WebSocket بدل Polling
  - استبدل useRoomPolling.ts بـ WebSocket hook
  - استخدم Pusher أو Ably أو socket.io

□ قاعدة بيانات مستقلة
  - Supabase (يدعم WebSocket natively)
  - أو PlanetScale (MySQL)

□ نظام مصادقة
  - Google Auth عبر NextAuth.js
  - ربط Player ID بـ Google Account
  - حفظ الإحصاءات في DB بدل localStorage
```

---

### المرحلة 3 — نمو حقيقي ⏳ لم تبدأ

```
□ رفع بنك الأسئلة من 405 → 1000+
  - الملف: src/lib/questions.ts
  - التصنيفات الحالية: romantic, deep, fun, bold, future, habits, goals, memories
  - أضف: conflict_resolution, daily_life, dreams, family

□ نظام إبلاغ عن مشكلة
  - زر "إبلاغ" على السؤال
  - POST /api/report { questionId, reason }

□ تحليلات استخدام
  - Vercel Analytics (مجاني)
  - أو PostHog (self-hosted)

□ Content moderation للدردشة
  - فحص الرسائل المسيئة
  - OpenAI Moderation API (مجاني)
```

---

## 🔒 أمان مهم

- `.env.local` مستثنى من git (DATABASE_URL + OPENAI_API_KEY)
- رفع token GitHub يدوياً فقط عند الحاجة وإلغاؤه بعد الاستخدام
- لا توجد كلمات مرور مخزنة (لا نظام auth حالياً)
- الدردشة محدودة بـ 1000 حرف + rate limit

---

## 📱 Google Play — معلومات التطبيق

```
Package Name:   ai.rezerosaga.wheeloffate
App Name:       عجلة الحظ (Wheel of Fate)
Category:       Card Games / Casual
Content Rating: Mature 17+ (بسبب وضع "الجريئة")
Target SDK:     34 (Android 14)
Min SDK:        21 (Android 5.0)
Languages:      Arabic (primary), could add English later
```

---

## 🐛 مشاكل معروفة

| المشكلة | الخطورة | الحل |
|---------|---------|------|
| Polling مكلف مع كثرة المستخدمين | 🔴 حرجة | WebSocket (المرحلة 2) |
| localStorage يُفقد عند تغيير الجهاز | 🟡 مهمة | Auth + DB sync (المرحلة 2) |
| assetlinks.json يحتاج SHA256 حقيقي | 🟡 مهمة | بعد توليد keystore |
| لا content moderation للدردشة | 🟡 مهمة | OpenAI Moderation (المرحلة 3) |
| 405 سؤال فقط → تكرار بعد 5-6 جلسات | 🟢 مقبول | المرحلة 3 |

---

## 🧪 تشغيل الاختبارات

```bash
pnpm test                    # كل الاختبارات
pnpm test src/tests/unit     # unit فقط (83)
pnpm test src/tests/integration  # integration (23)
pnpm test src/tests/uat      # UAT (32)
```

---

## 📝 ملاحظات للوكيل المستقبلي

1. **لا تكسر الـ Schema** — أي تعديل على `src/db/schema.ts` يحتاج migration
2. **الـ CSS system** موجود بالكامل في `globals.css` — لا Tailwind
3. **آلة الحالة** في `game-logic.ts` هي مصدر الحقيقة الوحيد للعبة
4. **الأصوات** في `sounds.ts` — Web Audio API (لا ملفات صوت خارجية)
5. **العجلة** في `SpinWheel.tsx` — Canvas 2D، لا SVG
6. **الـ dev server** على port 13000 دائماً
7. **لا تضف** `@ts-ignore` أو `eslint-disable` — اصلح المشكلة بشكل صحيح

---

Based on [2D Phaser + Next.js Game Template] by [HappySeeds].  
Create with HappySeeds: https://happyseeds.ai
