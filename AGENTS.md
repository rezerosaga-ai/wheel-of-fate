# Wheel of Fate — AI Development Rules

## Core Architecture

**Wheel of Fate** is a real-time couple's question game: two players create/join a room code, answer questions, rate answers, chat, reflect, and resolve conflicts together.

| Layer | Technology | Notes |
|-------|-----------|-------|
| Framework | Next.js 16.3.1 (App Router) | Vercel deployment; Turbopack in dev |
| Language | TypeScript (strict) | `pnpm run typecheck`, `pnpm run verify` (typecheck + lint + production build) |
| Database | Neon Postgres via Drizzle ORM | `src/db` + `src/db/schema.ts`; use connection DIRECT endpoint in tests, pooler in production |
| Package manager | pnpm 10+ exclusively | No npm/yarn; keep `pnpm-lock.yaml` in sync |
| Error monitoring | Sentry | Prod errors auto-create GitHub Issues (Sentry↔GitHub sync both directions active) |
| QA | Playwright harnesses in `qa-campaign/` | Never modify production to fix a failing test first — diagnose with logs |
| Hosting | Vercel (autoscale) | Deployments are automatic on `main` commits |

**Not in use (do not reintroduce):** Phaser, `src/game`, `src/kit`, Cloudflare Workers (`wrangler.toml`), Dockerfile. Removed 2026-08-18 as dead template leftovers.

---

## Repository Structure

```
src/
├── app/                ← Next.js App Router (routes, layouts, API under api/)
│   └── api/room/[code]/ ← room state / action / chat / reflect / stream routes
├── components/         ← React UI components
├── lib/                ← game-logic.ts (authoritative state machine), auth.ts (NextAuth), db
middleware/             ← Next 16 folder convention (index.ts + matcher.ts)
qa-campaign/            ← ALL QA harnesses, reports, evidence (source of truth for stability)
docs/                   ← technical reports
```

---

## Golden Rules (hard, non-negotiable)

1. **Simulate before fixing (Repair Lab methodology).** Every bug gets hypotheses, a simulated fix, compatibility check, then the real fix. Never edit production code on impulse.
2. **No silent failures.** Every error path must report explicitly (error banners, API error objects). If a player-visible failure was silent, it is a bug on its own.
3. **Evidence-based verification.** A fix is not done until the failing harness scenario passes on the LIVE production environment (`https://wheel-of-fate-three.vercel.app`), not a dev server. 18/18 on `human_playtest.py` against production is the closing criterion.
4. **Strict turn enforcement.** If an action changes whose turn it is (e.g., bomb), the turn MUST transfer on the server and be reflected on both clients. Server-authoritative; the UI never decides.
5. **Every production-blocking subsystem needs harness coverage.** Auth, DB, realtime, turn logic — each must have at least one automated scenario. Guest-mode coverage alone is insufficient (see `qa-campaign/CLAUDE-FEEDBACK-RESPONSE.md`).
6. **Do not fix bugs during QA campaigns.** QA reports; Repair Lab fixes. Keep the phases separate.
7. **No raised timeouts or retries to hide flakiness.** Record the failure with the timeline and DOM evidence.
8. **Sentry issues become GitHub Issues automatically.** Never create duplicate manual issues for Sentry-detected prod errors.

---

## Stability Baselines

- **Stable production commit (rollback fallback):** `4c5777d3`
- **Closing criterion for any change:** full `human_playtest.py` re-run against production = 18/18 PASS, plus Sentry quiet under the same load.
- **Retry resilience:** `retryWrap` (in room routes) walks up to 8 attempts with exponential backoff against Neon pooler transient errors (`ECONNRESET`/`ECONNREFUSED`/`connection`). Known follow-up: it only inspects `err.message`, not `err.cause` (`HP-BUG-06`).

---

## Release Discipline

- Feature additions only AFTER repair phase closure (closed 2026-08-18; see `qa-campaign/POST-CLAUDE-FINAL-REPORT.md`).
- Additions roadmap: `qa-campaign/ADDITIONS-ROADMAP.md` (voice messages, Conflict Room expansion, Challenge, secret letter, external content, APK rebuild).
- Each addition: Repair Lab first → merge → full harness re-run → Sentry quiet → then next addition.
- iOS/Safari and k6 load testing remain open verification items; block marketing pushes on them.

---

## QA Assets (do not delete)

`qa-campaign/human_playtest.py` (H1–H6 + planned H7 auth), `harness.py`, `button_auditor.py`, `conflict_run.py`, `check_vercel*.py`, evidence screenshots, `BOMB-TOOLS-CONTRACT.md` (root-cause log), `todo.md`, `POST-CLAUDE-FINAL-REPORT.md`.

**Success signals agreed with the owner:** "تم 😍" for a completed stage, "🥳" for a closed campaign.
