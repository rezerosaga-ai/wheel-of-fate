// ─── Game Logic (Server-Authoritative) ───────────────────────────────────────
// All game state transitions happen here, server-side.

import {
  getRandomQuestion,
  getWeightedRandomCategory,
  CATEGORIES,
  FATE_CARDS,
  KNOW_ME_QUESTIONS,
  type Category,
} from './questions';

export interface GameStateData {
  id: number;
  roomCode: string;
  currentPlayerIdx: number;
  roundNumber: number;
  phase: string;
  currentCategory: string | null;
  currentQuestionId: number | null;
  currentAnswer: string | null;
  currentAnswerBy: string | null;
  reactionDone: boolean;
  player1Score: number;
  player2Score: number;
  loveCounter: number;
  player1Bomb: number;
  player1Skip: number;
  player1Deepen: number;
  player1DontLaugh: number;
  player2Bomb: number;
  player2Skip: number;
  player2Deepen: number;
  player2DontLaugh: number;
  consecutiveCategoryCount: number;
  lastCategory: string | null;
  fateCardShownAt: number;
  knowMeShownAt: number;
  secretMsg1: string | null;
  secretMsg2: string | null;
  secretMsgRevealed: boolean;
  knowMeQuestion: string | null;
  knowMeAnswer: string | null;
  knowMeGuess: string | null;
  knowMeAnswerBy: string | null;
  knowMeGuessBy: string | null;
  dontLaughActive: boolean;
  pendingSpinResult: string | null;
  deepenQuestionText: string | null;
  conflictTopics: string[];
  usedQuestionIds: number[];
  updatedAt: Date;
  // ── Challenge (UNO-style +2) ─────────────────────────────────────────────
  challengeActive: boolean;
  challengeQuestionsLeft: number;         // counts down 2 → 1 → 0
  challengeQuestionId: number | null;      // current challenge question
  challengeAnswer: string | null;
  challengeBy: string | null;             // playerId who issued the challenge
  // ── Shop item effects ────────────────────────────────────────────────────
  doublePointsActive: boolean;            // extra_item: double reaction points once
  mysteryWheelActive: boolean;            // extra_item: spin a random bonus category
  customChallenge: string | null;         // custom challenge question text
}

export type SpinType = 'start' | 'category' | 'question';
export type Phase = GameStateData['phase'];

export interface SpinResult {
  type: SpinType;
  value: string; // playerId for start, category name for category, question id for question
  label: string; // display label
}

export interface ActionResult {
  updates: Partial<GameStateData>;
  message?: string;
}

// ─── Helper ──────────────────────────────────────────────────────────────────

function playerIdx(playerId: string, room: { player1Id: string; player2Id?: string | null }) {
  return room.player1Id === playerId ? 0 : 1;
}

function isCurrentPlayer(
  playerId: string,
  state: GameStateData,
  room: { player1Id: string; player2Id?: string | null }
): boolean {
  return playerIdx(playerId, room) === state.currentPlayerIdx;
}

