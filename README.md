# 🎡 Wheel of Fate — عجلة الحظ

لعبة علاقة تفاعلية لشخصين بالوقت الفعلي، مبنية بالكامل بالعربية مع دعم RTL كامل.  
أسئلة حقيقية، عجلة دوران فيزيائية، ذكاء اصطناعي للتحليل، وتجربة قرب فريدة لكل زوجين.

---

## ✨ المميزات الأساسية

| الميزة | التفاصيل |
|--------|---------|
| 🎡 عجلة Canvas فيزيائية | quintic + elastic easing، 3.2 ثانية، HiDPI، إبرة متذبذبة بعد الهبوط |
| 🎵 نظام صوتي كامل | Web Audio API — tick/whoosh/land/wobble، موسيقى خلفية، ضبط الحجم |
| 💬 دردشة فورية | Chat bar مع glassmorphism بالوقت الفعلي |
| 🧠 تحليل AI | تأمل شخصي بعد الجلسة + تحليل المشاعر عبر LLM |
| 🃏 بطاقات القدر | رسائل سرية بين اللاعبين |
| 🎮 Mini-games | know_me، challenge، fate_card |
| 🛠 أدوات استراتيجية | bomb / skip / deepen / dontlaugh |
| 👫 Multiplayer فوري | server-state polling، غرف بكود 6 أحرف |
| 🔥 Streak يومي | تتبع الأيام المتتالية محلياً في localStorage |
| 🏅 7 Achievements | تُفتح تلقائياً بناءً على الجلسات والنقاط والـ streak |
| 🎭 Onboarding | اختيار مزاج الجلسة (6 أمزجة) عند إنشاء الغرفة |
| 📤 Share النتائج | مشاركة بطاقة النتيجة عبر Web Share API أو clipboard |
| 🌐 عربي RTL كامل | 405 سؤال في 8 تصنيفات، واجهة عربية بالكامل |

---

## 🎭 أمزجة الجلسة (Onboarding)

عند إنشاء غرفة جديدة، يختار اللاعب مزاج الجلسة:

| المزاج | الوصف |
|--------|-------|
| 🌹 رومانسية | أسئلة الحب والمشاعر |
| 🧠 عميقة | نكتشف أعماق بعض |
| 😂 مرحة وخفيفة | ضحك وتحديات |
| 🔥 جريئة | أسئلة لا تُنسى |
| 💭 عن المستقبل | أحلام ومشاريع |
| 🎲 مفاجأة | اتركها للعجلة! |

---

## 🏅 نظام الإنجازات

| الإنجاز | الشرط |
|---------|-------|
| 🌱 البداية الجميلة | أول جلسة |
| 🌸 5 جلسات معاً | 5 جلسات مكتملة |
| 💎 10 جلسات معاً | 10 جلسات مكتملة |
| 🔥 3 أيام متتالية | streak = 3 |
| ⭐ أسبوع كامل | streak = 7 |
| ❤️ 50 لحظة حب | loveCounter إجمالي ≥ 50 |
| 💝 100 لحظة حب | loveCounter إجمالي ≥ 100 |

---

## 🗂 بنية المشروع

```text
src/
├── app/
│   ├── api/
│   │   └── room/[code]/          # action · chat · reflect · state
│   │   └── room/create · join
│   ├── room/[code]/page.tsx       # صفحة الغرفة الديناميكية
│   ├── globals.css                # متغيرات CSS، kawaii design tokens
│   ├── layout.tsx                 # RTL، فونت Cairo، manifest
│   └── page.tsx                   # نقطة الدخول → HomeScreen
│
├── components/
│   ├── screens/
│   │   ├── HomeScreen.tsx         # الصفحة الرئيسية + Onboarding + Streak
│   │   ├── GameRoom.tsx           # الغرفة الرئيسية + PhaseScreen + Confetti
│   │   ├── SessionEnd.tsx         # نهاية الجلسة + Share + Achievements
│   │   └── WaitingRoom.tsx        # انتظار اللاعب الثاني
│   └── game/
│       ├── SpinWheel.tsx          # عجلة Canvas فيزيائية
│       ├── ChatPanel.tsx          # دردشة فورية
│       ├── QuestionCard.tsx       # بطاقة السؤال
│       ├── ChallengeCard.tsx      # تحدي
│       ├── FateCard.tsx           # بطاقة القدر
│       ├── KnowMe.tsx             # mini-game
│       ├── PlayerTools.tsx        # الأدوات الاستراتيجية
│       └── ScoreBar.tsx           # شريط النقاط
│
├── lib/
│   ├── game-logic.ts              # آلة الحالة الخادمية
│   ├── questions.ts               # 405 سؤال عربي، 8 تصنيفات
│   ├── sounds.ts                  # Web Audio engine
│   ├── player-stats.ts            # Streak + Achievements (localStorage)
│   ├── api.ts                     # client API wrapper
│   └── llm.ts                     # LLM integration
│
├── db/
│   └── schema.ts                  # Drizzle ORM schema
│
├── store/
│   └── useGameStore.ts            # Zustand store
│
└── tests/
    ├── unit/                      # 83 اختبار وحدة
    ├── integration/               # 23 اختبار تكامل
    ├── load/                      # 5 اختبارات حمل
    └── uat/                       # 32 اختبار قبول المستخدم
```

---

## 🚀 التشغيل السريع

```bash
# تثبيت الاعتمادات
pnpm install

# تشغيل خادم التطوير (port 13000)
pnpm dev

# فحص الأنواع
pnpm typecheck

# بناء الإنتاج
pnpm build
```

---

## 🗄 قاعدة البيانات

المشروع يستخدم **PostgreSQL** عبر **Drizzle ORM**:

```text
wof_rooms              — غرف اللعب
wof_game_states        — حالة اللعبة الحية
wof_chat_messages      — رسائل الدردشة
wof_reflections        — التأملات الشخصية
wof_topics             — الموضوعات
wof_conflict_sessions  — جلسات النزاع
```

---

## 📊 حالة الاختبارات

| النوع | الاختبارات | الحالة |
|------|-----------|--------|
| Unit | 83 / 83 | ✅ |
| Integration | 23 / 23 | ✅ |
| Load | 5 / 5 | ✅ |
| UAT | 32 / 32 | ✅ |

---

## 🔧 المتغيرات البيئية

```env
DATABASE_URL=postgresql://...
OPENAI_API_KEY=sk-...         # اختياري — للتحليل الذكي
```

---

## 📱 متطلبات المتصفح

- Android Chrome 90+ / iOS Safari 15+
- Web Audio API مطلوب للأصوات
- Web Share API مستحسن للمشاركة (fallback: clipboard)

---

Based on [2D Phaser + Next.js Game Template] by [HappySeeds].  
Create with HappySeeds: https://happyseeds.ai
