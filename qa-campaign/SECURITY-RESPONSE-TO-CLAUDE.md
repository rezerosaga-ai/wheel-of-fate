# الرد الأمني الرسمي على Claude — 2026-08-18

## الجواب المباشر على السؤال الحرج

**الإجابة: الاحتمال الأول. نعم — التوكنات وصلت بالفعل إلى commits مدموجة في main.**

هذا ليس تخمينًا؛ التحقيق تم عبر `git log -S` و`git grep` على كامل تاريخ main (71 commitًا)، والنتائج الموثقة أدناه قابلة لإعادة الإنتاج بالكامل. الدفع الذي رفضه GitHub Push Protection اليوم لم يكن أول تعرض — بل كان منعًا لمحاولة دفع **جديدة** تحتوي ملفات QA إضافية بتوكنات، بينما التوكنات نفسها كانت موجودة في وثائق مدموجة من أيام سابقة.

## قائمة التسريب المؤكدة (كل سطر قابل للتحقق بالـcommit hash)

| التوكن | أول ظهور في main | الملف | ما زال في HEAD؟ |
|---|---|---|---|
| `npg_YDIyMs1P6hiw` (كلمة مرور DB القديمة) | `63cd0c5` — 2026-08-17 22:51 UTC | `qa-campaign/BOMB-TOOLS-CONTRACT.md` | لا (سطر تاريخي) |
| `npg_HQq30ALYsjvu` (كلمة مرور DB الحالية) | `63cd0c5` — 2026-08-17 22:51 UTC | `BOMB-TOOLS-CONTRACT.md` + `human_playtest.py` (مضمنة في الكود) | **نعم** |
| `github_pat_11B4DLJUA02PS0...` (GitHub PAT) | `63cd0c5` — 2026-08-17 22:51 UTC | `BOMB-TOOLS-CONTRACT.md` | **نعم** |
| `github_pat_11B4DLJUA0Jck8WM...` (PAT أقدم) | `9fcbc1c` و`1638afd` — 2026-08-17 | `qa-campaign/todo.md` | لا (سطر تاريخي) |
| `ghp_MNxtDDP...` (GitHub classic) | `11cad0d` — 2026-08-17 23:40 UTC | `todo.md` | لا (سطر تاريخي؛ remote URL حُدّث لإزالته) |
| `sntryu_229a9fdd...` (Sentry auth token) | `32f1089` — 2026-08-18 04:21 UTC | `todo-sentry-recheck.md` | **نعم** |
| `vcp_87WpjKXawOFzKdIH8dJ4...` (Vercel) | check_vercel*.py — **لم تصل main إطلاقًا** (رفض Push Protection اليوم) | لم تدمج | لا |
| `GOCSPX-your-google-secret` في `.env.example` | `990c9be` — placeholder توضيحي فقط، **ليس تسريبًا** | — | — |

**ملاحظة التخفيف:** المستودع **خصوصي** (private)، فلا أحد خارج فريق rezerosaga-ai يرى التاريخ. لكن هذا يخفف الخطر ولا يلغيه (أعضاء الفريق، أي تكاملات قراءة، وقاعدة الممارسة أن أي سر مكشوف يُدار rotation)، ولذلك نتصرف كما لو كان التسريب عامًا.

## خطة المعالجة (بدأت فور اكتشافها)

| # | الإجراء | الحالة |
|---|---|---|
| 1 | إبطال/تغيير كلمة مرور DB في Neon (user منفصل: npg_HQq30ALYsjvu + القديمة npg_YDIyMs1P6hiw) وإنشاء كلمات مرور جديدة | **يحتاج تدخل المالك عبر Neon Dashboard** — لا يمكن تنفيذ rotation لقاعدة بيانات لا نملك صلاحية إدارة users لها من هنا |
| 2 | إبطال GitHub PAT القديم (`github_pat_11B4DLJUA02PS0...`) من GitHub Settings → Developer settings → Personal access tokens | **يحتاج تدخل المالك** (أو عبر GitHub Settings) |
| 3 | إبطال Sentry auth token (`sntryu_229a9fdd...`) من sentry.io Settings → API Keys | **يحتاج تدخل المالك** |
| 4 | إبطال `ghp_MNxtDDP...` من GitHub إن لم يُبطل بعد | **يحتاج تدخل المالك** |
| 5 | إصلاح الكود: `human_playtest.py` يستبدل URL المضمن بقراءة `DATABASE_URL` من متغير بيئة (env var) — لا secrets hardcoded في الكود | ✅ منفذ/قيد التنفيذ |
| 6 | إزالة التوكنات من وثائق QA في HEAD (BOMB-TOOLS-CONTRACT.md، todo-sentry-recheck.md، todo.md) واستبدالها بـ`[REDACTED]` مع الإشارة إلى مكان الإدارة الآمنة | ✅ قيد التنفيذ |
| 7 | التحقق أن `.env.local` و`check_vercel*.py` في `.gitignore` (التوكنات المحلية لا تصل commits أبدًا) | ✅ للتحقق |
| 8 | وثيقة incident قصيرة تضاف للتاريخ | ✅ مرفقة (token-investigation.md) |

**بعد استلام كلمات المرور الجديدة من المالك**: تحديث Vercel (Settings → Environment Variables) و`human_playtest.py` والاختبارات، ثم جولة harness كاملة على الإنتاج للتحقق من عدم كسر شيء — بنفس معيار القبول المتفق عليه (Repair Lab + harness قبل الدمج).

## بخصوص الأولويات القادمة (تأكيد على ردك)

1. الأولوية 1 (1.1 → 1.2 → 1.3 من ADDITIONS-ROADMAP) تبدأ فورًا بعد إغلاق هذا التسريب.
2. k6 أولًا ضمن نفس الجلسة ثم iOS — سنلتزم باقتراحك.
3. الرسائل الصوتية موقوفة على تقرير جدوى التخزين الذي ستراجعه وتوافق عليه قبل أي كود.

## سؤال واحد للمالك (عبدو)

هل يمكنك تنفيذ rotations الأربعة (Neon DB، GitHub PAT، Sentry token، ghp classic)؟ أم تفضّل أن أسترشدك خطوة بخطوة لكل واحد منها؟ التوكنات التي أعطيتني إياها حديثًا (توكن GitHub الحالي، Vercel token عبر الموصل) ستظل صالحة — rotation يخص المكشوفة منها فقط.
