// ─── Unit Tests: api helpers (getOrCreatePlayerId, generateRoomCode) ──────────
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ─── getOrCreatePlayerId ─────────────────────────────────────────────────────

describe('getOrCreatePlayerId', () => {
  let store: Record<string, string> = {};

  beforeEach(() => {
    store = {};
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => { store[k] = v; },
      removeItem: (k: string) => { delete store[k]; },
    });
    vi.stubGlobal('window', { localStorage: globalThis.localStorage });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('يولّد id جديداً يبدأ بـ p_', async () => {
    const { getOrCreatePlayerId } = await import('@/lib/api');
    const id = getOrCreatePlayerId();
    expect(id).toMatch(/^p_\d+_[a-z0-9]+$/);
  });

  it('يُعيد نفس الـ id عند الاستدعاء مرة ثانية', async () => {
    vi.resetModules();
    const { getOrCreatePlayerId } = await import('@/lib/api');
    const id1 = getOrCreatePlayerId();
    const id2 = getOrCreatePlayerId();
    expect(id1).toBe(id2);
  });

  it('يعيد سلسلة فارغة في SSR (no window)', async () => {
    vi.unstubAllGlobals();
    vi.stubGlobal('window', undefined);
    vi.resetModules();
    const { getOrCreatePlayerId } = await import('@/lib/api');
    const id = getOrCreatePlayerId();
    expect(id).toBe('');
  });
});

// ─── api.post helper (via fetch mock) ────────────────────────────────────────

describe('api client (fetch mock)', () => {
  beforeEach(() => {
    vi.stubGlobal('window', { localStorage: { getItem: () => null, setItem: () => {} } });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it('يُعيد data عند نجاح الطلب', async () => {
    const mockResponse = { code: 'ABCD12', room: {} };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    }));
    const { api } = await import('@/lib/api');
    const result = await api.createRoom('p_123', 'عبدو');
    expect(result.data).toMatchObject(mockResponse);
    expect(result.error).toBeUndefined();
  });

  it('يُعيد error عند فشل الطلب (status 4xx)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: 'غرفة غير موجودة' }),
    }));
    const { api } = await import('@/lib/api');
    const result = await api.joinRoom('XXXXXX', 'p_123', 'اسم');
    expect(result.error).toBe('غرفة غير موجودة');
    expect(result.data).toBeUndefined();
  });

  it('يُعيد رسالة خطأ عند فشل الشبكة', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network error')));
    const { api } = await import('@/lib/api');
    const result = await api.sendAction('ABCD12', { type: 'spin', playerId: 'p1' });
    expect(result.error).toBe('تعذّر الاتصال بالخادم');
  });

  it('يُرسل Content-Type: application/json', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });
    vi.stubGlobal('fetch', fetchMock);
    const { api } = await import('@/lib/api');
    await api.sendAction('ABCD12', { type: 'spin', playerId: 'p1' });
    const [, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect((options.headers as Record<string, string>)['Content-Type']).toBe('application/json');
  });
});
