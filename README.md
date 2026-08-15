# 🎡 Wheel of Fate — عجلة الحظ

لعبة علاقة تفاعلية لشخصين بالوقت الفعلي، عربية RTL كاملة، مبنية بـ Next.js 15 + PostgreSQL.

---

## 🔗 روابط مباشرة

| ماذا | الرابط |
|------|--------|
| 🌐 **الموقع (Production)** | [wheel-of-fate-three.vercel.app](https://wheel-of-fate-three.vercel.app) |
| 📥 **صفحة تحميل التطبيق** | [wheel-of-fate-three.vercel.app/download](https://wheel-of-fate-three.vercel.app/download) |
| 📦 **تحميل APK مباشر** | [wheel-of-fate-three.vercel.app/wheel-of-fate.apk](https://wheel-of-fate-three.vercel.app/wheel-of-fate.apk) |
| 💻 **مستودع GitHub** | [github.com/rezerosaga-ai/wheel-of-fate](https://github.com/rezerosaga-ai/wheel-of-fate) |
| ▲ **لوحة Vercel** | [vercel.com/wheel2/wheel-of-fate](https://vercel.com/wheel2/wheel-of-fate) |

---

## ⚙️ البيئة التقنية

| التقنية | القيمة |
|---------|--------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript (strict) |
| Styling | CSS Variables (globals.css) — بدون Tailwind |
| Database | PostgreSQL (Neon) + Drizzle ORM |
| State | Zustand |
| Realtime | SSE مع polling fallback (3s) |
| Package Manager | pnpm |
| Deploy | Vercel — تلقائي عند push إلى main |

## 🚀 الأوامر الأساسية

```bash
pnpm dev          # خادم التطوير
pnpm build        # بناء الإنتاج
pnpm typecheck    # فحص TypeScript
pnpm test         # الاختبارات (vitest)
```

---

## 🎮 دورة اللعبة

```
waiting → (انضمام اللاعب الثاني) → spin_start → spin_category (عجلة الفئات)
→ spin_question (عجلة الأسئلة) → question → reaction → round_end
→ next_round → spin_category → ... → session_end
```

**أدوات اللاعبين:** 💣 قنبلة · ⏭️ تخطّي · 🔍 تعمّق · 😂 لا تضحك · 💌 رسالة سرية

**التحدي (Challenge):** بعد مرحلة reaction يمكن لأحد اللاعبين إصدار تحدٍّ، والآخر يجيب عبر `challenge_answer`.

---

## 📂 بنية المشروع

| المسار | الوصف |
|--------|-------|
| `src/components/screens/` | الشاشات: GameRoom، GameRoomLayout (مستخرج لمنع الفليكر)، SessionEnd، HomeScreen |
| `src/components/game/` | SpinWheel (Canvas)، ChatPanel، QuestionCard، ChallengeCard، FateCard، KnowMe، PlayerTools |
| `src/hooks/` | useRoomSSE (sync + polling fallback)، usePushNotification |
| `src/lib/` | game-logic.ts (آلة الحالة)، questions.ts (11 فئة)، sounds.ts، api.ts |
| `src/app/api/room/` | endpoints: create، join، [code]/{action، state، chat، stream، reflect} |
| `src/db/` | Drizzle schema + client |
| `src/tests/` | unit (83)، integration، load، uat |

---

## 🗄 قاعدة البيانات

PostgreSQL على Neon — الجداول الرئيسية:

```
wof_rooms            — الغرف (code, player1/2, status)
wof_game_states      — حالة اللعبة الحية (phase, scores, question...)
wof_chat_messages    — الدردشة (حد 1000 حرف)
wof_reflections      — تأملات ما بعد الجلسة
```

**تحذير:** أي تعديل على schema يحتاج migration عبر `drizzle-kit`.

---

## 📱 تطبيق Android (TWA)

الـ APK غلاف TWA يفتح الموقع داخل Chrome Custom Tabs:

| البند | القيمة |
|-------|--------|
| الحزمة | `app.vercel.wheel_of_fate_three.twa` |
| Asset links | [/.well-known/assetlinks.json](https://wheel-of-fate-three.vercel.app/.well-known/assetlinks.json) |
| SHA-256 | محدث في assetlinks.json |
| التحديث | استبدل `public/wheel-of-fate.apk` وادفع إلى main |

---

## 🧪 اختبار الإنتاج السريع

```bash
# إنشاء غرفة
curl -X POST https://wheel-of-fate-three.vercel.app/api/room/create \
  -H "Content-Type: application/json" \
  -d '{"playerId":"p1","playerName":"أحمد"}'

# انضمام اللاعب الثاني (ينتقل تلقائياً إلى spin_start)
curl -X POST https://wheel-of-fate-three.vercel.app/api/room/join \
  -H "Content-Type: application/json" \
  -d '{"code":"XXXXXX","playerId":"p2","playerName":"أنفال"}'
```

---

## 📋 ملاحظات الاستقرار (Stability Notes)

- **الفليكر:** `GameRoomLayout` مستخرج خارج `GameRoom` لمنع إعادة بناء DOM مع كل polling
- **الـ sync:** `useRoomSSE` يحتوي polling fallback كل 3 ثوانٍ عند انقطاع SSE
- **Aliases:** actions مثل `spin` / `pick_question` / `answer` / `react_*` تُحوَّل داخلياً في `game-logic.ts`
- **challenge_answer:** يحفظ الإجابة في DB دائماً (تم إصلاحه)
- **الأسماء:** تُعرض أسماء اللاعبين بدلاً من Raw IDs (p_123...)
- **العجلات:** `spin` من spin_start يختار الفئة فوراً، و`pick_question` يختار السؤال — كل ذلك في خطوة واحدة على الخادم

---

## 🔒 أمان

- `.env.local` مستثنى من git (DATABASE_URL, NEXTAUTH_*, GOOGLE_*)
- الدردشة محدودة بـ 1000 حرف مع rate limit
- Age Gate (17+) + صفحات Privacy / Terms إلزامية
