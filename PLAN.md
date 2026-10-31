# PIXEL SURVIVOR — MASTER GAME PLAN

Version: 1.0. Intended for local Windows development using Codex CLI. Language of developer communications: Russian. Source code/types/comments may be in English.

## 0. Objective
Build a complete, fun, offline-first, single-player 2D browser survivors-like MVP with original procedural pixel-art graphics. Deliver a directly playable, testable game, NOT a mockup, slide deck, or purely visual demo. Autonomous implementation runs in stages `tasks/00` through `tasks/11`. Every stage must finish usable and validated. Continue autonomously until the current stage meets its acceptance criteria. Do not ask routine technical questions; make sensible documented choices.

### Core gameplay
- Landscape: top-down pixel-art fantasy field, camera follows character, seamless-looking tiled environment; no quests/story/crafting/inventory/multiplayer.
- Controls: WASD / arrows to move; mouse not used to aim; skills activate automatically. Mobile controls are later enhancements.
- Mage as first/only playable hero for MVP, recognizable at pixel-art scale; five unique automatic skills eventually.
- Enemies spawn just outside the camera, pursue or otherwise pressure player; keep max roughly 150 regular enemies alive (configurable performance ceiling, not a performance guarantee). No endless millions of enemies.
- Kill enemies -> drop XP orbs -> collect -> gain level -> pause gameplay -> 3 random upgrade options -> choose one -> resume.
- Spawning, enemy stats, elites, and boss combinations increase pressure over time. Avoid only monotonically inflating HP. First miniboss by 5–8 mins; more bosses later.
- Runs target 15–20 minutes to reach major escalation; optional endless survival past 20 minutes, then death ends run.
- Score from kills and bosses, show time and personal-best scores locally. NO public/global leaderboard until backend and anti-cheat phase.
- Gold, monetization, premium upgrades, tokens, paid revives, ads, accounts, server-side score, real payments are explicitly OUT OF SCOPE for this unattended run. Define optional extension points only if no overhead.

## 1. Fixed technology and constraints
- Vite + Vue 3 + TypeScript, Phaser 4 (pin stable verified 4.2.1 unless project evidence demonstrates incompatibility), Vitest; Playwright testing where available.
- Node runtime: check installed version and documented compatible tool versions. No Laravel, database, Redis, APIs, third-party tracking, CDN, network requirement at game runtime.
- Phaser: gameplay loop, rendering, input, physics/collisions. Vue: menus, selection cards, HUD and results. Use a typed event bridge/state snapshots; do NOT push each per-enemy state every frame through Vue reactivity.
- Organize TS modules by responsibility; avoid monolithic scenes, globals, excessive inheritance, and overengineering. Phaser 4 actual public API, no old Phaser 3-specific APIs assumed blindly.
- No external paid assets or reused copyrighted gameplay/characters; generate intentionally styled, original pixel assets using code or source-controlled handcrafted local art. Distinct visual identity.
- No secrets, no production deploy, no real money integration, no remote writes, no touching other projects or parent directory, no `rm -rf`/destructive actions.
- Keep dependencies lean; version and lock dependencies, obey npm lockfile. Do not silently disable TypeScript checks to make build pass.

## 2. Game design values
1. Responsive movement: diagonals normalized; acceleration/snappiness tuned, no camera jitter.
2. Readable survival: player, enemies, XP, effects always distinguishable; no visual overload.
3. Impact: sound toggle, damage flashes, small hit feedback, knockback where safe, enemy death particles, pickups.
4. Fair random upgrades: 3 distinct eligible options where possible, no maxed-out duplicate, ensure usable upgrades and deterministic tests with seeded RNG.
5. Pacing: 0–3min learning; 3–8min variety; 8–15min meaningful build and elite/boss challenges; after 15min escalating mixed waves.
6. Survivability: player maxHP 100; HP changes, 0 => one GameOver; damage has brief cooldown/invincibility to prevent death in one collision frame.
7. Scoring: regular enemy 10, fast 15, tank 30, ranged 25, elite multiplier x3, boss 1000 or tuned. Score event-based; no points from idling.
8. Enemy budget: max 150 regular enemies plus 2–4 boss slots; sensible spawn attempts and cleanup. FPS target desktop 60 and acceptable low-power/mobile performance, verify on hardware; no unsupported promises.
9. Map: efficient recycled chunks/tiles near camera; deterministic decorative placement; no endless world accumulation.
10. Accessibility: pause/volume, high-contrast UI, no loss of control when card picker opens, keyboard navigation to upgrade modal, clear restart.

