/**
 * HP-BUG-06 — retryWrap/err.cause verification.
 *
 * netErrorSignature (في action/chat/state routes) تجمع err.message + كل err.cause
 * حتى عمق 4. هذا الاختبار يستنسخ المنطق هنا كتوثيق قابل للتشغيل ويؤكد:
 * 1. خطأ شبكي مباشر (ECONNREFUSED) → يعاد.
 * 2. خطأ شبكي مغلف داخل AggregateError (err.cause chain) → يعاد. ← (HP-BUG-06)
 * 3. خطأ منطقي عادي (Postgres constraint) → يرمي فورًا (لا retry يخفيه).
 * 4. AggregateError يحتوي خطأ منطقي فقط → يرمي فورًا.
 */
import { describe, it, expect } from 'vitest';

function netErrorSignature(err: unknown): boolean {
  let chain: unknown = err;
  const seen = new Set<unknown>();
  const parts: string[] = [];
  while (chain && !seen.has(chain) && parts.length < 4) {
    seen.add(chain);
    parts.push((chain as Error)?.message || '');
    chain = (chain as Error)?.cause;
  }
  const blob = parts.join(' ');
  return /ECONNRESET|ECONNREFUSED|connection/i.test(blob);
}

async function retryWrap<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  let lastErr: unknown = null;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err: unknown) {
      lastErr = err;
      if (!netErrorSignature(err) || i === attempts - 1) throw err;
      await new Promise((res) => setTimeout(res, 5));
    }
  }
  throw lastErr;
}

describe('netErrorSignature + retryWrap (HP-BUG-06)', () => {
  it('يعيد المحاولة لخطأ ECONNREFUSED المباشر', async () => {
    let calls = 0;
    await retryWrap(async () => {
      calls++;
      if (calls < 3) throw Object.assign(new Error('connection reset by peer: ECONNREFUSED ipv4'), { code: 'ECONNREFUSED' });
      return 'ok';
    });
    expect(calls).toBe(3);
  });

  it('يعيد المحاولة لخطأ شبكي مغلف داخل AggregateError.cause (جوهر HP-BUG-06)', async () => {
    const cause = Object.assign(new Error('ECONNREFUSED connect ECONNREFUSED 127.0.0.1:5432'), { code: 'ECONNREFUSED' });
    const agg = Object.assign(new AggregateError([cause], '2 errors occurred'), { cause });
    let calls = 0;
    await retryWrap(async () => {
      calls++;
      if (calls < 2) throw agg;
      return 'recovered';
    });
    expect(calls).toBe(2);
  });

  it('لا يعيد المحاولة لخطأ منطقي عادي (Postgres constraint violation)', async () => {
    let calls = 0;
    await expect(
      retryWrap(async () => {
        calls++;
        throw Object.assign(new Error('duplicate key value violates unique constraint "rooms_code_key"'), { code: '23505' });
      }),
    ).rejects.toThrow('duplicate key value');
    expect(calls).toBe(1); // لا retry — يرمي فورًا
  });

  it('AggregateError بدون أي خطأ شبكي → يرمي فورًا ولا retry', async () => {
    const inner = Object.assign(new Error('null value in column "code"'), { code: '23502' });
    const agg = new AggregateError([inner], '1 error occurred');
    Object.defineProperty(agg, 'cause', { value: inner });
    let calls = 0;
    await expect(
      retryWrap(async () => {
        calls++;
        throw agg;
      }),
    ).rejects.toBe(agg);
    expect(calls).toBe(1);
  });
});
