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
  lastReactionBy: string | null;
  lastReactionEmoji: string | null;
  conflictTopics: string[];
  conflictCount: number;
  conflictDialogueCount: number;
  conflictAgreed: boolean;
  conflictDialogue: string | null;
  conflictReplyText: string | null;
  lastReactionType?: string | null;
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
  // ── Bomb redirect ──────────────────────────────────────────────────────────
  bombRedirect: 0 | 1 | null;             // after use_bomb: idx of the player who USED the bomb (asker must answer while active)
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
  // Explicit error — UI must surface this (no more silent rejections)
  error?: string;
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
  | { type: 'conflict_step'; playerId: string; text: string }
  | { type: 'conflict_agree'; playerId: string }
  | { type: 'conflict_next'; playerId: string }
  | { type: 'use_skip'; playerId: string }
  | { type: 'use_deepen'; playerId: string }
  | { type: 'use_dont_laugh'; playerId: string }
  | { type: 'secret_msg'; playerId: string; message: string }
  // know_me actions accept either `answer`/`guess` or `text` field
  | { type: 'know_me_answer'; playerId: string; answer?: string; text?: string }
  | { type: 'know_me_guess'; playerId: string; guess?: string; text?: string }
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
  | { type: 'react_barf'; playerId: string }
  | { type: 'react_cold'; playerId: string }
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
    if (state.phase === 'spin_question') {
      // The UI sends 'spin' from the spin_question wheel too — resolve the question and auto-ack
      // in one step (no separate ACK comes from the frontend).
      const qResult = processAction({ type: 'spin_question', playerId: action.playerId }, state, room);
      if (Object.keys(qResult.updates).length === 0) return qResult;
      const sp = JSON.parse(
        (qResult.updates.pendingSpinResult as string | undefined) ?? state.pendingSpinResult ?? '{}'
      ) as SpinResult;
      const qId = parseInt(sp.value, 10);
      const usedIds = [...(state.usedQuestionIds ?? []), qId];
      return {
        updates: {
          ...qResult.updates,
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
    return { updates: {} };
  }
  if (action.type === 'pick_question') {
    // Two/three sub-steps (full alias: spin + both ACKs):
    // From spin_category: resolve the category spin, auto-apply the category (ACK), then spin_question, then auto-ack to question.
    // From spin_question with no pending (auto-ack already consumed it): resolve the question spin inline and auto-ack
    // to question — prevents a silent dead-end freeze (Repair Lab: explicit failure path).
    let workState = state;
    let merged: Record<string, unknown> = {};
    if (state.phase === 'spin_question' && !state.pendingSpinResult) {
      const qResult = processAction({ type: 'spin_question', playerId: action.playerId }, state, room);
      if (Object.keys(qResult.updates).length === 0) return qResult;
      const sp = JSON.parse(
        (qResult.updates.pendingSpinResult as string | undefined) ?? state.pendingSpinResult ?? '{}'
      ) as SpinResult;
      const qId = parseInt(sp.value, 10);
      const usedIds = [...(state.usedQuestionIds ?? []), qId];
      return {
        updates: {
          ...qResult.updates,
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
    if (state.phase === 'spin_category') {
      const catResult = processAction({ type: 'spin_category', playerId: action.playerId }, state, room);
      if (Object.keys(catResult.updates).length === 0) return catResult;
      const sp = JSON.parse(
        (catResult.updates.pendingSpinResult as string | undefined) ?? state.pendingSpinResult ?? '{}'
      ) as SpinResult;
      const newCategory = sp.value as Category;
      const isDouble = newCategory === state.lastCategory && state.consecutiveCategoryCount >= 1;
      const ackUpdates = {
        phase: 'spin_question',
        currentCategory: newCategory,
        consecutiveCategoryCount:
          newCategory === state.lastCategory ? state.consecutiveCategoryCount + 1 : 1,
        lastCategory: newCategory,
        pendingSpinResult: null,
        updatedAt: new Date(),
      };
      merged = { ...catResult.updates, ...ackUpdates };
      workState = { ...state, ...catResult.updates, ...ackUpdates } as GameStateData;
      if (isDouble) merged.message = 'double_challenge';
    }
    const qResult = processAction({ type: 'spin_question', playerId: action.playerId }, workState, room);
    if (Object.keys(qResult.updates).length === 0) return qResult;
    const sp = JSON.parse(
      (qResult.updates.pendingSpinResult as string | undefined) ?? workState.pendingSpinResult ?? '{}'
    ) as SpinResult;
    const qId = parseInt(sp.value, 10);
    const usedIds = [...(state.usedQuestionIds ?? []), qId];
    return {
      updates: {
        ...merged,
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
  if (action.type === 'react_barf') {
    return processAction({ type: 'submit_reaction', playerId: action.playerId, reactionType: 'barf', points: 0 }, state, room);
  }
  if (action.type === 'react_cold') {
    return processAction({ type: 'submit_reaction', playerId: action.playerId, reactionType: 'cold', points: 0 }, state, room);
  }
  if (action.type === 'react_close') {
    return processAction({ type: 'submit_reaction', playerId: action.playerId, reactionType: 'close', points: 3 }, state, room);
  }
  if (action.type === 'react_surprised') {
    return processAction({ type: 'submit_reaction', playerId: action.playerId, reactionType: 'surprised', points: 2 }, state, room);
  }
  if (action.type === 'end_round') {
    // E2: نقاط النزاع تُحسب من آخر إيموجي ردٍّ ضُعف (الواجهة لا تفرّق تصنيفًا)
    const WEAK_REACTIONS_TYPES = ['barf', 'cold', 'surprised'];
    const WEAK_FROM_EMOJI = ['😢', '🥶', '😲'];
    const emojiIsWeak = WEAK_FROM_EMOJI.includes(state.lastReactionEmoji ?? '');
    // لا ازدواجية: weak emoji تُحسب مرة واحدة فقط — إما من submit_reaction
    // (إن كان reactionType ضعيفًا) وإما هنا في end_round (من الإيموجي)
    const alreadyCounted = WEAK_REACTIONS_TYPES.includes(state.lastReactionType ?? '');
    const base = processAction({ type: 'next_round', playerId: action.playerId }, state, room);
    if (emojiIsWeak && !alreadyCounted) {
      const topics = (state.conflictTopics ?? []) as string[];
      const topic = `${state.currentCategory ?? 'سؤال'} — سؤال#${(state.roundNumber ?? 0) + 1}`;
      base.updates.conflictTopics = [...topics, topic].slice(-6);
      base.updates.conflictCount = (state.conflictCount ?? 0) + 1;
    }
    return base;
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

  const t: string = action.type;
  switch (t) {
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

    case 'spin': {
      // The UI's actual action name for both the lobby spin and the category/question wheels.
      if (!isCurrentPlayer(action.playerId, state, room)) return { updates: {} };
      if (['waiting', 'spin_start'].includes(state.phase)) {
        // Lobby spin: resolve who goes first and jump to the category wheel.
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
      if (!['spin_category', 'round_end', 'spin_question'].includes(state.phase)) return { updates: {} };
      // Category wheel or question wheel: store pending result and move forward.
      let phase: string = state.phase;
      let pending: string | null = null;
      if (state.phase === 'spin_question') {
        const result = resolveQuestionSpin(state);
        phase = 'question';
        pending = JSON.stringify(result);
      } else {
        const result = resolveCategorySpin(state);
        phase = 'spin_question';
        pending = JSON.stringify(result);
      }
      return {
        updates: {
          phase,
          pendingSpinResult: pending,
          updatedAt: now,
        },
      };
    }

    case 'pick_question': {
      // UI alias for the question wheel when already in spin_question phase.
      if (!isCurrentPlayer(action.playerId, state, room)) return { updates: {} };
      if (state.phase !== 'spin_question') return { updates: {} };
      if (!state.pendingSpinResult) return { updates: {} };
      const sp = JSON.parse(state.pendingSpinResult) as SpinResult;
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
      // A2 FIX (REPAIR_PLAN): guard ضد ACK المكرر — النقرة المزدوجة ترسل ACK مرتين.
      // ACK الثاني يجب أن يُتجاهل بأمان (idempotent no-op) بدل كسر الحالة (BUG-001/UX-BH01/02).
      // من round_end/round transitions العجلة تبدأ من المرحلة الجديدة (spin_category)،
      // لذا يُقبل ACK إذا كانت المرحلة تملك نتيجة معلقة (pendingSpinResult غير فارغة).
      if (!['spin_start', 'spin_category', 'round_end'].includes(state.phase)) return { updates: {} };
      if (!state.pendingSpinResult) return { updates: {} };
      if (state.phase !== 'spin_start') {
        // مرحلة لاحقة: انتقل إلى spin_question مع مسح النتيجة المعلقة
        const sp = JSON.parse(state.pendingSpinResult) as SpinResult;
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
      const sp = JSON.parse(state.pendingSpinResult) as SpinResult;
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
      // A2 FIX (REPAIR_PLAN): guard ضد ACK المكرر — same as spin_category_ack.
      // Idempotent: المكرر يُقبل بصمت مع رسالة واضحة بدل silent {} — الواجهة تعرف رفضت أم لا.
      if (state.phase !== 'spin_question') return { updates: {}, error: 'الـ ACK وصل في طور غير صحيح' };
      if (!state.pendingSpinResult) return { updates: {}, error: 'الـ ACK لم يعد صالحًا — السؤال اختير فعلًا' };
      const sp = JSON.parse(state.pendingSpinResult) as SpinResult;
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
      const sa = action as Extract<GameAction, { type: 'submit_answer' }>;
      if (state.phase !== 'question') return { updates: {}, error: 'لا يوجد سؤال نشط الآن' };
      if (state.currentAnswer) return { updates: {}, error: 'تمت الإجابة على هذا السؤال بالفعل' };
      // The OTHER player (not currentPlayer) answers — currentPlayer is the asker.
      // Block the asker from answering their own question (unless a bomb redirected).
      const askerIdx = state.currentPlayerIdx;
      const actorIdx = playerIdx(action.playerId, room);
      // bombRedirect = idx of the player who USED the bomb (= the answerer who deflected).
      // Semantics: after a bomb, the ASKER must answer. Otherwise the ANSWERER (other player) answers.
      const bombActive = state.bombRedirect !== null && state.bombRedirect !== undefined;
      if (actorIdx === askerIdx) {
        // Asker may answer ONLY when a bomb redirected the question to them
        if (!bombActive) return { updates: {}, error: 'أنت من اختار السؤال — دور الطرف الآخر للإجابة' };
      } else {
        // Answerer may answer ONLY when no bomb is active
        if (bombActive) return { updates: {}, error: 'القنبلة فُعلّت — السؤال انتقل للطرف الآخر' };
      }
      return {
        updates: {
          phase: 'reaction',
          currentAnswer: sa.answer,
          currentAnswerBy: sa.playerId,
          bombRedirect: null,
          updatedAt: now,
        },
      };
    }

    case 'submit_reaction': {
      const sr = action as Extract<GameAction, { type: 'submit_reaction' }>;
      // Explicit explicit rejection — الواجهة تعرض رسالة بدل silent {} في طور التقييم (BUG-003).
      if (state.phase !== 'reaction') return { updates: {}, error: 'التقييم غير متاح حاليًا — لا يوجد إجابة لتقييمها' };
      // A2 FIX: guard reaction مزدوج — النقرة المكررة لا تعطي نقاطًا إضافية (idempotent)
      // Idempotent explicit: تُقبل بلا أثر مع رسالة واضحة للواجهة (بدل silent {}).
      if (state.reactionDone) return { updates: {}, error: 'التقييم سُجِّل من قبل — لا نقاط إضافية' };

      // The asker (currentPlayer) rates the answerer's response
      // The answerer is identified by currentAnswerBy
      const answererPlayerId = state.currentAnswerBy;
      const answererIdx = answererPlayerId === room.player1Id ? 0 : 1;
      const answererScoreKey = answererIdx === 0 ? 'player1Score' : 'player2Score';

      const currentAnswererScore = (state[answererScoreKey as keyof GameStateData] as number) ?? 0;
      // ── double_points: if active, multiply reaction points by 2 and deactivate ──
      const effectivePoints = state.doublePointsActive ? sr.points * 2 : sr.points;
      // FIX #6: حفظ من ردّ ونوع الإيموجي حتى يظهر بوضوح للطرفين
      const REACTION_EMOJI: Record<string, string> = {
        love: '❤️', laugh: '😂', deep: '🧠', touching: '🥹', bold: '🔥', close: '⭐',
        surprised: '😲', barf: '😢', cold: '🥶',
      };
      const updates: Partial<GameStateData> = {
        [answererScoreKey]: currentAnswererScore + effectivePoints,
        loveCounter: (state.loveCounter ?? 0) + 1,
        reactionDone: true,
        lastReactionBy: sr.playerId,
        lastReactionEmoji: REACTION_EMOJI[sr.reactionType ?? ''] ?? '❤️',
        doublePointsActive: false, // consume the effect regardless
        updatedAt: now,
      };

      // ── مرحلة E2 — Conflict Detection ──────────────────────────────────────
      // تصنيف ضعيف (barf/cold/surprised) يسجّل نقطة نزاع — لا ننتقل فورًا
      // بل نجمع حتى الحدّ بعد انتهاء الجولة (لا نكسر إيقاع اللعب)
      const WEAK_REACTIONS = ['barf', 'cold', 'surprised'];
      if (WEAK_REACTIONS.includes(sr.reactionType ?? '')) {
        const topics = (state.conflictTopics ?? []) as string[];
        const topic = `${state.currentCategory ?? 'سؤال'} — سؤال#${(state.roundNumber ?? 0) + 1}`;
        Object.assign(updates, {
          lastReactionType: sr.reactionType,
          conflictTopics: [...topics, topic].slice(-6),
          conflictCount: (state.conflictCount ?? 0) + 1,
        });
      }

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

      // ── مرحلة E2 — Conflict Room: بعد تصنيفين ضعيفين في الجلسة ────────
      // ندخل حوار النزاع المتناوب قبل سؤال جديد
      const conflictThreshold = 2;
      if ((state.conflictCount ?? 0) >= conflictThreshold && !(state.conflictAgreed ?? false)) {
        return {
          updates: {
            phase: 'conflict',
            roundNumber: (state.roundNumber ?? 0) + 1,
            currentPlayerIdx: nextPlayer,
            conflictDialogueCount: 0,
            conflictReplyText: null,
            updatedAt: now,
          },
        };
      }

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
          // reset bomb redirect
          bombRedirect: null,
          updatedAt: now,
        },
      };
    }

    // ── مرحلة E2 — Conflict Room dialogue (تناوب): conflict_step = تناوب الرد ───
    case 'conflict_step': {
      const cs = action as Extract<GameAction, { type: 'conflict_step' }>;
      if (state.phase !== 'conflict') return { updates: {}, error: 'غرفة النزاع غير نشطة' };
      if (!isCurrentPlayer(action.playerId, state, room)) return { updates: {}, error: 'ليس دورك في الحوار' };
      if (typeof cs.text !== 'string' || cs.text.trim().length < 2) {
        return { updates: {}, error: 'اكتب ردّك أولًا' };
      }
      const actorName = room.player1Id === cs.playerId ? (room.player1Name ?? 'الطرف الأول') : (room.player2Name ?? 'الطرف الثاني');
      return {
        updates: {
          currentPlayerIdx: (playerIdx(cs.playerId, room) === 0 ? 1 : 0) as 0 | 1,
          conflictDialogueCount: (state.conflictDialogueCount ?? 0) + 1,
          conflictReplyText: cs.text.trim(), // kept so the other client can display it
          updatedAt: now,
        },
        message: `ردّ ${actorName}: ${cs.text.trim()}`,
      };
    }

    // ── مرحلة E2 — Mutual Agreement + Love Counter ───────────────────────
    case 'conflict_agree': {
      if (state.phase !== 'conflict') return { updates: {}, error: 'غرفة النزاع غير نشطة' };
      // الاتفاق المتبادل: الزر ظاهر للطرفين بعد حوار كل منهما — أي طرف يمكنه تأكيده
      if ((state.conflictDialogueCount ?? 0) < 2) {
        return { updates: {}, error: 'يجب أن يشارك الطرفان في الحوار أولًا' };
      }
      return {
        updates: {
          conflictAgreed: true,
          loveCounter: (state.loveCounter ?? 0) + 3,
          updatedAt: now,
        },
        message: 'اتفقنا على فهم أفضل 💞 (+3 حب)',
      };
    }

    // ── مرحلة E2 — العودة لسؤال المتابعة بعد الاتفاق ────────────────────
    case 'conflict_next': {
      if (state.phase !== 'conflict') return { updates: {}, error: 'غرفة النزاع غير نشطة' };
      if (!(state.conflictAgreed ?? false)) return { updates: {}, error: 'لم يتم الاتفاق المتبادل بعد' };
      // بعد الاتفاق المتبادل: العودة لسؤال المتابعة — الدور ينتقل للطرف الآخر
      const nextPlayer2 = state.currentPlayerIdx === 0 ? 1 : 0;
      return {
        updates: {
          phase: 'question',
          currentPlayerIdx: nextPlayer2,
          currentQuestionId: state.currentQuestionId ?? null,
          currentCategory: state.currentCategory ?? null,
          currentAnswer: null,
          currentAnswerBy: null,
          reactionDone: false,
          conflictDialogueCount: 0,
          conflictAgreed: false,
          conflictTopics: [],
          conflictCount: 0,
          updatedAt: now,
        },
      };
    }

    case 'use_bomb': {
      if (state.phase !== 'question') return { updates: {}, error: 'القنبلة متاحة فقط أثناء السؤال' };
      if (state.currentAnswer) return { updates: {}, error: 'فات الأوان — تمّت الإجابة بالفعل' };
      // Bomb belongs to the ANSWERER (the player who is NOT the asker).
      // The asker (currentPlayerIdx) cannot use the bomb.
      const askerIdx = state.currentPlayerIdx as 0 | 1;
      const actorIdx = playerIdx(action.playerId, room) as 0 | 1;
      if (actorIdx === askerIdx) {
        return { updates: {}, error: 'القنبلة للمجيب فقط — أنت السائل' };
      }
      if (state.bombRedirect) return { updates: {}, error: 'يوجد قنبلة مفعّلة بالفعل' };
      const bombKey = actorIdx === 0 ? 'player1Bomb' : 'player2Bomb';
      const bombCount = (state[bombKey as keyof GameStateData] as number) ?? 0;
      if (bombCount <= 0) return { updates: {}, error: 'لا تملك قنابل متبقية' };
      // Bomb: redirect the question to the OTHER player (the asker) — they must now answer.
      // bombRedirect = idx of the player who MUST ANSWER after the bomb (= the asker).
      return {
        updates: {
          [bombKey]: bombCount - 1,
          bombRedirect: actorIdx,
          updatedAt: now,
        } as Partial<GameStateData>,
        message: 'bomb',
      };
    }

    case 'use_skip': {
      if (state.phase !== 'question') return { updates: {}, error: 'التخطي متاح فقط أثناء السؤال' };
      if (state.currentAnswer) return { updates: {}, error: 'التخطي غير متاح بعد الإجابة' };
      // Skip belongs to the ANSWERER (not the asker)
      const askerIdx = state.currentPlayerIdx as 0 | 1;
      const actorIdx = playerIdx(action.playerId, room) as 0 | 1;
      if (actorIdx === askerIdx) return { updates: {}, error: 'التخطي للمجيب فقط — أنت السائل' };
      const skipKey = actorIdx === 0 ? 'player1Skip' : 'player2Skip';
      const skipCount = (state[skipKey as keyof GameStateData] as number) ?? 0;
      if (skipCount <= 0) return { updates: {}, error: 'لا تملك تخطيات متبقية' };
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
          bombRedirect: null,
          updatedAt: now,
        } as Partial<GameStateData>,
        message: 'skip',
      };
    }

    case 'use_deepen': {
      if (state.phase !== 'question') return { updates: {}, error: 'التعمق متاح فقط أثناء السؤال' };
      // Deepen belongs to the ANSWERER (not the asker)
      const askerIdx = state.currentPlayerIdx as 0 | 1;
      const actorIdx = playerIdx(action.playerId, room) as 0 | 1;
      if (actorIdx === askerIdx) return { updates: {}, error: 'التعمق للمجيب فقط — أنت السائل' };
      const deepenKey = actorIdx === 0 ? 'player1Deepen' : 'player2Deepen';
      const deepenCount = (state[deepenKey as keyof GameStateData] as number) ?? 0;
      if (deepenCount <= 0) return { updates: {}, error: 'لا تملك تعمقات متبقية' };

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
      if (state.phase !== 'question') return { updates: {}, error: 'لا تضحك متاحة فقط أثناء السؤال' };
      if (state.currentAnswer) return { updates: {}, error: 'لا تضحك غير متاحة بعد الإجابة' };
      // DontLaugh belongs to the ANSWERER (not the asker)
      const askerIdx = state.currentPlayerIdx as 0 | 1;
      const actorIdx = playerIdx(action.playerId, room) as 0 | 1;
      if (actorIdx === askerIdx) return { updates: {}, error: 'لا تضحك للمجيب فقط — أنت السائل' };
      const dlKey = actorIdx === 0 ? 'player1DontLaugh' : 'player2DontLaugh';
      const dlCount = (state[dlKey as keyof GameStateData] as number) ?? 0;
      if (dlCount <= 0) return { updates: {}, error: 'لا تملك تحديات لا-تضحك متبقية' };
      // dont_laugh: the ANSWERER must keep a straight face while the ASKER tries to make them laugh.
      return {
        updates: {
          [dlKey]: dlCount - 1,
          phase: 'dont_laugh',
          dontLaughActive: true,
          dontLaughStartedAt: now,
          // keep currentPlayerIdx = asker (the one trying to make the other laugh)
          updatedAt: now,
        } as Partial<GameStateData>,
      };
    }

    case 'know_me_answer': {
      const km = action as Extract<GameAction, { type: 'know_me_answer' }>;
      if (state.phase !== 'know_me') return { updates: {} };
      if (km.playerId !== state.knowMeAnswerBy) return { updates: {} };
      const answerText = km.answer ?? km.text ?? '';
      if (!answerText) return { updates: {} };
      return {
        updates: {
          knowMeAnswer: answerText,
          updatedAt: now,
        },
      };
    }

    case 'know_me_guess': {
      const kg = action as Extract<GameAction, { type: 'know_me_guess' }>;
      if (state.phase !== 'know_me') return { updates: {} };
      if (kg.playerId !== state.knowMeGuessBy) return { updates: {} };
      const guessText = kg.guess ?? kg.text ?? '';
      const correct =
        guessText.trim().toLowerCase() ===
        (state.knowMeAnswer ?? '').trim().toLowerCase();
      const guessIdx = playerIdx(kg.playerId, room) as 0 | 1;
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
      const sm = action as Extract<GameAction, { type: 'secret_msg' }>;
      const idx = playerIdx(sm.playerId, room);
      const msgKey = idx === 0 ? 'secretMsg1' : 'secretMsg2';
      const updates: Partial<GameStateData> = {
        [msgKey]: sm.message,
        updatedAt: now,
      };
      // Check if both sent
      const msg1 = idx === 0 ? sm.message : state.secretMsg1;
      const msg2 = idx === 1 ? sm.message : state.secretMsg2;
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
      const ca = action as Extract<GameAction, { type: 'challenge_answer' }>;
      if (state.phase !== 'challenge') return { updates: {} };
      if (!state.challengeActive) return { updates: {} };
      // The OTHER player (not challengeBy) must answer
      if (ca.playerId === state.challengeBy) return { updates: {} };
      if (!ca.answer?.trim()) return { updates: {} };
      // fix: نحفظ الإجابة أولاً قبل الانتقال للسؤال التالي
      const trimmedAnswer = ca.answer.trim();
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
      const sc = action as Extract<GameAction, { type: 'set_custom_challenge' }>;
      if (!sc.question?.trim()) return { updates: {} };
      return {
        updates: {
          customChallenge: sc.question.trim(),
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

    default: {
      // B2 FIX (REPAIR_PLAN): ممنوع النجاح الصامت — أي type غير معروف يرجع خطأ صريحًا
      // بدل updates={} (الذي كان يسبب success=true بدون أثر → BUG-002/003).
      return { updates: {}, error: `unknown_action: ${(action as { type: string }).type}` };
    }
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
