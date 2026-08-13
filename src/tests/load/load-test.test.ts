// ─── Load Tests: Wheel of Fate ────────────────────────────────────────────────
// يُشغَّل بـ: npx ts-node src/tests/load/load-test.ts
// أو يُنفَّذ كـ script عادي بدون k6 (HTTP-level load simulation)
// لتشغيل k6 الحقيقي: استخدم الملف المُقابل load-test.k6.js

import { describe, it, expect } from 'vitest';

const BASE = 'http://localhost:13000';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function uid() {
  return `p_load_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

async function createRoom(playerId: string, name: string) {
  const res = await fetch(`${BASE}/api/room/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ playerId, playerName: name }),
  });
  return res.json() as Promise<{ code?: string; error?: string }>;
}

async function joinRoom(code: string, playerId: string, name: string) {
  const res = await fetch(`${BASE}/api/room/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, playerId, playerName: name }),
  });
  return res.json() as Promise<{ role?: string; error?: string }>;
}

async function sendAction(code: string, action: Record<string, unknown>) {
  const start = Date.now();
  const res = await fetch(`${BASE}/api/room/${code}/action`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(action),
  });
  const latency = Date.now() - start;
  const json = await res.json() as Record<string, unknown>;
  return { ok: res.ok, latency, data: json };
}

// ─── Load Test Suites ─────────────────────────────────────────────────────────

describe('Load Test: إنشاء غرف متزامنة', () => {
  it('ينشئ 10 غرف بالتوازي في أقل من 5 ثوانٍ', async () => {
    const start = Date.now();
    const results = await Promise.all(
      Array.from({ length: 10 }, (_, i) => createRoom(uid(), `لاعب ${i}`))
    );
    const elapsed = Date.now() - start;

    const succeeded = results.filter((r) => r.code != null).length;
    expect(succeeded).toBe(10);
    expect(elapsed).toBeLessThan(5000);

    console.log(`✅ 10 غرف في ${elapsed}ms — ${(elapsed / 10).toFixed(0)}ms لكل غرفة`);
  }, 10000);

  it('ينشئ 30 غرفة بالتوازي بدون أخطاء', async () => {
    const results = await Promise.all(
      Array.from({ length: 30 }, (_, i) => createRoom(uid(), `ضاغط ${i}`))
    );
    const errors = results.filter((r) => r.error != null);
    expect(errors).toHaveLength(0);
  }, 20000);
});

describe('Load Test: حركة actions متزامنة', () => {
  it('10 أزواج يُرسلون actions بالتوازي — كل طلب < 2 ثانية', async () => {
    // إنشاء 10 غرف
    const rooms = await Promise.all(
      Array.from({ length: 10 }, async (_, i) => {
        const p1 = uid();
        const p2 = uid();
        const r = await createRoom(p1, `p1_${i}`);
        if (r.code) await joinRoom(r.code, p2, `p2_${i}`);
        return { code: r.code, p1, p2 };
      })
    );

    // كل غرفة تُرسل spin action
    const actionResults = await Promise.all(
      rooms
        .filter((r) => r.code != null)
        .map((r) => sendAction(r.code!, { type: 'spin', playerId: r.p1 }))
    );

    const allOk = actionResults.every((r) => r.ok);
    expect(allOk).toBe(true);

    const maxLatency = Math.max(...actionResults.map((r) => r.latency));
    const avgLatency = actionResults.reduce((s, r) => s + r.latency, 0) / actionResults.length;

    console.log(`✅ 10 actions متزامنة — متوسط ${avgLatency.toFixed(0)}ms — أقصى ${maxLatency}ms`);
    expect(maxLatency).toBeLessThan(2000);
  }, 30000);
});

describe('Load Test: polling متكرر', () => {
  it('polling كل 1 ثانية × 15 مرة — لا timeout', async () => {
    const p1 = uid();
    const r = await createRoom(p1, 'ضاغط_state');
    const code = r.code;
    expect(code).toBeTruthy();

    const latencies: number[] = [];
    for (let i = 0; i < 15; i++) {
      const start = Date.now();
      const res = await fetch(`${BASE}/api/room/${code}/state?playerId=${p1}`);
      latencies.push(Date.now() - start);
      expect(res.ok).toBe(true);
      if (i < 14) await new Promise((resolve) => setTimeout(resolve, 200)); // 200ms بين الطلبات
    }

    const avg = latencies.reduce((s, l) => s + l, 0) / latencies.length;
    const max = Math.max(...latencies);
    console.log(`✅ 15 poll requests — متوسط ${avg.toFixed(0)}ms — أقصى ${max}ms`);
    expect(max).toBeLessThan(3000);
  }, 30000);
});

describe('Load Test: الدردشة المتزامنة', () => {
  it('50 رسالة دردشة في نفس الغرفة — بدون خطأ', async () => {
    const p1 = uid();
    const p2 = uid();
    const r = await createRoom(p1, 'دردشة_ضغط');
    const code = r.code!;
    await joinRoom(code, p2, 'ضاغط2');

    const sends = await Promise.all(
      Array.from({ length: 50 }, (_, i) =>
        fetch(`${BASE}/api/room/${code}/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            playerId: i % 2 === 0 ? p1 : p2,
            playerName: i % 2 === 0 ? 'ضاغط1' : 'ضاغط2',
            content: `رسالة اختبارية رقم ${i}`,
          }),
        }).then((res) => res.status)
      )
    );

    const failed = sends.filter((s) => s !== 200).length;
    console.log(`✅ 50 رسالة دردشة — فشل: ${failed}`);
    expect(failed).toBe(0);
  }, 15000);
});
