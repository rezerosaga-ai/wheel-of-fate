'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface PlayerInfo {
  id: string;
  name: string;
  role: 'player1' | 'player2';
}

export interface RoomInfo {
  id: number;
  code: string;
  player1Id: string;
  player1Name: string;
  player2Id: string | null;
  player2Name: string | null;
  status: string;
}

export interface ChatMessage {
  id: number;
  roomCode: string;
  playerId: string;
  playerName: string;
  content: string;
  messageType: string;
  voiceUrl?: string | null;
  clientDedupeKey?: string | null;
  reactions?: Record<string, { emoji: string; playerName: string }> | null;
  createdAt: string;
}

export interface GameStateServer {
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
  lastReactionType: string | null;
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
  dontLaughStartedAt: string | null;
  pendingSpinResult: string | null;
  deepenQuestionText: string | null;
  conflictTopics: string[];
  conflictCount: number;
  conflictDialogueCount: number;
  conflictAgreed: boolean;
  conflictReplyText: string | null;
  usedQuestionIds: number[];
  updatedAt: string;
  // ── Challenge ───────────────────────────────────────────────────────────────
  challengeActive: boolean;
  challengeQuestionsLeft: number;
  challengeQuestionId: number | null;
  challengeAnswer: string | null;
  challengeBy: string | null;
}

interface GameStore {
  // Local player identity (persisted)
  player: PlayerInfo | null;
  room: RoomInfo | null;

  // Server state (from polling)
  gameState: GameStateServer | null;
  messages: ChatMessage[];
  onlineStatus: { player1: boolean; player2: boolean };

  // UI state (local, not persisted)
  chatOpen: boolean;
  spinningWheel: boolean;
  spinDegrees: number;
  lastActionError: string | null;
  isActionPending: boolean;

  // Actions
  setPlayer: (player: PlayerInfo) => void;
  setRoom: (room: RoomInfo) => void;
  setGameState: (gs: GameStateServer) => void;
  setMessages: (msgs: ChatMessage[]) => void;
  setOnlineStatus: (status: { player1: boolean; player2: boolean }) => void;
  setChatOpen: (open: boolean) => void;
  setSpinning: (spinning: boolean, degrees?: number) => void;
  setActionPending: (pending: boolean) => void;
  setActionError: (error: string | null) => void;
  clearRoom: () => void;
}

export const useGameStore = create<GameStore>()(
  persist(
    (set) => ({
      player: null,
      room: null,
      gameState: null,
      messages: [],
      onlineStatus: { player1: false, player2: false },
      chatOpen: false,
      spinningWheel: false,
      spinDegrees: 0,
      lastActionError: null,
      isActionPending: false,

      setPlayer: (player) => set({ player }),
      setRoom: (room) => set({ room }),
      setGameState: (gs) => set({ gameState: gs }),
      setMessages: (msgs) => set({ messages: msgs }),
      setOnlineStatus: (status) => set({ onlineStatus: status }),
      setChatOpen: (open) => set({ chatOpen: open }),
      setSpinning: (spinning, degrees = 0) =>
        set({ spinningWheel: spinning, spinDegrees: degrees }),
      setActionPending: (pending) => set({ isActionPending: pending }),
      setActionError: (error) => set({ lastActionError: error }),
      clearRoom: () => set({ player: null, room: null, gameState: null, messages: [] }),
    }),
    {
      name: 'wof-player',
      partialize: (state) => ({
        player: state.player,
        room: state.room,
      }),
    }
  )
);
