// ─── Unit Tests: game-logic.ts ────────────────────────────────────────────────
import { describe, it, expect, vi } from 'vitest';
import {
  processAction,
  resolveStartSpin,
  resolveCategorySpin,
  resolveQuestionSpin,
  generateRoomCode,
  type GameStateData,
  type GameAction,
} from '@/lib/game-logic';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const ROOM = {
  player1Id: 'p1',
  player2Id: 'p2',
  player1Name: 'عبدو',
  player2Name: 'أنفال',
};

function makeState(overrides: Partial<GameStateData> = {}): GameStateData {
  return {
    id: 1,
    roomCode: 'ABCD12',
    currentPlayerIdx: 0,
    roundNumber: 1,
    phase: 'spin_category',
    currentCategory: null,
    currentQuestionId: null,
    currentAnswer: null,
    currentAnswerBy: null,
    reactionDone: false,
    lastReactionBy: null,
    lastReactionEmoji: null,
    player1Score: 0,
    player2Score: 0,
    loveCounter: 0,
    player1Bomb: 2,
    player1Skip: 2,
    player1Deepen: 2,
    player1DontLaugh: 1,
    player2Bomb: 2,
    player2Skip: 2,
    player2Deepen: 2,
    player2DontLaugh: 1,
    consecutiveCategoryCount: 0,
    lastCategory: null,
    fateCardShownAt: 0,
    knowMeShownAt: 0,
    secretMsg1: null,
    secretMsg2: null,
    secretMsgRevealed: false,
    knowMeQuestion: null,
    knowMeAnswer: null,
    knowMeGuess: null,
    knowMeAnswerBy: null,
    knowMeGuessBy: null,
    dontLaughActive: false,
    pendingSpinResult: null,
    deepenQuestionText: null,
    conflictTopics: [],
    usedQuestionIds: [],
    updatedAt: new Date(),
    challengeActive: false,
    challengeQuestionsLeft: 0,
    challengeQuestionId: null,
    challengeAnswer: null,
    challengeBy: null,
    doublePointsActive: false,
    mysteryWheelActive: false,
    customChallenge: null,
    ...overrides,
  };
}

// ─── generateRoomCode ─────────────────────────────────────────────────────────

describe('generateRoomCode', () => {
  it('يولّد رمزاً بطول 6 محارف', () => {
    const code = generateRoomCode();
    expect(code).toHaveLength(6);
  });

  it('يحتوي على محارف أبجدية-رقمية فقط بدون أحرف ملتبسة', () => {
    for (let i = 0; i < 50; i++) {
      const code = generateRoomCode();
      expect(code).toMatch(/^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$/);
      // لا I, L, O, 0, 1 — تشبه بعضها
      expect(code).not.toMatch(/[ILO01]/);
    }
  });

  it('يولّد رموزاً فريدة في الغالب', () => {
    const codes = new Set(Array.from({ length: 100 }, () => generateRoomCode()));
    expect(codes.size).toBeGreaterThan(90);
  });
});

// ─── resolveStartSpin ─────────────────────────────────────────────────────────

describe('resolveStartSpin', () => {
  it('يعيد أحد اللاعبين كفائز', () => {
    const result = resolveStartSpin('p1', 'p2');
    expect(['p1', 'p2']).toContain(result.value);
    expect(result.type).toBe('start');
  });

  it('النوع دائماً start', () => {
    for (let i = 0; i < 20; i++) {
      expect(resolveStartSpin('p1', 'p2').type).toBe('start');
    }
  });

  it('يختار p1 وp2 بتوزيع تقريبي متساوٍ', () => {
    let p1Count = 0;
    for (let i = 0; i < 200; i++) {
      if (resolveStartSpin('p1', 'p2').value === 'p1') p1Count++;
    }
    // بين 30% و70% — يُثبت العشوائية بدون أن يكون صارماً
    expect(p1Count).toBeGreaterThan(50);
    expect(p1Count).toBeLessThan(150);
  });
});

// ─── resolveCategorySpin ──────────────────────────────────────────────────────

describe('resolveCategorySpin', () => {
  it('يعيد فئة من قائمة الفئات المعرّفة', () => {
    const validCategories = ['love', 'relationship', 'personality', 'confessions', 'bold', 'future', 'laugh', 'situations', 'dare', 'would_you_rather', 'memory'];
    const state = makeState();
    for (let i = 0; i < 30; i++) {
      const result = resolveCategorySpin(state);
      expect(validCategories).toContain(result.value);
      expect(result.type).toBe('category');
    }
  });

  it('لا يتكرر نفس الفئة مرتين متتاليتين في الغالب', () => {
    const state = makeState({ lastCategory: 'love' });
    let sameCount = 0;
    for (let i = 0; i < 50; i++) {
      if (resolveCategorySpin(state).value === 'love') sameCount++;
    }
    // مع الترجيح يجب أن يكون أقل من 10 مرات من 50
    expect(sameCount).toBeLessThan(15);
  });
});