## 3. Detailed gameplay specifications
### 3.1 Mage
- 4/8 directional walk animation optional where affordable, separate idle.
- Top-down movement in world coordinates (pixels/s), 8-direction keyboard, normalized diagonals; world bounds unlimited.
- Follow camera smoothly with rounded pixel coordinates if practical.
- Five auto-skills implemented by stage 04: `Fireball`, `FrostAura`, `ChainLightning`, `Meteor`, `ArcaneShield`.
- Fireball: nearest enemy within range, projectile flight, collision, damage, cooldown; aim automatically.
- FrostAura: periodic AOE around player, damage and slowing; no uncontrolled per-frame damage.
- ChainLightning: periodic nearest target and chained unique targets in radius, bounded chains.
- Meteor: periodic marker, delay, AOE attack in densest enemy region; telegraph.
- ArcaneShield: passive temporary shield/cooldown/damage mitigation and distinct visual indicator; meaningful upgrade options.
- Skills share `AbilityDefinition`, state, cooldown timing, effect applications; behaviors are unique modules. Don't force an abstraction that harms clarity.

### 3.2 Upgrade system
- XP from defeated enemies, pickups expire or pool when safe; magnetic collection radius.
- XP threshold increases with level, e.g. base 20 and +~15% per level, adjustable by config.
- On level-up, pause simulation using a reliable method, not unintentionally freezing UI; show exactly 3 distinct eligible choices as possible (fewer only if total eligible <3, with documented fallback). Choices may add/upgrade unlocked skills, HP, movement, cooldown, damage, projectile count, area.
- 3 free upgrades; NO fourth paid option. Max levels; deterministic RNG for tests; choices have localized clear descriptions in Russian or English consistently.
- Evolution as later stage: 1–2 satisfying capstone changes when prerequisites reached. Avoid exponential damage bugs; cap effects.

### 3.3 Enemies
- Basic grunt: chases player.
- Fast runner: faster, fragile.
- Tank brute: slower, more HP.
- Ranged caster: keeps some distance, telegraphed projectile, limited shooting cadence.
- Elite variants with recognizable outline/scale and higher danger; not arbitrary invisible scaling.
- Steering separation to prevent entire group occupying exactly same point without expensive all-vs-all O(n^2), e.g. lightweight spatial hashing/cells or restricted local avoidance.
- Despawn enemies far beyond camera, but avoid XP/kill/score exploitation; kill vs despawn distinguished.

### 3.4 Bosses
- Charge brute: short telegraph then dash, recovery window, collision damage.
- Rune sorcerer: slow projectile volleys + floor-danger telegraphs with cooldown; max projectile budget.
- Boss indicators and boss HP UI. Multiple bosses allowed late, capped and paced.
- No undodgeable instant hits, no permanent projectile leak.

### 3.5 Difficulty director
- Data-driven spawn profile by elapsed time, independent of player XP; weighted enemy selection and caps; enemy count plateaus, tactics and elite/boss frequency change.
- At startup clear 30–60sec grace; early stage accessible; after 20min survivable but difficult, and final score always saved locally.
- Prefer bounded waves and predictable boss cadence with limited randomness; stage-specific balancing config separate from code.

### 3.6 Persistence
- `localStorage` ONLY for settings (volume, pixel scale), last played info, top local scores and statistics; JSON validation/versioned schema, corruption fallback, no secrets.
- Score leaderboard clearly labeled `LOCAL / THIS BROWSER`; not a global competitive ranking and not tamperproof.
- No fake server validation and no sending score to network.

