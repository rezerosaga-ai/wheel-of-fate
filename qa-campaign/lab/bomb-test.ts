// ─── Bomb semantics regression test (UX-017) ────────────────────────────────────
// User intent: whoever presses the bomb → the OTHER player must answer.
// askers are currentPlayerIdx; the answerer (NOT the asker) holds the bomb.
// After the bomb, bombRedirect === askerIdx, and only the asker may answer.
import { processAction } from '../../src/lib/game-logic';

let fails = 0;
function check(name: string, ok: boolean, detail = '') {
  console.log(ok ? `  PASS ${name}` : `  FAIL ${name} ${detail}`);
  if (!ok) fails++;
}

const room = { player1Id: 'p_abdo', player2Id: 'p_anfal', player1Name: 'ABDO', player2Name: 'ANFAL' };

function newState(phase: string, currentPlayerIdx: number): any {
  return {
    id: 1, roomCode: 'T', currentPlayerIdx, roundNumber: 1, phase,
    currentCategory: 'love', currentQuestionId: 7, currentAnswer: null,
    currentAnswerBy: null, reactionDone: false, lastReactionBy: null,
    lastReactionEmoji: null, player1Score: 0, player2Score: 0, loveCounter: 0,
    player1Bomb: 1, player1Skip: 3, player1Deepen: 2, player1DontLaugh: 1,
    player2Bomb: 1, player2Skip: 3, player2Deepen: 2, player2DontLaugh: 1,
    consecutiveCategoryCount: 1, lastCategory: null, fateCardShownAt: 0,
    knowMeShownAt: 0, secretMsg1: null, secretMsg2: null, secretMsgRevealed: false,
    knowMeQuestion: null, knowMeAnswer: null, knowMeGuess: null, knowMeAnswerBy: null,
    knowMeGuessBy: null, dontLaughActive: false, pendingSpinResult: null,
    deepenQuestionText: null, conflictTopics: [], usedQuestionIds: [],
    updatedAt: new Date(),
    challengeActive: false, challengeQuestionsLeft: 0, challengeQuestionId: null,
    challengeBy: null,
    doublePointsActive: false, mysteryWheelActive: false, customChallenge: null,
    bombRedirect: null,
  };
}

{
  // Scenario 1: ABDO asked (idx 0) → ANFAL should answer. ANFAL presses bomb
  // → bombRedirect = 0 (= asker) and only ABDO may answer.
  const s0 = newState('question', 0);
  const bomb = processAction({ type: 'use_bomb', playerId: 'p_anfal' }, s0, room);
  check('bomb accepted from answerer', bomb.updates.bombRedirect === 0, `got ${bomb.updates.bombRedirect}`);

  const s1 = { ...s0, ...bomb.updates };
  const aAsk = processAction({ type: 'submit_answer', playerId: 'p_abdo', answer: 'ok' }, s1, room);
  check('asker (ABDO) may answer after bomb', aAsk.updates.phase === 'reaction' && aAsk.updates.bombRedirect === null);

  const aAns = processAction({ type: 'submit_answer', playerId: 'p_anfal', answer: 'x' }, { ...s0, ...bomb.updates }, room);
  check('answerer (ANFAL) blocked after bomb', !!aAns.error);
}

{
  // Scenario 2: ANFAL asked (idx 1) → ABDO should answer. ABDO presses bomb
  // → bombRedirect = 1 (= asker) and only ANFAL may answer.
  const s0 = newState('question', 1);
  const bomb = processAction({ type: 'use_bomb', playerId: 'p_abdo' }, s0, room);
  check('bomb by ABDO redirects to asker (idx 1)', bomb.updates.bombRedirect === 1, `got ${bomb.updates.bombRedirect}`);

  const s1 = { ...s0, ...bomb.updates };
  const aAsk = processAction({ type: 'submit_answer', playerId: 'p_anfal', answer: 'ok' }, s1, room);
  check('asker (ANFAL) may answer after ABDO bomb', aAsk.updates.phase === 'reaction' && aAsk.updates.bombRedirect === null);

  const aAns = processAction({ type: 'submit_answer', playerId: 'p_abdo', answer: 'x' }, { ...s0, ...bomb.updates }, room);
  check('ABDO blocked after his own bomb (question moved to asker)', !!aAns.error);
}

{
  // Scenario 3: asker cannot use the bomb
  const s0 = newState('question', 0);
  const bad = processAction({ type: 'use_bomb', playerId: 'p_abdo' }, s0, room);
  check('asker blocked from using bomb', !!bad.error && bad.updates.bombRedirect === undefined);
}

console.log(fails === 0 ? 'BOMB TEST: ALL PASS' : `BOMB TEST: ${fails} FAIL`);
process.exit(fails === 0 ? 0 : 1);