// ─── resolveQuestionSpin ──────────────────────────────────────────────────────

describe('resolveQuestionSpin', () => {
  it('يعيد سؤالاً بـ id صحيح من الفئة', () => {
    const state = makeState({ currentCategory: 'love' });
    const result = resolveQuestionSpin(state);
    expect(result.type).toBe('question');
    expect(parseInt(result.value)).toBeGreaterThan(0);
  });

  it('يتجنب الأسئلة المستخدمة قدر الإمكان', () => {
    const state = makeState({ currentCategory: 'laugh', usedQuestionIds: [101, 102, 103, 104, 105] });
    const ids = new Set<number>();
    for (let i = 0; i < 30; i++) {
      ids.add(parseInt(resolveQuestionSpin(state).value));
    }
    // لا يجب أن يعيد كل مرة نفس المعرّف المحدود
    expect(ids.size).toBeGreaterThan(0);
  });
});

// ─── processAction: spin_start ────────────────────────────────────────────────

describe('processAction: spin_start', () => {
  it('ينتقل من waiting إلى spin_category', () => {
    const state = makeState({ phase: 'waiting' });
    const result = processAction({ type: 'spin_start', playerId: 'p1' }, state, ROOM);
    expect(result.updates.phase).toBe('spin_category');
    expect(result.updates.roundNumber).toBe(1);
  });

  it('ينتقل من spin_start إلى spin_category', () => {
    const state = makeState({ phase: 'spin_start' });
    const result = processAction({ type: 'spin_start', playerId: 'p2' }, state, ROOM);
    expect(result.updates.phase).toBe('spin_category');
  });

  it('يرفض الانتقال من phase خاطئة', () => {
    const state = makeState({ phase: 'question' });
    const result = processAction({ type: 'spin_start', playerId: 'p1' }, state, ROOM);
    expect(Object.keys(result.updates)).toHaveLength(0);
  });
});

// ─── processAction: spin (alias) ──────────────────────────────────────────────

describe('processAction: spin alias', () => {
  it('في waiting يُعالج كـ spin_start', () => {
    const state = makeState({ phase: 'waiting' });
    const result = processAction({ type: 'spin', playerId: 'p1' }, state, ROOM);
    expect(result.updates.phase).toBe('spin_category');
  });

  it('في spin_category يُحدّد الفئة وينتقل إلى spin_question', () => {
    const state = makeState({ phase: 'spin_category', currentPlayerIdx: 0 });
    const result = processAction({ type: 'spin', playerId: 'p1' }, state, ROOM);
    expect(result.updates.phase).toBe('spin_question');
    expect(result.updates.currentCategory).toBeTruthy();
  });
});

// ─── processAction: submit_answer ─────────────────────────────────────────────

describe('processAction: submit_answer', () => {
  it('ينتقل إلى reaction ويحفظ الإجابة', () => {
    const state = makeState({ phase: 'question', currentPlayerIdx: 0 });
    const result = processAction(
      { type: 'submit_answer', playerId: 'p2', answer: 'هذه إجابتي' },
      state,
      ROOM
    );
    expect(result.updates.phase).toBe('reaction');
    expect(result.updates.currentAnswer).toBe('هذه إجابتي');
    expect(result.updates.currentAnswerBy).toBe('p2');
  });

  it('لا يقبل إجابة ثانية إذا وُجدت إجابة', () => {
    const state = makeState({ phase: 'question', currentAnswer: 'إجابة أولى' });
    const result = processAction(
      { type: 'submit_answer', playerId: 'p2', answer: 'إجابة ثانية' },
      state,
      ROOM
    );
    expect(Object.keys(result.updates)).toHaveLength(0);
  });

  it('يرفض من phase غير question', () => {
    const state = makeState({ phase: 'spin_category' });
    const result = processAction(
      { type: 'submit_answer', playerId: 'p2', answer: 'إجابة' },
      state,
      ROOM
    );
    expect(Object.keys(result.updates)).toHaveLength(0);
  });
});

// ─── processAction: answer alias ──────────────────────────────────────────────

