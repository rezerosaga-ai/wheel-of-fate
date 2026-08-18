# تحقيق أمني — التوكنات في تاريخ main (2026-08-18)

سؤال Claude الحرج: هل التوكنات وصلت commit مدموج في main أم مُنعت قبل الوصول؟

## نتائج البحث عبر تاريخ main الكامل (git log -S)

| التوكن | ظهر في commit مدموج بـmain؟ | أين |
|---|---|---|
| npg_ (DB password - القديم npg_YDIyMs1P6hiw والجديد npg_HQq30ALYsjvu) | **نعم** | BOMB-TOOLS-CONTRACT.md (commit 63cd0c5, 2026-08-17 22:51) + human_playtest.py مضمن URL في الكود |
| sntryu_ (Sentry token) | **نعم** | todo-sentry-recheck.md (commit 32f1089, 2026-08-18 04:21) |
| github_pat (GitHub PAT) | **نعم** | BOMB-TOOLS-CONTRACT.md (63cd0c5) + todo.md (9fcbc1c) + todo.md (1638afd) |
| ghp_ (GitHub classic token) | **نعم** | todo.md (11cad0d, 2026-08-17 23:40) |
| vcp_ (Vercel token) | لم يُعثر عليه عبر -S | (يحتاج تأكيد grep خام) |
| GOOGLE_CLIENT_SECRET | يحتاج فحص | .env.example (990c9be) — فحص هل يحتوي secret حقيقي |

## الاستنتاج الأولي
**الاحتمال الأول صحيح: التوكنات موجودة فعلاً في تاريخ git مدموج بـmain.** الدفعة التي رفضها Push Protection لم تكن أول مرة — نفس التوكنات كُتبت في وثائق QA منذ أيام ودُمجت في main.

## الإجراء المطلوب (حسب توصية Claude)
1. فحص أي ملفات لا تزال تحتوي توكنات في HEAD الحالي.
2. **Rotation إلزامي**: كل توكن مكشوف يجب إبطاله وإنشاء جديد فورًا (DB، Sentry، GitHub، Vercel).
3. بعد rotation: إزالة التوكنات من الكود الحالي (human_playtest.py يجب أن يقرأ من env لا hardcoded).
4. وثيقة incident قصيرة + تحديث todo.

## النتائج النهائية (فحص HEAD + تاريخ main)

**الجواب القاطع لـClaude: الاحتمال الأول — نعم، التوكنات وصلت commits مدموجة في main.**

| التوكن المكشوف | أول ظهور (commit + تاريخ) | الحالة في HEAD |
|---|---|---|
| npg_YDIyMs1P6hiw (DB القديم) + npg_HQq30ALYsjvu (DB الحالي) | 63cd0c5 (2026-08-17) + 990c9be (2026-08-13 .env.example يحتوي placeholder صحيح لكن url الحالي حقيقي في BOMB-TOOLS-CONTRACT + human_playtest.py) | **ما زال في HEAD** في 4 ملفات |
| github_pat_11B4DLJUA02PS0... | 63cd0c5 (2026-08-17) | ما زال في HEAD |
| github_pat_11B4DLJUA0Jck8WM... (الأقدم) | 9fcbc1c / 1638afd (2026-08-17) | تاريخي |
| ghp_MNxtDDP... | 11cad0d (2026-08-17) | تاريخي (remote URL حُدّث لإزالته) |
| sntryu_229a9fdd... (Sentry) | 32f1089 (2026-08-18 04:21) | ما زال في HEAD |
| GOCSPX-your-google-secret | في .env.example كـplaceholder — **ليس تسريبًا** (مثال توضيحي فقط) |
| vcp_87WpjKXawOFzKdIH8dJ4... (Vercel) | check_vercel*.py — تلك الملفات **لم تُدمج في main** (رفضت من Push Protection اليوم) | لم تصل main |

**إجراءات rotation المطلوبة:**
1. Neon: إبطال npg_HQq30ALYsjvu + npg_YDIyMs1P6hiw → إنشاء كلمة مرور DB جديدة (كل user منفصل في Neon) — **ملف .env يحتاج تحديث عبر إدارة أسرار المشروع** (لا تعديل يدوي).
2. Sentry: إبطال sntryu_229a9fdd... — لكن هو auth token للإدارة؛ يؤثر على سكربتات QA فقط. إبطال + توكن جديد بأدنى scope.
3. GitHub: PAT القديم (github_pat_11B4DLJUA02PS0) — المستخدم نفسه أعطى توكنات جديدة لاحقًا، لكن القديم مكشوف → إبطال من GitHub Settings → PATs.
4. ghp_MNxtDDP — توكن كلاسيكي قديم: إبطال من GitHub إن لم يُبطل.
5. بعد rotation: إزالة كل التوكنات من الكود الحالي (human_playtest.py → env var) + وثيقة incident + فحص .gitignore لملفات QA الحساسة.

**ملاحظة مهمة:** المستودع **privat** (rezerosaga-ai/wheel-of-fate خاص) — هذا يخفف لكن لا يلغي الخطر؛ توصية Claude بالـrotation صحيحة وننفذها.
