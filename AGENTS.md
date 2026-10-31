# AGENTS.md — Pixel Survivor Codex instructions

This is a NEW and ISOLATED project. Before any work read `PLAN.md`, matching `tasks/NN-*.md` and `docs/PROGRESS.md`. Never touch sibling projects or parent directory. Communicate in Russian. Code and English identifiers may be English.

## Autonomous execution
- Implement current task thoroughly, tests included, without routine questions. Make reasonable decisions and record rationale in `docs/DECISIONS.md`.
- Never claim something works without actually validating it. Prefer a small, shippable slice to an oversized unfinished abstraction.
- Never ask for admin rights, credentials or payments. Never `git push`, deploy, remove external files, or alter Windows system settings. Do not invoke `--yolo`.
- Never introduce in-game real-money purchases, tokens, ads, sign-in, Laravel backend or global leaderboards during this plan.
- If missing asset: create original programmatic pixel art, do not scrape copyrighted sprites. Depend on well-maintained packages already specified in the plan.
- After every meaningful edit: run relevant tests, fix type/lint/build failures. Do not suppress types or disable failing tests.
- If you detect unrelated files or Laravel artisan/composer.json, stop immediately and explain that you are in wrong folder.
- Do not spend more than 3 cycles repeating the same failed approach; diagnose, select alternate approach, or write blocker and stop.
- Update `docs/PROGRESS.md` with implemented functions, files, tests, screenshots, blockers and next task.
- Only create `docs/done/NN.done` after meeting task-specific acceptance criteria; runner will independently verify. Do not mark tasks completed just because command ran.

## Architecture invariants
- Phaser owns gameplay/collisions/scene timing. Vue owns interface. Event bridge updates UI snapshots at bounded rate.
- Data-driven game balancing, seeded RNG where testable, bounded regular mobs and projectile counts.
- Clean scene teardown/restart, explicit input/listener cleanup. No global uncontrolled intervals.
- Canvas visual verification requires SCREENSHOT, not solely DOM snapshot.