## 4. Architecture sketch (adapt pragmatically)
```
src/
  main.ts, App.vue, style.css
  game/
    bootstrap/createGame.ts
    scenes/BootScene.ts, GameScene.ts
    entities/Player.ts, Enemy.ts, Boss.ts, Projectile.ts, XpOrb.ts
    abilities/types.ts, definitions.ts, fireball.ts, frostAura.ts,
       chainLightning.ts, meteor.ts, arcaneShield.ts
    systems/InputSystem.ts, SpawnSystem.ts, CombatSystem.ts,
       ExperienceSystem.ts, UpgradeSystem.ts, DifficultyDirector.ts,
       ScoreSystem.ts, ProjectilePool.ts, SpatialGrid.ts, WorldChunkSystem.ts
    config/gameBalance.ts, config/enemyDefinitions.ts
    events/bridge.ts
    utils/SeededRandom.ts, math.ts
  ui/components/GameHUD.vue, LevelUpModal.vue, GameOverModal.vue,
       MainMenu.vue, SettingsPanel.vue
  tests/ ...
  assets/ or public/assets/ (authored/original, small and licensed)
docs/PROGRESS.md, docs/DECISIONS.md, docs/TEST_REPORT.md
```
Keep this as a guide, not a rigid file count. Phaser game object lifecycle must explicitly remove listeners/timers/colliders/tweens on restart; no duplicate game instances when Vue remounts.

## 5. Quality gates
At EACH stage: review diff, run `npm run check` when dependencies exist, correct failures, manually verify observable behavior if browser available. Must have scripts for `dev`, `typecheck`, `lint`, `test`, `build`, `check`, and `test:e2e` by completion. `check` must be noninteractive and stable. `test:e2e` can be separate because browser binaries may not be installed.

Unit tests should cover: diagonal normalization; xp thresholds and increment; upgrades eligibility/unlocks, no duplicate choices; cooldown timing; score invariants; spawn cap; enemy scaling/time schedule; death state; seeded RNG determinism; local storage fallback. Fake/tick-based tests over slow real timers. Integration tests: scene creation, spawns, fireball hit, level-up pause/resume, game over/restart without leaks. Browser tests: menu->start; WASD movement; enemy HP/kill; XP/level-up modal and selection; no console errors; full-screen screenshot at 1280x720; reduced viewport at 390x844.

If Playwright MCP is connected, acquire real screenshot and inspect pixel-art readability and HUD and UI overlays. Playwright DOM snapshot alone cannot inspect gameplay painted on Canvas. If MCP unavailable, use `@playwright/test` screenshots with a dev-test harness; if browser download unavailable, report that explicitly without claiming visual checks.

Performance: isolate simulation update from render where sensible; clamp huge delta from tab switching, pause; pool projectiles/orbs, remove off-screen objects; no reliance on 1000s of enemies; gather FPS and entity metrics via optional debug overlay. Automated bounded smoke/soak <= 2 min by default; optional 10min stress route. Distinguish measured FPS vs target.

## 6. Stage execution protocol
Tasks live under `tasks/00...11...md`. For each stage: read `AGENTS.md`, this plan, current task and `docs/PROGRESS.md` plus `docs/DECISIONS.md`. Implement concrete behavior, not TODO-only. A stage is successful only if acceptance criteria are met and checks pass. Report what changed, what was tested, unverified limitations and next stage in `docs/PROGRESS.md`.

Only then create marker `docs/done/NN.done` (the runner independently runs checks). If a blocking error occurs, write `docs/BLOCKERS.md` with exact command/log, never fake success. No deploy, no pushing Git remote, no harmful machine-level commands, no modification of existing unrelated projects.

## 7. Out-of-scope roadmap (do not implement now)
- Laravel API, registration, authenticated profiles, online leaderboard, authoritative anti-cheat / replay verification.
- Economy: gold based on points; cosmetic skins, animated ability effects; premium upgrade choice/token revival only for a non-ranked mode after fairness design and regulatory review.
- Multiplayer/co-op, maps, new characters, art marketplace assets, translations, live-ops.

## 8. Definition of done for full run
- Fresh repo starts with `npm install` then `npm run dev`; production `npm run build` passes.
- Mage can move and survive, all 5 auto-abilities affect enemies, at least 4 enemy archetypes and 2 bosses operate, XP/level-ups present 3 useful random options, scoring/death/restart and local best work.
- Mobile viewport renders without accidental overflow; desktop controls and menu work; no known P0 crash or stuck level-up.
- Tests run and pass; browser checks and screenshots collected if environment allows; documented limitations and steps to reproduce.
- Deliver `docs/PROGRESS.md` and `docs/TEST_REPORT.md` with truthful facts, and `README.md` startup commands. No placeholder screens presented as functional gameplay.