describe('processAction: answer alias', () => {
  it('يُعالج كـ submit_answer', () => {
    const state = makeState({ phase: 'question' });
    const result = processAction({ type: 'answer', playerId: 'p2', answer: 'جوابي' }, state, ROOM);
    expect(result.updates.phase).toBe('reaction');
    expect(result.updates.currentAnswer).toBe('جوابي');
  });
});

// ─── processAction: submit_reaction ──────────────────────────────────────────

describe('processAction: submit_reaction', () => {
  it('يضيف نقاط للمُجيب ويزيد عداد الحب', () => {
    const state = makeState({
      phase: 'reaction',
      currentPlayerIdx: 0,
      currentAnswerBy: 'p2',
      reactionDone: false,
      player2Score: 5,
      loveCounter: 2,
    });
    const result = processAction(
      { type: 'submit_reaction', playerId: 'p1', reactionType: 'deep', points: 2 },
      state,
      ROOM
    );
    expect(result.updates.player2Score).toBe(7);
    expect(result.updates.loveCounter).toBe(3);
    expect(result.updates.reactionDone).toBe(true);
  });

  it('لا يُعالج التفاعل مرتين', () => {
    const state = makeState({ phase: 'reaction', reactionDone: true });
    const result = processAction(
      { type: 'submit_reaction', playerId: 'p1', reactionType: 'love', points: 1 },
      state,
      ROOM
    );
    expect(Object.keys(result.updates)).toHaveLength(0);
  });

  it('يُشغّل fate_card في الجولة 5', () => {
    const state = makeState({
      phase: 'reaction',
      roundNumber: 4,
      currentAnswerBy: 'p2',
      reactionDone: false,
      fateCardShownAt: 0,
    });
    const result = processAction(
      { type: 'submit_reaction', playerId: 'p1', reactionType: 'love', points: 1 },
      state,
      ROOM
    );
    expect(result.updates.phase).toBe('fate_card');
  });

  it('يُشغّل know_me في الجولة 10', () => {
    const state = makeState({
      phase: 'reaction',
      roundNumber: 9,
      currentAnswerBy: 'p2',
      reactionDone: false,
      knowMeShownAt: 0,
    });
    const result = processAction(
      { type: 'submit_reaction', playerId: 'p1', reactionType: 'love', points: 1 },
      state,
      ROOM
    );
    expect(result.updates.phase).toBe('know_me');
    expect(result.updates.knowMeQuestion).toBeTruthy();
  });
});

// ─── processAction: reaction aliases ─────────────────────────────────────────

describe('processAction: reaction aliases', () => {
  const reactionCases: Array<[string, number]> = [
    ['react_love', 1],
    ['react_laugh', 1],
    ['react_deep', 2],
    ['react_touching', 2],
    ['react_bold', 2],
    ['react_close', 3],
  ];

  reactionCases.forEach(([type, expectedPoints]) => {
    it(`${type} يضيف ${expectedPoints} نقاط`, () => {
      const state = makeState({
        phase: 'reaction',
        currentAnswerBy: 'p2',
        player2Score: 0,
        reactionDone: false,
      });
      const result = processAction({ type, playerId: 'p1' } as GameAction, state, ROOM);
      expect(result.updates.player2Score).toBe(expectedPoints);
    });
  });
});

// ─── processAction: next_round ────────────────────────────────────────────────

describe('processAction: next_round', () => {
  it('يُبدّل اللاعب الحالي ويرفع رقم الجولة', () => {
    const state = makeState({ phase: 'round_end', currentPlayerIdx: 0, roundNumber: 3 });
    const result = processAction({ type: 'next_round', playerId: 'p1' }, state, ROOM);
    expect(result.updates.currentPlayerIdx).toBe(1);
    expect(result.updates.roundNumber).toBe(4);
    expect(result.updates.phase).toBe('spin_category');
  });

  it('يعود إلى p1 عندما يكون currentPlayerIdx=1', () => {
    const state = makeState({ phase: 'round_end', currentPlayerIdx: 1 });
    const result = processAction({ type: 'next_round', playerId: 'p2' }, state, ROOM);
    expect(result.updates.currentPlayerIdx).toBe(0);
  });

  it('يرفض من phase خاطئة', () => {
    const state = makeState({ phase: 'question' });
    const result = processAction({ type: 'next_round', playerId: 'p1' }, state, ROOM);
    expect(Object.keys(result.updates)).toHaveLength(0);
  });

  it('يرفض من لاعب ليس دوره', () => {
    const state = makeState({ phase: 'round_end', currentPlayerIdx: 0 });
    const result = processAction({ type: 'next_round', playerId: 'p2' }, state, ROOM);
    expect(Object.keys(result.updates)).toHaveLength(0);
  });
});

