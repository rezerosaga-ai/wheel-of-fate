CREATE TABLE "wof_chat_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"room_code" text NOT NULL,
	"player_id" text NOT NULL,
	"player_name" text NOT NULL,
	"content" text NOT NULL,
	"message_type" text DEFAULT 'text' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wof_conflict_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"room_code" text NOT NULL,
	"topic" text NOT NULL,
	"step" integer DEFAULT 0 NOT NULL,
	"resolved" boolean DEFAULT false NOT NULL,
	"step_data" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wof_game_state" (
	"id" serial PRIMARY KEY NOT NULL,
	"room_code" text NOT NULL,
	"current_player_idx" integer DEFAULT 0 NOT NULL,
	"round_number" integer DEFAULT 0 NOT NULL,
	"phase" text DEFAULT 'waiting' NOT NULL,
	"current_category" text,
	"current_question_id" integer,
	"current_answer" text,
	"current_answer_by" text,
	"reaction_done" boolean DEFAULT false NOT NULL,
	"player1_score" integer DEFAULT 0 NOT NULL,
	"player2_score" integer DEFAULT 0 NOT NULL,
	"love_counter" integer DEFAULT 0 NOT NULL,
	"player1_bomb" integer DEFAULT 1 NOT NULL,
	"player1_skip" integer DEFAULT 3 NOT NULL,
	"player1_deepen" integer DEFAULT 2 NOT NULL,
	"player1_dont_laugh" integer DEFAULT 1 NOT NULL,
	"player2_bomb" integer DEFAULT 1 NOT NULL,
	"player2_skip" integer DEFAULT 3 NOT NULL,
	"player2_deepen" integer DEFAULT 2 NOT NULL,
	"player2_dont_laugh" integer DEFAULT 1 NOT NULL,
	"consecutive_category_count" integer DEFAULT 0 NOT NULL,
	"last_category" text,
	"fate_card_shown_at" integer DEFAULT 0 NOT NULL,
	"know_me_shown_at" integer DEFAULT 0 NOT NULL,
	"secret_msg1" text,
	"secret_msg2" text,
	"secret_msg_revealed" boolean DEFAULT false NOT NULL,
	"know_me_question" text,
	"know_me_answer" text,
	"know_me_guess" text,
	"know_me_answer_by" text,
	"know_me_guess_by" text,
	"dont_laugh_active" boolean DEFAULT false NOT NULL,
	"dont_laugh_started_at" timestamp,
	"pending_spin_result" text,
	"deepen_question_text" text,
	"conflict_topics" jsonb DEFAULT '[]'::jsonb,
	"used_question_ids" jsonb DEFAULT '[]'::jsonb,
	"player1_last_seen" timestamp,
	"player2_last_seen" timestamp,
	"challenge_active" boolean DEFAULT false NOT NULL,
	"challenge_questions_left" integer DEFAULT 0 NOT NULL,
	"challenge_question_id" integer,
	"challenge_answer" text,
	"challenge_by" text,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "wof_game_state_room_code_unique" UNIQUE("room_code")
);
--> statement-breakpoint
CREATE TABLE "wof_question_reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"question_id" integer NOT NULL,
	"reason" text NOT NULL,
	"player_id" text NOT NULL,
	"room_code" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wof_questions" (
	"id" serial PRIMARY KEY NOT NULL,
	"category" text NOT NULL,
	"text" text NOT NULL,
	"depth" integer DEFAULT 1 NOT NULL,
	"deepen_follow_up" text,
	"is_adaptive" boolean DEFAULT false NOT NULL,
	"source_reflection_id" integer
);
--> statement-breakpoint
CREATE TABLE "wof_reflections" (
	"id" serial PRIMARY KEY NOT NULL,
	"room_code" text NOT NULL,
	"player_id" text NOT NULL,
	"session_date" text NOT NULL,
	"content" text NOT NULL,
	"emotions_analysis" jsonb,
	"topics_found" jsonb DEFAULT '[]'::jsonb,
	"adaptive_questions_generated" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wof_rooms" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"player1_id" text NOT NULL,
	"player1_name" text NOT NULL,
	"player2_id" text,
	"player2_name" text,
	"status" text DEFAULT 'waiting' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "wof_rooms_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "wof_topics" (
	"id" serial PRIMARY KEY NOT NULL,
	"room_code" text NOT NULL,
	"topic" text NOT NULL,
	"status" text DEFAULT 'needs_attention' NOT NULL,
	"first_seen_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
