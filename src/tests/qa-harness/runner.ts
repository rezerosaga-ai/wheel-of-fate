// QA Harness — Runner
// يشغّل الخادم الحقيقي عبر endpoints، عميلان مستقلان: عبدو وأنفال
// الاستخدام: pnpm tsx src/tests/qa-harness/runner.ts [base_url]
// لا يعدّل production إطلاقًا — ينشئ غرفًا بـ playerIds عشوائية (تُنظف تلقائيًا)
import { HarnessReport } from './framework';
import { uid } from './client';
import { FunctionalScenarios } from './functional';
import { CoupleScenarios } from './couple';
import { QAClient } from './client';

const BASE = process.argv[2] ?? 'http://localhost:13000';
const ABDO_ID = uid('abdo');
const ANFAL_ID = uid('anfal');

async function main() {
  const report = new HarnessReport();
  const abdo = new QAClient('عبدو', ABDO_ID, BASE);
  const anfal = new QAClient('أنفال', ANFAL_ID, BASE);
  const functional = new FunctionalScenarios(BASE, report);
  const couple = new CoupleScenarios(BASE, report);

  console.log(`[harness] base=${BASE} abdo=${ABDO_ID} anfal=${ANFAL_ID}`);

  let code = '';
  let abdoClient: QAClient | null = null;
  let anfalClient: QAClient | null = null;
  let askerId = '';

  // ── Room lifecycle + isolation ─────────────────────────────────────────────
  const lc = await functional.roomLifecycle();
  if (lc) { code = lc.code; abdoClient = lc.abdo; anfalClient = lc.anfal; }
  else { console.error('[harness] room lifecycle FAILED — stopping'); dump(report); process.exit(1); }

  // ── Game loop ──────────────────────────────────────────────────────────────
  const loop = await functional.gameLoop(code, abdoClient, anfalClient);
  askerId = loop.askerId;

  // ── Tools ──────────────────────────────────────────────────────────────────
  await functional.tools(code, abdoClient, anfalClient, loop.answererId);

  // ── Special rounds ─────────────────────────────────────────────────────────
  await functional.specialRounds(code, abdoClient, anfalClient);

  // ── Chat (functional + couple chat QA) ─────────────────────────────────────
  await functional.chatTest(code, abdoClient, anfalClient);
  await couple.chatExperience(code, abdoClient, anfalClient);

  // ── Emotional loop ─────────────────────────────────────────────────────────
  await couple.emotionalLoop(code, abdoClient, anfalClient, askerId, loop.answererId);

  // ── Reflection privacy ─────────────────────────────────────────────────────
  await functional.reflectionTest(code, abdoClient, anfalClient);

  // ── Resilience ─────────────────────────────────────────────────────────────
  await functional.resilienceTest(code, abdoClient, anfalClient);

  // ── Conflict room (NOT_IMPLEMENTED verification) ───────────────────────────
  await functional.conflictTest(code, abdoClient, anfalClient);

  // ── Full emotional sequence + conflict detection ───────────────────────────
  await couple.fullEmotionalSequence(code, abdoClient, anfalClient);
  await couple.conflictDetection(code, anfalClient, abdoClient);

  // ── Misunderstanding scenario ──────────────────────────────────────────────
  await couple.misunderstandingScenario(code, abdoClient, anfalClient);

  // ── Love counter idempotency ───────────────────────────────────────────────
  await functional.loveCounterTest(code, abdoClient, anfalClient);

  // ── Stress + authorization ─────────────────────────────────────────────────
  await functional.stressAndAuthorization(code, abdoClient, anfalClient);

  // ── Dump ───────────────────────────────────────────────────────────────────
  dump(report);
  process.exit(0);
}

function dump(report: HarnessReport) {
  const s = report.summary();
  console.log('\n===== QA HARNESS RESULTS =====');
  for (const c of report.cases) {
    const tag = c.verdict === 'PASS' ? '✅' : c.verdict === 'FAIL' ? '❌' : c.verdict === 'BLOCKED' ? '🚧' : '⬜';
    console.log(`${tag} ${c.name} [${c.verdict}]`);
    if (c.verdict !== 'PASS') {
      console.log(`   expected: ${c.expected}`);
      console.log(`   actual:   ${c.actual}`);
      if (c.reason) console.log(`   reason:   ${c.reason}`);
      if (c.error) console.log(`   error:    ${c.error}`);
      if (c.defectSource) console.log(`   defect:   ${c.defectSource}`);
    }
  }
  console.log(`\nSUMMARY: total=${s.total} pass=${s.pass} fail=${s.fail} blocked=${s.blocked} notImplemented=${s.notImplemented}`);
}

main().catch((e) => {
  console.error('[harness] FATAL:', e);
  process.exit(2);
});