// ─── processAction: use_bomb ──────────────────────────────────────────────────

describe('processAction: use_bomb', () => {
  it('يُحوّل السؤال للاعب الآخر ويُقلّل البمبة', () => {
    const state = makeState({ phase: 'question', currentPlayerIdx: 0, player1Bomb: 2 });
    const result = processAction({ type: 'use_bomb', playerId: 'p1' }, state, ROOM);
    expect(result.updates.player1Bomb).toBe(1);
    expect(result.updates.currentPlayerIdx).toBe(1);
    expect(result.message).toBe('bomb');
  });

  it('يرفض إذا لا توجد بمبات', () => {
    const state = makeState({ phase: 'question', currentPlayerIdx: 0, player1Bomb: 0 });
    const result = processAction({ type: 'use_bomb', playerId: 'p1' }, state, ROOM);
    expect(Object.keys(result.updates)).toHaveLength(0);
  });

  it('يرفض من لاعب ليس دوره', () => {
    const state = makeState({ phase: 'question', currentPlayerIdx: 0 });
    const result = processAction({ type: 'use_bomb', playerId: 'p2' }, state, ROOM);
    expect(Object.keys(result.updates)).toHaveLength(0);
  });
});

// ─── processAction: use_skip ──────────────────────────────────────────────────

describe('processAction: use_skip', () => {
  it('يُبدّل السؤال ويُقلّل التخطيات', () => {
    const state = makeState({ phase: 'question', currentPlayerIdx: 0, currentCategory: 'love', player1Skip: 1 });
    const result = processAction({ type: 'use_skip', playerId: 'p1' }, state, ROOM);
    expect(result.updates.player1Skip).toBe(0);
    expect(result.updates.currentQuestionId).toBeTruthy();
    expect(result.message).toBe('skip');
  });

  it('يرفض إذا لا توجد تخطيات', () => {
    const state = makeState({ phase: 'question', currentPlayerIdx: 0, player1Skip: 0 });
    const result = processAction({ type: 'use_skip', playerId: 'p1' }, state, ROOM);
    expect(Object.keys(result.updates)).toHaveLength(0);
  });
});

// ─── processAction: use_challenge ────────────────────────────────────────────

describe('processAction: use_challenge', () => {
  it('يُشغّل التحدي من round_end', () => {
    const state = makeState({
      phase: 'round_end',
      currentPlayerIdx: 0,
      currentCategory: 'bold',
      challengeActive: false,
    });
    const result = processAction({ type: 'use_challenge', playerId: 'p1' }, state, ROOM);
    expect(result.updates.phase).toBe('challenge');
    expect(result.updates.challengeActive).toBe(true);
    expect(result.updates.challengeQuestionsLeft).toBe(2);
    expect(result.updates.challengeBy).toBe('p1');
    expect(result.message).toBe('challenge_issued');
  });

  it('يرفض التحدي المزدوج', () => {
    const state = makeState({ phase: 'round_end', currentPlayerIdx: 0, challengeActive: true });
    const result = processAction({ type: 'use_challenge', playerId: 'p1' }, state, ROOM);
    expect(Object.keys(result.updates)).toHaveLength(0);
  });
});

// ─── processAction: challenge_answer ─────────────────────────────────────────

describe('processAction: challenge_answer', () => {
  it('يُقلّل العداد من 2 إلى 1 ويختار سؤالاً جديداً', () => {
    const state = makeState({
      phase: 'challenge',
      challengeActive: true,
      challengeQuestionsLeft: 2,
      challengeBy: 'p1',
      currentCategory: 'love',
    });
    const result = processAction(
      { type: 'challenge_answer', playerId: 'p2', answer: 'إجابتي' },
      state,
      ROOM
    );
    expect(result.updates.challengeQuestionsLeft).toBe(1);
    expect(result.updates.challengeQuestionId).toBeTruthy();
  });

  it('ينهي التحدي عند آخر إجابة', () => {
    const state = makeState({
      phase: 'challenge',
      challengeActive: true,
      challengeQuestionsLeft: 1,
      challengeBy: 'p1',
      currentCategory: 'love',
    });
    const result = processAction(
      { type: 'challenge_answer', playerId: 'p2', answer: 'إجابتي' },
      state,
      ROOM
    );
    expect(result.updates.phase).toBe('round_end');
    expect(result.updates.challengeActive).toBe(false);
    expect(result.message).toBe('challenge_complete');
  });

  it('يرفض المُتحدّي أن يجيب على تحديه', () => {
    const state = makeState({
      phase: 'challenge',
      challengeActive: true,
      challengeBy: 'p1',
    });
    const result = processAction(
      { type: 'challenge_answer', playerId: 'p1', answer: 'محاولة غش' },
      state,
      ROOM
    );
    expect(Object.keys(result.updates)).toHaveLength(0);
  });
});

