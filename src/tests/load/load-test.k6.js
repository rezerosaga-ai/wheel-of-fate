// ─── k6 Load Test Script — Wheel of Fate ─────────────────────────────────────
// تشغيل: k6 run src/tests/load/load-test.k6.js
// تثبيت k6: https://k6.io/docs/get-started/installation/

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// ─── مؤشرات مخصصة ────────────────────────────────────────────────────────────
const errorRate     = new Rate('errors');
const createLatency = new Trend('create_room_latency', true);
const actionLatency = new Trend('action_latency', true);
const stateLatency  = new Trend('state_latency', true);

const BASE = __ENV.BASE_URL || 'http://localhost:13000';

// ─── أوضاع الضغط ─────────────────────────────────────────────────────────────
export const options = {
  scenarios: {
    // سيناريو 1: مستخدمون عاديون (10 مستخدمين × 60 ثانية)
    normal_load: {
      executor: 'constant-vus',
      vus: 10,
      duration: '60s',
      tags: { scenario: 'normal' },
    },
    // سيناريو 2: ذروة الضغط (50 مستخدم × 30 ثانية، يبدأ بعد 30 ثانية)
    spike: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10s', target: 50 },
        { duration: '20s', target: 50 },
        { duration: '10s', target: 0  },
      ],
      startTime: '30s',
      tags: { scenario: 'spike' },
    },
  },
  thresholds: {
    http_req_duration:    ['p(95)<2000'], // 95% من الطلبات < 2s
    errors:               ['rate<0.05'],  // أخطاء < 5%
    create_room_latency:  ['p(99)<3000'],
    action_latency:       ['p(95)<1500'],
    state_latency:        ['p(95)<1000'],
  },
};

// ─── Default function (يُشغَّل لكل VU) ──────────────────────────────────────
export default function () {
  const playerId = `p_k6_${__VU}_${Date.now()}`;
  const playerName = `لاعب_${__VU}`;

  const headers = { 'Content-Type': 'application/json' };

  // 1. إنشاء غرفة
  const createStart = Date.now();
  const createRes = http.post(
    `${BASE}/api/room/create`,
    JSON.stringify({ playerId, playerName }),
    { headers }
  );
  createLatency.add(Date.now() - createStart);

  const createOk = check(createRes, {
    'create: status 200': (r) => r.status === 200,
    'create: has code':   (r) => !!JSON.parse(r.body).code,
  });
  errorRate.add(!createOk);
  if (!createOk) return;

  const code = JSON.parse(createRes.body).code;

  // 2. الانضمام كـ p2
  const p2Id   = `p_k6_2_${__VU}_${Date.now()}`;
  const joinRes = http.post(
    `${BASE}/api/room/join`,
    JSON.stringify({ code, playerId: p2Id, playerName: `شريك_${__VU}` }),
    { headers }
  );
  check(joinRes, {
    'join: status 200':     (r) => r.status === 200,
    'join: role is player2':(r) => JSON.parse(r.body).role === 'player2',
  });

  sleep(0.2);

  // 3. إرسال spin action
  const spinStart = Date.now();
  const spinRes = http.post(
    `${BASE}/api/room/${code}/action`,
    JSON.stringify({ type: 'spin', playerId }),
    { headers }
  );
  actionLatency.add(Date.now() - spinStart);

  check(spinRes, {
    'spin: status 200':   (r) => r.status === 200,
    'spin: success true': (r) => !!JSON.parse(r.body).success,
  });

  sleep(0.3);

  // 4. Polling state
  const stateStart = Date.now();
  const stateRes = http.get(`${BASE}/api/room/${code}/state?playerId=${playerId}`);
  stateLatency.add(Date.now() - stateStart);

  check(stateRes, {
    'state: status 200':       (r) => r.status === 200,
    'state: has gameState':    (r) => !!JSON.parse(r.body).gameState,
  });

  sleep(0.3);

  // 5. إرسال رسالة دردشة
  const chatRes = http.post(
    `${BASE}/api/room/${code}/chat`,
    JSON.stringify({ playerId, playerName, content: `اختبار ضغط ${__VU}` }),
    { headers }
  );
  check(chatRes, { 'chat: status 200': (r) => r.status === 200 });

  sleep(0.5);
}

// ─── Setup: يعمل مرة قبل جميع VUs ─────────────────────────────────────────────
export function setup() {
  const healthRes = http.get(`${BASE}/api/health`);
  if (healthRes.status !== 200) {
    throw new Error(`الخادم غير متاح على ${BASE}`);
  }
  console.log(`✅ k6 بدأ — الهدف: ${BASE}`);
}

// ─── handleSummary: تقرير بالعربية ────────────────────────────────────────────
export function handleSummary(data) {
  const p95 = data.metrics?.http_req_duration?.values?.['p(95)'];
  const errRate = data.metrics?.errors?.values?.rate;

  return {
    stdout: `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 نتائج اختبار الضغط — Wheel of Fate
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⏱  p95 زمن الطلب:    ${p95?.toFixed(0) ?? 'N/A'} ms
❌ معدل الأخطاء:      ${((errRate ?? 0) * 100).toFixed(2)}%
📦 إجمالي الطلبات:   ${data.metrics?.http_reqs?.values?.count ?? 0}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `,
    'src/tests/load/results.json': JSON.stringify(data),
  };
}