function getPlayerTool(state: GameStateData, playerIdx: 0 | 1, tool: string): number {
  const prefix = playerIdx === 0 ? 'player1' : 'player2';
  return (state as unknown as Record<string, unknown>)[`${prefix}${capitalize(tool)}`] as number;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ─── Initial spin (who starts) ───────────────────────────────────────────────

export function resolveStartSpin(player1Id: string, player2Id: string): SpinResult {
  const winner = Math.random() < 0.5 ? player1Id : player2Id;
  return { type: 'start', value: winner, label: 'spin_start' };
}

// ─── Category spin ────────────────────────────────────────────────────────────

export function resolveCategorySpin(state: GameStateData): SpinResult {
  const category = getWeightedRandomCategory(state.lastCategory as Category | null);
  return { type: 'category', value: category, label: category };
}

// ─── Question spin ────────────────────────────────────────────────────────────

export function resolveQuestionSpin(state: GameStateData): SpinResult {
  const category = state.currentCategory as Category;
  const q = getRandomQuestion(category, state.usedQuestionIds);
  if (!q) {
    // fallback: pick any
    const fallback = getRandomQuestion(category);
    return { type: 'question', value: String(fallback?.id ?? 1), label: String(fallback?.id ?? 1) };
  }
  return { type: 'question', value: String(q.id), label: String(q.id) };
}

// ─── Process action ───────────────────────────────────────────────────────────

export type GameAction =
  // Canonical names
  | { type: 'spin_start'; playerId: string }
  | { type: 'spin_result_ack'; playerId: string; startPlayerId: string }
  | { type: 'spin_category'; playerId: string }
  | { type: 'spin_category_ack'; playerId: string }
  | { type: 'spin_question'; playerId: string }
  | { type: 'spin_question_ack'; playerId: string }
  | { type: 'submit_answer'; playerId: string; answer: string }
  | { type: 'submit_reaction'; playerId: string; reactionType: string; points: number }
  | { type: 'next_round'; playerId: string }
  | { type: 'use_bomb'; playerId: string }
  | { type: 'use_skip'; playerId: string }
  | { type: 'use_deepen'; playerId: string }
  | { type: 'use_dont_laugh'; playerId: string }
  | { type: 'secret_msg'; playerId: string; message: string }
  // know_me actions accept either `answer`/`guess` or `text` field
  | { type: 'know_me_answer'; playerId: string; answer?: string; text?: string }
  | { type: 'know_me_guess'; playerId: string; guess?: string; text?: string }
  | { type: 'conflict_step'; playerId: string; stepAnswer: string }
  | { type: 'end_session'; playerId: string }
  | { type: 'heartbeat'; playerId: string }
  // ── Challenge (UNO-style +2) ──────────────────────────────────────────────
  | { type: 'use_challenge'; playerId: string }   // asker issues challenge after reaction phase
  | { type: 'challenge_answer'; playerId: string; answer: string }  // responder answers challenge Q
  // ── Shop item game actions ────────────────────────────────────────────────
  | { type: 'trigger_mystery_wheel'; playerId: string }   // spin bonus mystery category
  | { type: 'set_custom_challenge'; playerId: string; question: string } // set custom challenge text
  // Frontend aliases (normalised inside processAction)
  | { type: 'spin'; playerId: string }
  | { type: 'pick_question'; playerId: string }
  | { type: 'answer'; playerId: string; answer: string }
  | { type: 'react_love'; playerId: string }
  | { type: 'react_laugh'; playerId: string }
  | { type: 'react_deep'; playerId: string }
  | { type: 'react_touching'; playerId: string }
  | { type: 'react_bold'; playerId: string }
  | { type: 'react_close'; playerId: string }
  | { type: 'react_surprised'; playerId: string }
  | { type: 'end_round'; playerId: string }
  | { type: 'submit_secret_msg'; playerId: string; message: string; isPlayer1: boolean }
  | { type: 'reveal_secret'; playerId: string }
  | { type: 'skip_fate_card'; playerId: string }
  | { type: 'end_know_me'; playerId: string };

export function processAction(
  action: GameAction,
  state: GameStateData,
  room: { player1Id: string; player2Id?: string | null; player1Name: string; player2Name?: string | null }
): ActionResult {
  const now = new Date();

  // ── Normalize frontend aliases to canonical actions ──────────────────────────
  if (action.type === 'spin') {
    if (state.phase === 'waiting' || state.phase === 'spin_start') {
      return processAction({ type: 'spin_start', playerId: action.playerId }, state, room);
    }
    if (state.phase === 'spin_category') {
      // Two sub-steps: first spin (set category), then auto-ack
      const catResult = processAction({ type: 'spin_category', playerId: action.playerId }, state, room);
      if (Object.keys(catResult.updates).length === 0) return catResult;
      // Auto-apply category from pendingSpinResult
      const sp = JSON.parse(
        (catResult.updates.pendingSpinResult as string | undefined) ?? state.pendingSpinResult ?? '{}'
      ) as SpinResult;
      const newCategory = sp.value as Category;
      const isDouble = newCategory === state.lastCategory && state.consecutiveCategoryCount >= 1;
      return {
        updates: {
          phase: 'spin_question',
          currentCategory: newCategory,
          consecutiveCategoryCount:
            newCategory === state.lastCategory ? state.consecutiveCategoryCount + 1 : 1,
          lastCategory: newCategory,
          pendingSpinResult: null,
          updatedAt: new Date(),
        } as Partial<GameStateData>,
        message: isDouble ? 'double_challenge' : undefined,
      };
    }
    return { updates: {} };
  }
  if (action.type === 'pick_question') {
    // Two sub-steps: spin_question (set question), then auto-ack
    const qResult = processAction({ type: 'spin_question', playerId: action.playerId }, state, room);
    if (Object.keys(qResult.updates).length === 0) return qResult;
    const sp = JSON.parse(
      (qResult.updates.pendingSpinResult as string | undefined) ?? state.pendingSpinResult ?? '{}'
    ) as SpinResult;
    const qId = parseInt(sp.value, 10);
    const usedIds = [...(state.usedQuestionIds ?? []), qId];
    return {
      updates: {
        phase: 'question',
        currentQuestionId: qId,
        currentAnswer: null,
        currentAnswerBy: null,
        reactionDone: false,
        deepenQuestionText: null,
        pendingSpinResult: null,
        usedQuestionIds: usedIds,
        updatedAt: new Date(),
      },
    };
  }
  if (action.type === 'answer') {
    const a = action as { type: 'answer'; playerId: string; answer: string };
    return processAction({ type: 'submit_answer', playerId: a.playerId, answer: a.answer }, state, room);
  }
  // ── Reaction aliases: map to submit_reaction with correct points ─────────────
  // ❤️ أحببته +1 | 😂 مضحكة +1 | 🧠 عميقة +2 | 🥹 مؤثرة +2 | 🔥 جريئة +2 | ⭐ مميزة +3
  if (action.type === 'react_love') {
    return processAction({ type: 'submit_reaction', playerId: action.playerId, reactionType: 'love', points: 1 }, state, room);
  }
  if (action.type === 'react_laugh') {
    return processAction({ type: 'submit_reaction', playerId: action.playerId, reactionType: 'laugh', points: 1 }, state, room);
  }
  if (action.type === 'react_deep') {
    return processAction({ type: 'submit_reaction', playerId: action.playerId, reactionType: 'deep', points: 2 }, state, room);
  }
  if (action.type === 'react_touching') {
    return processAction({ type: 'submit_reaction', playerId: action.playerId, reactionType: 'touching', points: 2 }, state, room);
  }
  if (action.type === 'react_bold') {
    return processAction({ type: 'submit_reaction', playerId: action.playerId, reactionType: 'bold', points: 2 }, state, room);
  }
  if (action.type === 'react_close') {
    return processAction({ type: 'submit_reaction', playerId: action.playerId, reactionType: 'close', points: 3 }, state, room);
  }
  if (action.type === 'react_surprised') {
    return processAction({ type: 'submit_reaction', playerId: action.playerId, reactionType: 'surprised', points: 2 }, state, room);
  }
  if (action.type === 'end_round') {
    return processAction({ type: 'next_round', playerId: action.playerId }, state, room);
  }
  if (action.type === 'submit_secret_msg') {
    const a = action as { type: 'submit_secret_msg'; playerId: string; message: string; isPlayer1: boolean };
    return processAction({ type: 'secret_msg', playerId: a.playerId, message: a.message }, state, room);
  }
  if (action.type === 'reveal_secret') {
    // Both messages are already submitted; just reveal them
    if (!state.secretMsg1 || !state.secretMsg2) return { updates: {} };
    return { updates: { secretMsgRevealed: true, updatedAt: now } };
  }
  if (action.type === 'skip_fate_card' || action.type === 'end_know_me') {
    return processAction({ type: 'next_round', playerId: action.playerId }, state, room);
  }

  switch (action.type) {
    case 'heartbeat': {
      const idx = playerIdx(action.playerId, room);
      if (idx === 0) return { updates: { player1LastSeen: now } as Partial<GameStateData> };
      return { updates: { player2LastSeen: now } as Partial<GameStateData> };
    }

    case 'spin_start': {
      if (!['waiting', 'spin_start'].includes(state.phase)) return { updates: {} };
      // Resolve who goes first, then jump straight to spin_category
      const result = resolveStartSpin(room.player1Id, room.player2Id ?? room.player1Id);
      const winnerIdx = result.value === room.player1Id ? 0 : 1;
      return {
        updates: {
          phase: 'spin_category',
          currentPlayerIdx: winnerIdx,
          roundNumber: 1,
          pendingSpinResult: null,
          updatedAt: now,
        },
      };
    }

    case 'spin_result_ack': {
      // Called after spin animation finishes — set current player
      const sp = JSON.parse(state.pendingSpinResult ?? '{}') as SpinResult;
      const winnerIdx = sp.value === room.player1Id ? 0 : 1;
      return {
        updates: {
          phase: 'spin_category',
          currentPlayerIdx: winnerIdx,
          pendingSpinResult: null,
          roundNumber: 1,
          updatedAt: now,
        },
      };
    }

    case 'spin_category': {
      if (!isCurrentPlayer(action.playerId, state, room)) return { updates: {} };
      if (!['spin_category', 'round_end'].includes(state.phase)) return { updates: {} };
      const result = resolveCategorySpin(state);
      return {
        updates: {
          phase: 'spin_category',
          pendingSpinResult: JSON.stringify(result),
          updatedAt: now,
        },
      };
    }

    case 'spin_category_ack': {
      const sp = JSON.parse(state.pendingSpinResult ?? '{}') as SpinResult;
      const newCategory = sp.value as Category;
      const isDouble =
        newCategory === state.lastCategory && state.consecutiveCategoryCount >= 1;

      return {
        updates: {
          phase: 'spin_question',
          currentCategory: newCategory,
          consecutiveCategoryCount:
            newCategory === state.lastCategory ? state.consecutiveCategoryCount + 1 : 1,
          lastCategory: newCategory,
          pendingSpinResult: null,
          isDoubleChallenge: isDouble,
          updatedAt: now,
        } as Partial<GameStateData>,
      };
    }

    case 'spin_question': {
      if (!isCurrentPlayer(action.playerId, state, room)) return { updates: {} };
      if (state.phase !== 'spin_question') return { updates: {} };
      const result = resolveQuestionSpin(state);
      return {
        updates: {
          pendingSpinResult: JSON.stringify(result),
          updatedAt: now,
        },
      };
    }

    case 'spin_question_ack': {
      const sp = JSON.parse(state.pendingSpinResult ?? '{}') as SpinResult;
      const qId = parseInt(sp.value, 10);
      const usedIds = [...(state.usedQuestionIds ?? []), qId];
      return {
        updates: {
          phase: 'question',
          currentQuestionId: qId,
          currentAnswer: null,
          currentAnswerBy: null,
          reactionDone: false,
          deepenQuestionText: null,
          pendingSpinResult: null,
          usedQuestionIds: usedIds,
          updatedAt: now,
        },
      };
    }

    case 'submit_answer': {
      if (state.phase !== 'question') return { updates: {} };
      // The OTHER player (not currentPlayer) answers — currentPlayer is the asker
      // Allow either player to answer (in case of bomb redirect or future flexibility)
      if (state.currentAnswer) return { updates: {} }; // already answered
      return {
        updates: {
          phase: 'reaction',
          currentAnswer: action.answer,
          currentAnswerBy: action.playerId,
          updatedAt: now,
        },
      };
    }

    case 'submit_reaction': {
      if (state.phase !== 'reaction') return { updates: {} };
      if (state.reactionDone) return { updates: {} };

      // The asker (currentPlayer) rates the answerer's response
      // The answerer is identified by currentAnswerBy
      const answererPlayerId = state.currentAnswerBy;
      const answererIdx = answererPlayerId === room.player1Id ? 0 : 1;
      const answererScoreKey = answererIdx === 0 ? 'player1Score' : 'player2Score';

      const currentAnswererScore = (state[answererScoreKey as keyof GameStateData] as number) ?? 0;
      // ── double_points: if active, multiply reaction points by 2 and deactivate ──
      const effectivePoints = state.doublePointsActive ? action.points * 2 : action.points;
      const updates: Partial<GameStateData> = {
        [answererScoreKey]: currentAnswererScore + effectivePoints,
        loveCounter: (state.loveCounter ?? 0) + 1,
        reactionDone: true,
        doublePointsActive: false, // consume the effect regardless
        updatedAt: now,
      };

      // Check special triggers
      const nextRound = state.roundNumber + 1;
      const shouldShowFateCard = nextRound % 5 === 0 && state.fateCardShownAt !== nextRound;
      const shouldShowKnowMe = nextRound % 10 === 0 && state.knowMeShownAt !== nextRound;

      if (shouldShowKnowMe) {
        const q = KNOW_ME_QUESTIONS[Math.floor(Math.random() * KNOW_ME_QUESTIONS.length)];
        Object.assign(updates, {
          phase: 'know_me',
          knowMeQuestion: q,
          knowMeAnswer: null,
          knowMeGuess: null,
          // Alternate: even know_me rounds = p1 answers, odd = p2 answers
          knowMeAnswerBy: (nextRound / 10) % 2 === 1 ? room.player1Id : (room.player2Id ?? room.player1Id),
          knowMeGuessBy: (nextRound / 10) % 2 === 1 ? (room.player2Id ?? room.player1Id) : room.player1Id,
          knowMeShownAt: nextRound,
        });
      } else if (shouldShowFateCard) {
        Object.assign(updates, {
          phase: 'fate_card',
          fateCardShownAt: nextRound,
          pendingSpinResult: JSON.stringify(FATE_CARDS[Math.floor(Math.random() * FATE_CARDS.length)]),
        });
      } else {
        Object.assign(updates, { phase: 'round_end' });
      }

      return { updates };
    }

    case 'next_round': {
      if (!['round_end', 'fate_card', 'know_me', 'dont_laugh'].includes(state.phase)) return { updates: {} };
      if (!isCurrentPlayer(action.playerId, state, room)) return { updates: {} };
      const nextPlayer = state.currentPlayerIdx === 0 ? 1 : 0;
      return {
        updates: {
          phase: 'spin_category',
          roundNumber: state.roundNumber + 1,
          currentPlayerIdx: nextPlayer,
          currentCategory: null,
          currentQuestionId: null,
          currentAnswer: null,
          currentAnswerBy: null,
          reactionDone: false,
          deepenQuestionText: null,
          pendingSpinResult: null,
          // reset secret messages for next fate card
          secretMsg1: null,
          secretMsg2: null,
          secretMsgRevealed: false,
          // reset dont_laugh
          dontLaughActive: false,
          updatedAt: now,
        },
      };
    }

    case 'use_bomb': {
      if (!isCurrentPlayer(action.playerId, state, room)) return { updates: {} };
      if (state.phase !== 'question') return { updates: {} };
      const idx = state.currentPlayerIdx as 0 | 1;
      const bombKey = idx === 0 ? 'player1Bomb' : 'player2Bomb';
      const bombCount = (state[bombKey as keyof GameStateData] as number) ?? 0;
      if (bombCount <= 0) return { updates: {} };
      // Bomb: send question to the other player
      const otherIdx = idx === 0 ? 1 : 0;
      return {
        updates: {
          [bombKey]: bombCount - 1,
          currentPlayerIdx: otherIdx,
          updatedAt: now,
        } as Partial<GameStateData>,
        message: 'bomb',
      };
    }

    case 'use_skip': {
      if (!isCurrentPlayer(action.playerId, state, room)) return { updates: {} };
      if (state.phase !== 'question') return { updates: {} };
      const idx = state.currentPlayerIdx as 0 | 1;
      const skipKey = idx === 0 ? 'player1Skip' : 'player2Skip';
      const skipCount = (state[skipKey as keyof GameStateData] as number) ?? 0;
      if (skipCount <= 0) return { updates: {} };
      // Skip: go to next question
      const result = resolveQuestionSpin(state);
      const qId = parseInt(result.value, 10);
      const usedIds = [...(state.usedQuestionIds ?? []), qId];
      return {
        updates: {
          [skipKey]: skipCount - 1,
          currentQuestionId: qId,
          usedQuestionIds: usedIds,
          currentAnswer: null,
          currentAnswerBy: null,
          reactionDone: false,
          deepenQuestionText: null,
          updatedAt: now,
        } as Partial<GameStateData>,
        message: 'skip',
      };
    }

    case 'use_deepen': {
      if (!isCurrentPlayer(action.playerId, state, room)) return { updates: {} };
      if (state.phase !== 'question') return { updates: {} };
      const idx = state.currentPlayerIdx as 0 | 1;
      const deepenKey = idx === 0 ? 'player1Deepen' : 'player2Deepen';
      const deepenCount = (state[deepenKey as keyof GameStateData] as number) ?? 0;
      if (deepenCount <= 0) return { updates: {} };

      const { getQuestionById } = require('./questions') as typeof import('./questions');
      const q = getQuestionById(state.currentQuestionId ?? 0);
      const followUp = q?.deepenFollowUp ?? generateGenericDeepen(q?.text ?? '');

      return {
        updates: {
          [deepenKey]: deepenCount - 1,
          deepenQuestionText: followUp,
          updatedAt: now,
        } as Partial<GameStateData>,
        message: 'deepen',
      };
    }

    case 'use_dont_laugh': {
      if (!isCurrentPlayer(action.playerId, state, room)) return { updates: {} };
      if (state.phase !== 'question') return { updates: {} };
      const idx = state.currentPlayerIdx as 0 | 1;
      const dlKey = idx === 0 ? 'player1DontLaugh' : 'player2DontLaugh';
      const dlCount = (state[dlKey as keyof GameStateData] as number) ?? 0;
      if (dlCount <= 0) return { updates: {} };
      return {
        updates: {
          [dlKey]: dlCount - 1,
          phase: 'dont_laugh',
          dontLaughActive: true,
          dontLaughStartedAt: now,
          updatedAt: now,
        } as Partial<GameStateData>,
      };
    }

    case 'know_me_answer': {
      if (state.phase !== 'know_me') return { updates: {} };
      if (action.playerId !== state.knowMeAnswerBy) return { updates: {} };
      const answerText = action.answer ?? action.text ?? '';
      if (!answerText) return { updates: {} };
      return {
        updates: {
          knowMeAnswer: answerText,
          updatedAt: now,
        },
      };
    }

    case 'know_me_guess': {
      if (state.phase !== 'know_me') return { updates: {} };
      if (action.playerId !== state.knowMeGuessBy) return { updates: {} };
      const guessText = action.guess ?? action.text ?? '';
      const correct =
        guessText.trim().toLowerCase() ===
        (state.knowMeAnswer ?? '').trim().toLowerCase();
      const guessIdx = playerIdx(action.playerId, room) as 0 | 1;
      const scoreKey = guessIdx === 0 ? 'player1Score' : 'player2Score';
      const currentScore = (state[scoreKey as keyof GameStateData] as number) ?? 0;
      const nextRound = state.roundNumber + 1;
      return {
        updates: {
          knowMeGuess: guessText,
          [scoreKey]: correct ? currentScore + 2 : currentScore,
          phase: 'round_end',
          roundNumber: nextRound,
          updatedAt: now,
        } as Partial<GameStateData>,
        message: correct ? 'know_me_correct' : 'know_me_wrong',
      };
    }

    case 'secret_msg': {
      const idx = playerIdx(action.playerId, room);
      const msgKey = idx === 0 ? 'secretMsg1' : 'secretMsg2';
      const updates: Partial<GameStateData> = {
        [msgKey]: action.message,
        updatedAt: now,
      };
      // Check if both sent
      const msg1 = idx === 0 ? action.message : state.secretMsg1;
      const msg2 = idx === 1 ? action.message : state.secretMsg2;
      if (msg1 && msg2 && !state.secretMsgRevealed) {
        Object.assign(updates, { secretMsgRevealed: true });
      }
      return { updates };
    }

    case 'end_session': {
      return {
        updates: {
          phase: 'session_end',
          updatedAt: now,
        },
      };
    }

    // ── Challenge: asker issues +2 challenge after the reaction phase ──────────
    case 'use_challenge': {
      // Only the asker (current player / who issued the round) can challenge
      if (!isCurrentPlayer(action.playerId, state, room)) return { updates: {} };
      // Only valid right after a reaction is done (round_end is where reactionDone=true leads)
      // We allow it from round_end phase (after reaction was done)
      if (state.phase !== 'round_end') return { updates: {} };
      if (state.challengeActive) return { updates: {} }; // already challenged

      // Pick a fresh question from the same category
      const challengeQ = resolveQuestionSpin(state);
      const challengeQId = parseInt(challengeQ.value, 10);
      const usedIds = [...(state.usedQuestionIds ?? []), challengeQId];

      return {
        updates: {
          phase: 'challenge',
          challengeActive: true,
          challengeQuestionsLeft: 2,
          challengeQuestionId: challengeQId,
          challengeAnswer: null,
          challengeBy: action.playerId,
          usedQuestionIds: usedIds,
          updatedAt: now,
        } as Partial<GameStateData>,
        message: 'challenge_issued',
      };
    }

    // ── Challenge answer: the responder answers the challenge question ─────────
    case 'challenge_answer': {
      if (state.phase !== 'challenge') return { updates: {} };
      if (!state.challengeActive) return { updates: {} };
      // The OTHER player (not challengeBy) must answer
      if (action.playerId === state.challengeBy) return { updates: {} };
      if (!action.answer?.trim()) return { updates: {} };

      // fix: نحفظ الإجابة أولاً قبل الانتقال للسؤال التالي
      const trimmedAnswer = action.answer.trim();
      const remaining = state.challengeQuestionsLeft - 1;

      if (remaining > 0) {
        // Still more challenge questions — pick the next one
        const nextQ = resolveQuestionSpin(state);
        const nextQId = parseInt(nextQ.value, 10);
        const usedIds = [...(state.usedQuestionIds ?? []), nextQId];
        return {
          updates: {
            challengeAnswer: trimmedAnswer,   // fix: نحفظ الإجابة في DB
            challengeQuestionsLeft: remaining,
            challengeQuestionId: nextQId,
            usedQuestionIds: usedIds,
            updatedAt: now,
          } as Partial<GameStateData>,
        };
      }

      // All challenge questions done — back to round_end
      return {
        updates: {
          phase: 'round_end',
          challengeActive: false,
          challengeQuestionsLeft: 0,
          challengeQuestionId: null,
          challengeAnswer: trimmedAnswer,   // fix: نحفظ الإجابة الأخيرة
          challengeBy: null,
          updatedAt: now,
        } as Partial<GameStateData>,
        message: 'challenge_complete',
      };
    }

    // ── Mystery wheel: spin a random bonus category for the current player ──────
    case 'trigger_mystery_wheel': {
      if (!state.mysteryWheelActive) return { updates: {} };
      // Pick a truly random category (ignoring weight/consecutive rules)
      const mysteryCategory = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
      return {
        updates: {
          currentCategory: mysteryCategory,
          mysteryWheelActive: false,          // consume effect
          phase: 'spin_question',
          consecutiveCategoryCount: 1,
          lastCategory: mysteryCategory,
          pendingSpinResult: null,
          updatedAt: now,
        } as Partial<GameStateData>,
        message: 'mystery_wheel_triggered',
      };
    }

    // ── Custom challenge: set a player-defined question ─────────────────────────
    case 'set_custom_challenge': {
      if (!action.question?.trim()) return { updates: {} };
      return {
        updates: {
          customChallenge: action.question.trim(),
          phase: 'challenge',
          challengeActive: true,
          challengeQuestionsLeft: 1,
          challengeQuestionId: null,          // custom text overrides ID
          challengeAnswer: null,
          challengeBy: action.playerId,
          updatedAt: now,
        } as Partial<GameStateData>,
        message: 'custom_challenge_set',
      };
    }

    default:
      return { updates: {} };
  }
}

function generateGenericDeepen(questionText: string): string {
  const templates = [
    'وكيف أثّر ذلك على علاقتنا؟',
    'وما الذي تمنيت أن أفهمه عنك في هذا الجانب؟',
    'وكيف تريد أن أتعامل مع هذا الأمر معك؟',
    'وهل حدث هذا مسبقاً؟ كيف كان مختلفاً؟',
    'وماذا تحتاج مني لتشعر بالدعم في هذا؟',
  ];
  return templates[Math.floor(Math.random() * templates.length)];
}

// ─── Generate room code ────────────────────────────────────────────────────────

export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}
