-- Phase 2: Users (Google Auth) + Player Stats (DB-backed)

-- Users table
CREATE TABLE IF NOT EXISTS "wof_users" (
  "id" serial PRIMARY KEY NOT NULL,
  "email" text NOT NULL UNIQUE,
  "name" text NOT NULL,
  "google_id" text UNIQUE,
  "avatar_url" text,
  "wof_player_id" text UNIQUE,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

-- Player stats table
CREATE TABLE IF NOT EXISTS "wof_player_stats" (
  "id" serial PRIMARY KEY NOT NULL,
  "player_id" text NOT NULL UNIQUE,
  "total_sessions" integer NOT NULL DEFAULT 0,
  "current_streak" integer NOT NULL DEFAULT 0,
  "longest_streak" integer NOT NULL DEFAULT 0,
  "last_played_date" text NOT NULL DEFAULT '',
  "total_love_points" integer NOT NULL DEFAULT 0,
  "achievements" jsonb DEFAULT '[]'::jsonb,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);