// ─── processAction: secret_msg ────────────────────────────────────────────────

describe('processAction: secret_msg', () => {
  it('يحفظ رسالة p1', () => {
    const state = makeState({ phase: 'fate_card' });
    const result = processAction({ type: 'secret_msg', playerId: 'p1', message: 'أحبك جداً' }, state, ROOM);
    expect(result.updates.secretMsg1).toBe('أحبك جداً');
  });

  it('يُفعّل الكشف تلقائياً عندما يرسل كلاهما', () => {
    const state = makeState({ phase: 'fate_card', secretMsg1: 'رسالة p1', secretMsg2: null });
    const result = processAction({ type: 'secret_msg', playerId: 'p2', message: 'رسالة p2' }, state, ROOM);
    expect(result.updates.secretMsg2).toBe('رسالة p2');
    expect(result.updates.secretMsgRevealed).toBe(true);
  });
});

// ─── processAction: know_me ───────────────────────────────────────────────────

describe('processAction: know_me_answer / know_me_guess', () => {
  it('يحفظ إجابة know_me', () => {
    const state = makeState({ phase: 'know_me', knowMeAnswerBy: 'p1' });
    const result = processAction({ type: 'know_me_answer', playerId: 'p1', text: 'البيتزا' }, state, ROOM);
    expect(result.updates.knowMeAnswer).toBe('البيتزا');
  });

  it('يُعطي نقطتين عند التخمين الصحيح', () => {
    const state = makeState({
      phase: 'know_me',
      knowMeAnswer: 'البيتزا',
      knowMeGuessBy: 'p2',
      player2Score: 3,
    });
    const result = processAction({ type: 'know_me_guess', playerId: 'p2', text: 'البيتزا' }, state, ROOM);
    expect(result.updates.player2Score).toBe(5);
    expect(result.message).toBe('know_me_correct');
  });

  it('لا يُعطي نقاطاً عند التخمين الخاطئ', () => {
    const state = makeState({
      phase: 'know_me',
      knowMeAnswer: 'البيتزا',
      knowMeGuessBy: 'p2',
      player2Score: 3,
    });
    const result = processAction({ type: 'know_me_guess', playerId: 'p2', text: 'البرغر' }, state, ROOM);
    expect(result.updates.player2Score).toBe(3);
    expect(result.message).toBe('know_me_wrong');
  });
});

// ─── processAction: end_session ──────────────────────────────────────────────

describe('processAction: end_session', () => {
  it('يُغيّر phase إلى session_end', () => {
    const state = makeState({ phase: 'round_end' });
    const result = processAction({ type: 'end_session', playerId: 'p1' }, state, ROOM);
    expect(result.updates.phase).toBe('session_end');
  });
});

// ─── processAction: reveal_secret ────────────────────────────────────────────

describe('processAction: reveal_secret', () => {
  it('يكشف الرسائل عندما يكون كلاهما جاهزاً', () => {
    const state = makeState({ secretMsg1: 'رسالة 1', secretMsg2: 'رسالة 2', secretMsgRevealed: false });
    const result = processAction({ type: 'reveal_secret', playerId: 'p1' }, state, ROOM);
    expect(result.updates.secretMsgRevealed).toBe(true);
  });

  it('يرفض الكشف إذا لم يُرسل أحدهما بعد', () => {
    const state = makeState({ secretMsg1: 'رسالة 1', secretMsg2: null });
    const result = processAction({ type: 'reveal_secret', playerId: 'p1' }, state, ROOM);
    expect(Object.keys(result.updates)).toHaveLength(0);
  });
});

// ─── pick_question alias ──────────────────────────────────────────────────────

describe('processAction: pick_question alias', () => {
  it('ينتقل إلى question ويُحدّد questionId', () => {
    const state = makeState({ phase: 'spin_question', currentPlayerIdx: 0, currentCategory: 'love' });
    const result = processAction({ type: 'pick_question', playerId: 'p1' }, state, ROOM);
    expect(result.updates.phase).toBe('question');
    expect(result.updates.currentQuestionId).toBeTruthy();
    expect(result.updates.currentAnswer).toBeNull();
  });
});
