import {
  pgTable,
  text,
  integer,
  boolean,
  jsonb,
  timestamp,
  serial,
} from 'drizzle-orm/pg-core';

// ─── Users (Google Auth) ───────────────────────────────────────────────────────
export const users = pgTable('wof_users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  googleId: text('google_id').unique(),
  avatarUrl: text('avatar_url'),
  // الـ playerId المحلي (من localStorage) مربوط بهذا الحساب
  wofPlayerId: text('wof_player_id').unique(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ─── Player Stats (Streak + Achievements — مخزّنة في DB بدل localStorage) ──
export const playerStats = pgTable('wof_player_stats', {
  id: serial('id').primaryKey(),
  playerId: text('player_id').notNull().unique(), // browser uuid أو userId
  totalSessions: integer('total_sessions').notNull().default(0),
  currentStreak: integer('current_streak').notNull().default(0),
  longestStreak: integer('longest_streak').notNull().default(0),
  lastPlayedDate: text('last_played_date').notNull().default(''),
  totalLovePoints: integer('total_love_points').notNull().default(0),
  achievements: jsonb('achievements').$type<string[]>().default([]),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ─── Rooms ────────────────────────────────────────────────────────────────────
export const rooms = pgTable('wof_rooms', {
  id: serial('id').primaryKey(),
  code: text('code').notNull().unique(), // e.g. "F7K9Q2"
  player1Id: text('player1_id').notNull(), // browser-generated uuid
  player1Name: text('player1_name').notNull(),
  player2Id: text('player2_id'),
  player2Name: text('player2_name'),
  status: text('status').notNull().default('waiting'), // waiting | playing | ended
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ─── Game State (one row per room, mutated in place) ─────────────────────────
export const gameState = pgTable('wof_game_state', {
  id: serial('id').primaryKey(),
  roomCode: text('room_code').notNull().unique(),

  // Turn management
  currentPlayerIdx: integer('current_player_idx').notNull().default(0), // 0 = player1, 1 = player2
  roundNumber: integer('round_number').notNull().default(0),
  phase: text('phase').notNull().default('waiting'),
  // phases: waiting | spin_start | spin_category | spin_question | question | answer | reaction | round_end | fate_card | know_me | secret_msg | dont_laugh | session_end | conflict

  // Current round data
  currentCategory: text('current_category'), // love|relationship|personality|confessions|bold|future|laugh|situations
  currentQuestionId: integer('current_question_id'),
  currentAnswer: text('current_answer'),
  currentAnswerBy: text('current_answer_by'), // playerId
  reactionDone: boolean('reaction_done').notNull().default(false),
  lastReactionBy: text('last_reaction_by'), // playerId who reacted (FIX #6: clear reaction visibility)
  lastReactionEmoji: text('last_reaction_emoji'), // ❤️😂🧠🥹🔥⭐

  // Scores
  player1Score: integer('player1_score').notNull().default(0),
  player2Score: integer('player2_score').notNull().default(0),
  loveCounter: integer('love_counter').notNull().default(0),

  // Tools (counts per player)
  player1Bomb: integer('player1_bomb').notNull().default(1),
  player1Skip: integer('player1_skip').notNull().default(3),
  player1Deepen: integer('player1_deepen').notNull().default(2),
  player1DontLaugh: integer('player1_dont_laugh').notNull().default(1),
  player2Bomb: integer('player2_bomb').notNull().default(1),
  player2Skip: integer('player2_skip').notNull().default(3),
  player2Deepen: integer('player2_deepen').notNull().default(2),
  player2DontLaugh: integer('player2_dont_laugh').notNull().default(1),

  // Special round tracking
  consecutiveCategoryCount: integer('consecutive_category_count').notNull().default(0),
  lastCategory: text('last_category'),
  fateCardShownAt: integer('fate_card_shown_at').notNull().default(0), // round number
  knowMeShownAt: integer('know_me_shown_at').notNull().default(0),

  // Secret message state
  secretMsg1: text('secret_msg1'),
  secretMsg2: text('secret_msg2'),
  secretMsgRevealed: boolean('secret_msg_revealed').notNull().default(false),

  // Know Me mini-game
  knowMeQuestion: text('know_me_question'),
  knowMeAnswer: text('know_me_answer'), // the answerer's answer
  knowMeGuess: text('know_me_guess'), // the guesser's guess
  knowMeAnswerBy: text('know_me_answer_by'),
  knowMeGuessBy: text('know_me_guess_by'),

  // Don't Laugh
  dontLaughActive: boolean('dont_laugh_active').notNull().default(false),
  dontLaughStartedAt: timestamp('dont_laugh_started_at'),

  // Pending spin result (server sets, client animates then acknowledges)
  pendingSpinResult: text('pending_spin_result'), // JSON: {type, value}

  // Deepen question
  deepenQuestionText: text('deepen_question_text'),

  // Conflict room topics
  conflictTopics: jsonb('conflict_topics').$type<string[]>().default([]),

  // Used question IDs (to avoid repetition in session)
  usedQuestionIds: jsonb('used_question_ids').$type<number[]>().default([]),

  // Last player heartbeats
  player1LastSeen: timestamp('player1_last_seen'),
  player2LastSeen: timestamp('player2_last_seen'),

  // ── Challenge (UNO-style +2) ────────────────────────────────────────────────
  challengeActive: boolean('challenge_active').notNull().default(false),
  challengeQuestionsLeft: integer('challenge_questions_left').notNull().default(0),
  challengeQuestionId: integer('challenge_question_id'),
  challengeAnswer: text('challenge_answer'),
  challengeBy: text('challenge_by'),

  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ─── Chat Messages ────────────────────────────────────────────────────────────
export const chatMessages = pgTable('wof_chat_messages', {
  id: serial('id').primaryKey(),
  roomCode: text('room_code').notNull(),
  playerId: text('player_id').notNull(),
  playerName: text('player_name').notNull(),
  content: text('content').notNull(),
  messageType: text('message_type').notNull().default('text'), // text | system
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ─── Reflections (private per player per session) ────────────────────────────
export const reflections = pgTable('wof_reflections', {
  id: serial('id').primaryKey(),
  roomCode: text('room_code').notNull(),
  playerId: text('player_id').notNull(),
  sessionDate: text('session_date').notNull(), // YYYY-MM-DD
  content: text('content').notNull(),
  emotionsAnalysis: jsonb('emotions_analysis').$type<Record<string, unknown>>(),
  topicsFound: jsonb('topics_found').$type<string[]>().default([]),
  adaptiveQuestionsGenerated: jsonb('adaptive_questions_generated').$type<string[]>().default([]),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ─── Topics tracker ───────────────────────────────────────────────────────────
export const topics = pgTable('wof_topics', {
  id: serial('id').primaryKey(),
  roomCode: text('room_code').notNull(),
  topic: text('topic').notNull(),
  status: text('status').notNull().default('needs_attention'), // needs_attention | improving | resolved
  firstSeenAt: timestamp('first_seen_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ─── Questions Library ────────────────────────────────────────────────────────
export const questions = pgTable('wof_questions', {
  id: serial('id').primaryKey(),
  category: text('category').notNull(),
  // love | relationship | personality | confessions | bold | future | laugh | situations
  text: text('text').notNull(),
  depth: integer('depth').notNull().default(1), // 1=normal, 2=deep, 3=very deep
  deepenFollowUp: text('deepen_follow_up'), // optional follow-up for Deepen tool
  isAdaptive: boolean('is_adaptive').notNull().default(false), // AI-generated adaptive question
  sourceReflectionId: integer('source_reflection_id'), // if adaptive, which reflection triggered it
});

// ─── Question Reports (user-flagged questions) ────────────────────────────────
export const questionReports = pgTable('wof_question_reports', {
  id: serial('id').primaryKey(),
  questionId: integer('question_id').notNull(),
  reason: text('reason').notNull(), // 'inappropriate' | 'confusing' | 'duplicate' | 'other'
  playerId: text('player_id').notNull(),
  roomCode: text('room_code'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ─── Conflict sessions ────────────────────────────────────────────────────────
export const conflictSessions = pgTable('wof_conflict_sessions', {
  id: serial('id').primaryKey(),
  roomCode: text('room_code').notNull(),
  topic: text('topic').notNull(),
  step: integer('step').notNull().default(0), // 0-7 steps of the guided dialogue
  resolved: boolean('resolved').notNull().default(false),
  stepData: jsonb('step_data').$type<Record<string, string>>().default({}),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
