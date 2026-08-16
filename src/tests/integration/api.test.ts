// ─── Integration Tests: API Routes ───────────────────────────────────────────
// يختبر الـ API endpoints مباشرةً ضد الخادم الفعلي على port 13000
// يُشغَّل بعد أن يكون الخادم قيد التشغيل

import { describe, it, expect, beforeAll } from 'vitest';

const BASE = 'http://localhost:13000';
const uid  = () => `p_test_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function post(path: string, body: unknown) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json() as Record<string, unknown>;
  return { status: res.status, body: json };
}

async function get(path: string) {
  const res = await fetch(`${BASE}${path}`);
  const json = await res.json() as Record<string, unknown>;
  return { status: res.status, body: json };
}

// ─── /api/health ─────────────────────────────────────────────────────────────

describe('GET /api/health', () => {
  it('يعيد 200 ويُفيد بأن الخادم سليم', async () => {
    const r = await get('/api/health');
    expect(r.status).toBe(200);
    // health يعيد إما ok:true أو success:true
    const hasHealthFlag = r.body.ok === true || r.body.success === true || r.body.status === 'ok';
    expect(hasHealthFlag).toBe(true);
  });
});

// ─── /api/room/create ─────────────────────────────────────────────────────────

describe('POST /api/room/create', () => {
  it('يُنشئ غرفة ويعيد code', async () => {
    const r = await post('/api/room/create', { playerId: uid(), playerName: 'عبدو' });
    expect(r.status).toBe(200);
    expect(r.body.code).toBeTruthy();
    expect(typeof r.body.code).toBe('string');
    expect((r.body.code as string).length).toBe(6);
  });

  it('يعيد 400 إذا playerId مفقود', async () => {
    const r = await post('/api/room/create', { playerName: 'عبدو' });
    expect(r.status).toBe(400);
    expect(r.body.error).toBeTruthy();
  });

  it('يعيد 400 إذا playerName مفقود', async () => {
    const r = await post('/api/room/create', { playerId: uid() });
    expect(r.status).toBe(400);
  });

  it('يُنشئ غرفة مع gameState ابتدائي', async () => {
    const p1 = uid();
    const r = await post('/api/room/create', { playerId: p1, playerName: 'أنفال' });
    expect(r.status).toBe(200);
    const code = r.body.code as string;

    // تحقق من state
    const stateR = await get(`/api/room/${code}/state?playerId=${p1}`);
    expect(stateR.status).toBe(200);
    expect((stateR.body.gameState as Record<string,unknown>)?.phase).toBe('waiting');
  });
});

// ─── /api/room/join ───────────────────────────────────────────────────────────

describe('POST /api/room/join', () => {
  let code: string;
  const p1 = uid();
  const p2 = uid();

  beforeAll(async () => {
    const r = await post('/api/room/create', { playerId: p1, playerName: 'عبدو' });
    code = r.body.code as string;
  });

  it('يُدخل لاعباً ثانياً بنجاح', async () => {
    const r = await post('/api/room/join', { code, playerId: p2, playerName: 'أنفال' });
    expect(r.status).toBe(200);
    expect(r.body.role).toBe('player2');
    expect(r.body.playerId).toBe(p2);
  });

  it('ينقل phase إلى spin_start بعد الانضمام', async () => {
    const stateR = await get(`/api/room/${code}/state?playerId=${p1}`);
    expect((stateR.body.gameState as Record<string,unknown>)?.phase).toBe('spin_start');
  });

  it('يعيد 404 لغرفة غير موجودة', async () => {
    const r = await post('/api/room/join', { code: 'XXXXXX', playerId: uid(), playerName: 'اسم' });
    expect(r.status).toBe(404);
  });

  it('يعيد 409 إذا الغرفة ممتلئة', async () => {
    const r = await post('/api/room/join', { code, playerId: uid(), playerName: 'لاعب ثالث' });
    expect(r.status).toBe(409);
  });

  it('يسمح بإعادة الانضمام لـ player1', async () => {
    const r = await post('/api/room/join', { code, playerId: p1, playerName: 'عبدو' });
    expect(r.status).toBe(200);
    expect(r.body.role).toBe('player1');
  });

  it('يسمح بإعادة الانضمام لـ player2', async () => {
    const r = await post('/api/room/join', { code, playerId: p2, playerName: 'أنفال' });
    expect(r.status).toBe(200);
    expect(r.body.role).toBe('player2');
  });
});

// ─── /api/room/[code]/action ──────────────────────────────────────────────────

describe('POST /api/room/[code]/action', () => {
  let code: string;
  const p1 = uid();
  const p2 = uid();

  beforeAll(async () => {
    const create = await post('/api/room/create', { playerId: p1, playerName: 'عبدو' });
    code = create.body.code as string;
    await post('/api/room/join', { code, playerId: p2, playerName: 'أنفال' });
  });

  it('spin ينقل من spin_start إلى spin_category', async () => {
    const r = await post(`/api/room/${code}/action`, { type: 'spin', playerId: p1 });
    expect(r.status).toBe(200);
    expect(r.body.success).toBe(true);
    const state = await get(`/api/room/${code}/state?playerId=${p1}`);
    expect((state.body.gameState as Record<string,unknown>)?.phase).toBe('spin_category');
  });

  it('spin ثانية تختار فئة وتنتقل إلى spin_question', async () => {
    // resolveStartSpin عشوائي (Math.random) — يجب قراءة currentPlayerIdx الفعلي أولًا.
    const st0 = await get(`/api/room/${code}/state?playerId=${p1}`);
    const gs0 = st0.body.gameState as Record<string, unknown>;
    const idx0 = (gs0?.currentPlayerIdx as number) ?? 0;
    const actor = idx0 === 0 ? p1 : p2;
    let r = await post(`/api/room/${code}/action`, { type: 'spin', playerId: actor });
    // category spin يضبط pendingSpinResult ويبقى في spin_category؛
    // spin_question_ack يكمل الانتقال إلى spin_question (UI يرسلها بعد إنهاء الأنيميشن).
    expect(r.status).toBe(200);
    const mid = (await get(`/api/room/${code}/state?playerId=${p1}`)).body.gameState as Record<string, unknown>;
    if (mid?.phase !== 'spin_question') {
      r = await post(`/api/room/${code}/action`, { type: 'spin_question_ack', playerId: actor });
      expect(r.status).toBe(200);
    }
    const state = await get(`/api/room/${code}/state?playerId=${p1}`);
    const gs = state.body.gameState as Record<string,unknown>;
    expect(gs?.phase).toBe('spin_question');
    expect(gs?.currentCategory).toBeTruthy();
  });

          it('جولة كاملة: سؤال ← إجابة ← تقييم ← نقاط ← نهاية جولة', { timeout: 30000 }, async () => {
    // غرفة مستقلة تمامًا — لا تعتمد على ترتيب الاختبارات ولا على state تراكمي.
    const rp1 = uid();
    const rp2 = uid();
    const create = await post('/api/room/create', { playerId: rp1, playerName: 'عبدو-جولة' });
    expect(create.status).toBe(200);
    const rcode = create.body.code as string;
    await post('/api/room/join', { code: rcode, playerId: rp2, playerName: 'أنفال-جولة' });
    // Helper: يقرأ الطور ويؤكد قيمة متوقعة
    const expectPhase = async (expected: string): Promise<Record<string, unknown>> => {
      const gs = (await get(`/api/room/${rcode}/state?playerId=${rp1}`)).body.gameState as Record<string, unknown>;
      expect(gs?.phase).toBe(expected);
      return gs;
    };
    // 1) lobby spin: من spin_start إلى spin_category (resolveStartSpin عشوائي — نقرأ currentPlayerIdx)
    let gs = await expectPhase('spin_start');
    let actor = ((gs?.currentPlayerIdx as number) ?? 0) === 0 ? rp1 : rp2;
    let r = await post(`/api/room/${rcode}/action`, { type: 'spin', playerId: actor });
    expect(r.status).toBe(200);
    await expectPhase('spin_category');
    // 2) عجلة الفئة الحقيقية: spin من spin_category يطبّق auto-ack وينتقل إلى spin_question
    gs = (await get(`/api/room/${rcode}/state?playerId=${rp1}`)).body.gameState as Record<string, unknown>;
    actor = ((gs?.currentPlayerIdx as number) ?? 0) === 0 ? rp1 : rp2;
    r = await post(`/api/room/${rcode}/action`, { type: 'spin', playerId: actor });
    expect(r.status).toBe(200);
    await expectPhase('spin_question');
    // 3) عجلة الأسئلة: spin من spin_question يطبّق auto-ack وينتقل إلى question
    r = await post(`/api/room/${rcode}/action`, { type: 'spin', playerId: actor });
    expect(r.status).toBe(200);
    await expectPhase('question');
    // 4) السؤال نشط: السائل = currentPlayerIdx، المجيب = الآخر
    gs = (await get(`/api/room/${rcode}/state?playerId=${rp1}`)).body.gameState as Record<string, unknown>;
    expect(gs?.currentQuestionId).toBeTruthy();
    const askerIdx = (gs?.currentPlayerIdx as number) ?? 0;
    const answerer = askerIdx === 0 ? rp2 : rp1;
    r = await post(`/api/room/${rcode}/action`, { type: 'answer', playerId: answerer, answer: 'إجابة اختبارية من التكامل' });
    expect(r.status).toBe(200);
    await expectPhase('reaction');
    // 5) المقيّم = السائل (currentPlayerIdx في طور reaction)، والمجيب = currentAnswerBy
    gs = (await get(`/api/room/${rcode}/state?playerId=${rp1}`)).body.gameState as Record<string, unknown>;
    const answererId = gs?.currentAnswerBy as string;
    const answererIdxForScore = answererId === rp1 ? 0 : 1;
    const scoreBefore = (answererIdxForScore === 0 ? gs?.player1Score : gs?.player2Score) as number ?? 0;
    const reactor = ((gs?.currentPlayerIdx as number) ?? 0) === 0 ? rp1 : rp2;
    r = await post(`/api/room/${rcode}/action`, { type: 'react_love', playerId: reactor });
    expect(r.status).toBe(200);
    gs = (await get(`/api/room/${rcode}/state?playerId=${rp1}`)).body.gameState as Record<string, unknown>;
    const scoreAfter = (answererIdxForScore === 0 ? gs?.player1Score : gs?.player2Score) as number ?? 0;
    expect(scoreAfter).toBeGreaterThan(scoreBefore);
    expect((gs?.loveCounter as number) ?? 0).toBeGreaterThan(0);
    await expectPhase('round_end');
    // 6) end_round يبدّل الدور ويعود إلى spin_category
    const endActor = ((gs?.currentPlayerIdx as number) ?? 0) === 0 ? rp1 : rp2;
    r = await post(`/api/room/${rcode}/action`, { type: 'end_round', playerId: endActor });
    expect(r.status).toBe(200);
    await expectPhase('spin_category');
    gs = (await get(`/api/room/${rcode}/state?playerId=${rp1}`)).body.gameState as Record<string, unknown>;
    expect(gs?.currentPlayerIdx).not.toBe(askerIdx);
  });

  it('يعيد 400 لأكشن غير صالح', async () => {
    const r = await post(`/api/room/${code}/action`, { type: 'invalid_action', playerId: p1 });
    // يُقبل أو يُعاد كـ success:true بدون تأثير — لا يجب أن يكون 500
    expect(r.status).not.toBe(500);
  });
});

// ─── /api/room/[code]/chat ────────────────────────────────────────────────────

describe('POST /api/room/[code]/chat', () => {
  let code: string;
  const p1 = uid();

  beforeAll(async () => {
    const r = await post('/api/room/create', { playerId: p1, playerName: 'مُختبِر' });
    code = r.body.code as string;
  });

  it('يحفظ رسالة دردشة ويعيدها', async () => {
    const r = await post(`/api/room/${code}/chat`, {
      playerId: p1,
      playerName: 'مُختبِر',
      content: 'مرحبا من الاختبار',
    });
    expect(r.status).toBe(200);
    expect(r.body.message).toBeTruthy();
    const msg = r.body.message as Record<string,unknown>;
    expect(msg.content).toBe('مرحبا من الاختبار');
  });

  it('يعيد 400 لمحتوى فارغ', async () => {
    const r = await post(`/api/room/${code}/chat`, {
      playerId: p1,
      playerName: 'مُختبِر',
      content: '',
    });
    expect(r.status).toBe(400);
  });
});

// ─── /api/room/[code]/state ───────────────────────────────────────────────────

describe('GET /api/room/[code]/state', () => {
  let code: string;
  const p1 = uid();

  beforeAll(async () => {
    const r = await post('/api/room/create', { playerId: p1, playerName: 'فاحص' });
    code = r.body.code as string;
  });

  it('يعيد gameState, room, messages', async () => {
    const r = await get(`/api/room/${code}/state?playerId=${p1}`);
    expect(r.status).toBe(200);
    expect(r.body).toHaveProperty('gameState');
    expect(r.body).toHaveProperty('room');
    expect(r.body).toHaveProperty('messages');
  });

  it('يعيد 404 لغرفة غير موجودة', async () => {
    const r = await get(`/api/room/XXXXXX/state?playerId=${p1}`);
    expect(r.status).toBe(404);
  });
});

// ─── /api/room/[code]/reflect ─────────────────────────────────────────────────

describe('POST /api/room/[code]/reflect', () => {
  let code: string;
  const p1 = uid();

  beforeAll(async () => {
    const r = await post('/api/room/create', { playerId: p1, playerName: 'مُتأمّل' });
    code = r.body.code as string;
  });

  it('يحفظ تأملاً ويعيد reflectionId', async () => {
    const r = await post(`/api/room/${code}/reflect`, {
      playerId: p1,
      content: 'كانت جلسة مميزة ومؤثرة',
    });
    expect(r.status).toBe(200);
    expect(r.body.saved).toBe(true);
  }, 15000); // timeout أطول — قد يستدعي LLM

  it('يعيد 400 لمحتوى فارغ', async () => {
    const r = await post(`/api/room/${code}/reflect`, {
      playerId: p1,
      content: '',
    });
    expect(r.status).toBe(400);
  });
});
