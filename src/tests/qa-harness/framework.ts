// QA Harness — Test Framework + Couple Personas
// ABDO: مبادر، رومانسي، يمزح، رسائله أطول
// ANFAL: خجولة، إجابات قصيرة، عاطفية، تستخدم emoji أكثر
import { QAClient } from './client';

export type Verdict = 'PASS' | 'FAIL' | 'BLOCKED' | 'NOT_IMPLEMENTED';

export interface TestCase {
  name: string;
  verdict: Verdict;
  expected: string;
  actual: string;
  reason?: string;
  error?: string;
  defectSource?: 'production' | 'harness' | 'unknown';
  repeated?: number;
}

export class HarnessReport {
  cases: TestCase[] = [];
  add(t: Omit<TestCase, 'verdict'> & { verdict: Verdict }) {
    this.cases.push(t);
  }
  pass(name: string, expected: string, actual: string, repeated = 1) {
    this.cases.push({ name, verdict: 'PASS', expected, actual, repeated });
  }
  fail(name: string, expected: string, actual: string, reason: string, defectSource: TestCase['defectSource'] = 'production', err?: string) {
    this.cases.push({ name, verdict: 'FAIL', expected, actual, reason, error: err, defectSource });
  }
  blocked(name: string, expected: string, actual: string, reason: string) {
    this.cases.push({ name, verdict: 'BLOCKED', expected, actual, reason });
  }
  notImplemented(name: string, reason: string) {
    this.cases.push({
      name, verdict: 'NOT_IMPLEMENTED', expected: 'feature exists and works',
      actual: 'feature not present in production code', reason,
    });
  }
  summary() {
    const p = this.cases.filter((c) => c.verdict === 'PASS').length;
    const f = this.cases.filter((c) => c.verdict === 'FAIL').length;
    const b = this.cases.filter((c) => c.verdict === 'BLOCKED').length;
    const n = this.cases.filter((c) => c.verdict === 'NOT_IMPLEMENTED').length;
    return { total: this.cases.length, pass: p, fail: f, blocked: b, notImplemented: n };
  }
}

// ── Couple personas (سلوكيات فقط لتوليد محتوى QA واقعي — لا تعدّل اللعبة) ──────
export const ABDO_MESSAGES = {
  romantic: [
    'كل يوم أكتشف فيك شي جديد يحليني أكثر، والله أنتِ أحلى صدفة صارت بحياتي',
    'لو عندي آلة زمن برجع لأول يوم شفتك وأقول لك من الآن: هذي اللي بتكون حياتي كلها',
    'أنتِ مو بس حبيبتي، أنتِ المكان الوحيد اللي أحس فيه إني أنا',
  ],
  funny: [
    'أقسم إني أحبك أكثر من المندي... وهذا كلام خطير ما تقدرين تردّين عليه 😂',
    'لو الحب كان تطبيق كنت أنا أول تقييم خمس نجوم بدون ما تفكرين',
  ],
  deep: [
    'أحيانًا أخاف من فكرة إني أضيعك، مو لأنك ضعيفة، لأنك أصبحت جزء من تفكيري اليومي',
    'أحس إنا نتعلم بعض كل يوم، حتى لما نختلف نتعلم',
  ],
};

export const ANFAL_MESSAGES = {
  romantic: [
    'أحبك 💕',
    'معك أحس بأمان ❤️',
    'أنتِ قلبي',
  ],
  shy: [
    '😳...',
    'ما أدري أقول إيش بس... أحبك 🙈',
    'هههه خجلان من كلامك',
  ],
  emotional: [
    'كلامك يوصل لقلبي مباشرة 🥹',
    'ما توقعت ترد كذا... أحسست بإحساس حلو 😌❤️',
  ],
};

export function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ── Helper: الانتظار ────────────────────────────────────────────────────────
export function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

export function makeClients(base: string, abdoId: string, anfalId: string) {
  return {
    abdo: new QAClient('عبدو', abdoId, base),
    anfal: new QAClient('أنفال', anfalId, base),
  };
}
