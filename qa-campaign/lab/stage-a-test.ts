// Stage A automated tests (REPAIR_PLAN): failure-path test + success-path test.
// Runs processAction directly (no network) to validate logic fixes A1/A2/B2.
// Expected: all PASS, zero crashes, no silent success.
import { processAction, type GameStateData } from '../../src/lib/game-logic';

let pass = 0;
let fail = 0;
function check(name: string, ok: boolean, detail: string = '') {
  if (ok) { pass++; console.log(`  PASS ${name}`); }
  else { fail++; console.log(`  FAIL ${name} — ${detail}`); }
}

function baseState(): GameStateData {
  return {
    id: 1, roomCode: 'TEST', currentPlayerIdx: 0, roundNumber: 1, phase: 'waiting',
    currentCategory: null, currentQuestionId: null, currentAnswer: null, currentAnswerBy: null,
    reactionDone: false, lastReactionBy: null, lastReactionEmoji: null,
    player1Score: 0, player2Score: 0, loveCounter: 0,
    player1Bomb: 3, player1Skip: 3, player1Deepen: 3, player1DontLaugh: 3,
    player2Bomb: 3, player2Skip: 3, player2Deepen: 3, player2DontLaugh: 3,
    consecutiveCategoryCount: 0, lastCategory: null,
    fateCardShownAt: 0, knowMeShownAt: 0,
    secretMsg1: null, secretMsg2: null, secretMsgRevealed: false,
    knowMeQuestion: null, knowMeAnswer: null, knowMeGuess: null,
    knowMeAnswerBy: null, knowMeGuessBy: null,
    dontLaughActive: false, pendingSpinResult: null, deepenQuestionText: null,
    conflictTopics: [], conflictCount: 0, conflictDialogueCount: 0, conflictAgreed: false, conflictDialogue: null, conflictReplyText: null, usedQuestionIds: [], updatedAt: new Date(),
    challengeActive: false, challengeQuestionsLeft: 0, challengeQuestionId: null,
    challengeAnswer: null, challengeBy: null,
    doublePointsActive: false, mysteryWheelActive: false, customChallenge: null,
    bombRedirect: null,
  };
}
const room: Parameters<typeof processAction>[2] = { player1Id: 'p1', player2Id: 'p2', player1Name: 'عبدو', player2Name: 'أنفال' };

console.log('=== STAGE A TESTS ===');

// T1 (SUCCESS PATH): normal full loop through phase spin_start → spin_category → spin_question → question
console.log('\n[T1] success path: spin_start → pick_question → question');
let s = baseState();
let r: ReturnType<typeof processAction> = processAction({ type: 'spin_start', playerId: 'p1' } as any, s, room);
check('spin_start moves to spin_category', r.updates.phase === 'spin_category');
s = { ...s, ...r.updates } as GameStateData;
r = processAction({ type: 'pick_question', playerId: 'p1' } as any, s, room);
check('pick_question from spin_category moves to spin_question then question', r.updates.phase === 'question' && typeof r.updates.currentQuestionId === 'number');
s = { ...s, ...r.updates } as GameStateData;
check('no error in success path', !r.error);

// T2 (FAILURE PATH — A2 fix): double ACK during spin (BUG-001 reproduction)
console.log('\n[T2] failure path: double ACK must be idempotent, never crash (BUG-001)');
try {
  s = baseState();
  // Simulate: player spins, pendingSpinResult set by spin_category (phase spin_start w/ pending)
  s = { ...s, phase: 'spin_start', pendingSpinResult: JSON.stringify({ type: 'category', value: 'deep', label: 'deep' }) } as GameStateData;
  r = processAction({ type: 'spin_category_ack', playerId: 'p1' } as any, s, room);
  check('first ACK applied', Object.keys(r.updates).length > 0 && r.updates.phase === 'spin_question');
  let after = { ...s, ...r.updates } as GameStateData;
  r = processAction({ type: 'spin_category_ack', playerId: 'p1' } as any, after, room);
  check('second ACK rejected safely (idempotent)', Object.keys(r.updates).length === 0);
  // Wrong-role ACK in spin_question phase must also be safe
  r = processAction({ type: 'spin_question_ack', playerId: 'p2' } as any, after, room);
  check('wrong-role ACK rejected safely', Object.keys(r.updates).length === 0);
} catch (e) {
  check('no crash on double ACK', false, String(e));
}

// T3 (FAILURE PATH — B2 fix): unknown action must return explicit error, never silent success (BUG-002/003)
console.log('\n[T3] failure path: unknown action returns explicit error (no silent success)');
r = processAction({ type: 'send_reaction' } as any, baseState(), room);
check('unknown action returns error field', !!r.error && r.error.includes('send_reaction'));
r = processAction({ type: 'some_gibberish_action' } as any, baseState(), room);
check('gibberish action returns error field', !!r.error);

// T4 (FAILURE PATH — A2): double reaction must not double points
console.log('\n[T4] failure path: double reaction is idempotent (Love Counter safety)');
s = baseState();
s = { ...s, phase: 'question', currentAnswerBy: 'p2', currentCategory: 'deep' } as GameStateData;
r = processAction({ type: 'submit_answer', playerId: 'p2', answer: 'hello' } as any, s, room);
s = { ...s, ...r.updates } as GameStateData;
check('answer accepted', s.phase === 'reaction' || !!r.updates.phase);
// force into reaction if needed
if (s.phase !== 'reaction') {
  s = { ...s, phase: 'reaction' } as GameStateData;
}
r = processAction({ type: 'submit_reaction', playerId: 'p1', reactionType: 'love', points: 1 } as any, s, room);
check('first reaction applied', Object.keys(r.updates).length > 0 && (r.updates as any).reactionDone === true);
let afterR = { ...s, ...r.updates } as GameStateData;
const loveAfterFirst = afterR.loveCounter ?? 0;
r = processAction({ type: 'submit_reaction', playerId: 'p1', reactionType: 'love', points: 1 } as any, afterR, room);
check('second reaction rejected (idempotent)', Object.keys(r.updates).length === 0 && (afterR.loveCounter ?? 0) === loveAfterFirst);

// T5 (FAILURE PATH): wrong-phase ACK must not mutate state
console.log('\n[T5] failure path: ACK in wrong phase is a safe no-op');
s = baseState();
s = { ...s, phase: 'question', pendingSpinResult: JSON.stringify({ type: 'question', value: '42', label: '42' }) } as GameStateData;
r = processAction({ type: 'spin_category_ack', playerId: 'p1' } as any, s, room);
check('ACK in wrong phase = no-op', Object.keys(r.updates).length === 0);

console.log(`\nRESULT: ${pass} PASS / ${fail} FAIL`);
process.exit(fail > 0 ? 1 : 0);
