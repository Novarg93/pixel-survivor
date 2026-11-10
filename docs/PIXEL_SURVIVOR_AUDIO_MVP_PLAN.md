# Pixel Survivor — Audio MVP (one focused development day)

**Project:** Phaser 4.2.1, Vue 3, TypeScript, HD Pixel Art.  
**Goal:** Deliver original, coherent audio feedback for the existing game without adding new gameplay systems.  
**Status:** A–E technical verification passed, 2026-11-03; awaiting user listening. See `AUDIO_MVP_REPORT.md`.  
**Codex reasoning:** High for implementation; Medium for final QA-only fixes.

## Scope / boundaries

- Work in a new feature branch from the latest accepted **local** project revision, after the current gameplay changes are committed. Do not assume GitHub `main` has newer local changes.
- Read `AGENTS.md`, `docs/PROGRESS.md`, the current sound code and user settings before editing.
- Do **not** alter combat, spawn, cooldown, XP, loot, balance, scoring, collision, timing, or UI layout except audio controls in existing settings.
- No Laravel, payment, telemetry, new heroes, new skills, new boss types, audio chat, localization refactor, or audio middleware beyond what is needed.
- Target one focused development day. Finish stable essentials first; list optional work as deferred instead of inflating the scope.
- Use original sounds composed/generated specifically for this game or assets with explicit commercial redistribution rights and retained license/attribution. Do not copy soundtracks or SFX from other games. Do not assume a license because an asset is publicly downloadable.

## Proposed milestones (priority order)

| Milestone | Deliverable | Acceptance |
|---|---|---|
| A — Audio foundation | Typed sound event catalog; central audio controller; Phaser sound interface; audio buses `master`, `music`, `sfx`, `ui`, `ambient`; stored mute/volumes | Nothing plays before the required user gesture; silent browser/failure remains playable |
| B — Key feedback | UI click/upgrade, XP pickup (coalesced), health pickup, rare loot, Guardian awakening, boss arrival, player damage/death, blink/dash | Each important event has a distinguishable sound and sensible priority |
| C — Combat | Sounds for Mage (Fireball, Frost Nova, Lightning, Armageddon, Shield), Warrior (Cleave, Whirlwind, Slam, Bladestorm, Iron Skin) | Attacks sound differentiated without becoming a wall of overlapping audio |
| D — Atmosphere | Grove and Dark Forest ambient loops; one original musical loop or simple evolving underscore, optionally distinct layers for boss encounter | Smooth transitions, no doubling upon restart; music can be muted separately |
| E — QA / optimization | Deterministic event tests, real Chromium smoke, clean teardown, sound budget benchmark and listening checklist | All existing tests pass and audio works after pause, blur and repeated restarts |

## Creative direction

- Dark fantasy with crisp, restrained impacts; magic sounds layered and distinctive, not constant loud noise.
- Warrior: weight, metal, wind, low-mid impacts. Mage: elemental identity: warm fire, glassy frost, bright violet/blue crackle, heavy meteor impact, shimmering shield.
- Rare Guardian: stone/metal resonant hum and unmistakable awakening cue. Boss arrival: brief threat sting, not a long noninteractive interruption.
- Prioritize feedback for player damage, major impacts and dangerous boss events over sounds from ordinary mobs.
- Avoid loudness jumps; all sounds use short envelopes/fades where suitable and conservative gain.

## Audio implementation details

1. Use Phaser Sound Manager / Web Audio capabilities supported by the **installed** Phaser 4.2.1. Inspect existing APIs and do not transplant incompatible Phaser 3 patterns. Handle browser audio unlock on the user's Start/Continue/tap interaction.
2. Implement a typed mapping of domain events to sounds with one lifecycle owner. The render/audio presentation listens to existing events or world snapshots; the game simulation must not import sound modules.
3. Provide **Master, Music, SFX** sliders and **Mute** in current settings. `Ambient`/`UI` may share existing category settings if that avoids needless controls. Persist via existing versioned settings storage and handle corrupt/unavailable localStorage.
4. Respect pause, focus loss and game over: no surprise resume/autoplay; define deterministic behavior for fading/pausing music and stopping or throttling gameplay SFX.
5. Add category concurrency limits and event-rate limits. Suggested starting points (tune by ear): global simultaneous SFX <= 12; common hit/kill/XP sources each at most ~4-8 plays/s; low-value enemy sounds may be coalesced. **Never play a separate sound for each of 150 mobs every frame.**
6. Use occasional small pitch/volume variance for repeated SFX, but consistent cue identity. Allow fixed-seed tests by injecting randomness when needed.
7. Prevent duplicated AudioContext, duplicated subscriptions, hanging loops and playing sounds after the scene is destroyed. Keep music persistent across scene recreation only if deliberately controlled by a single owner.
8. Handle unsupported codec, decode failure, blocked audio and muted browsers gracefully. Gameplay must remain fully functional and tests must not require speakers.
9. Keep bundled sizes modest; record compressed transfer size and decoded source budget. Prefer a small collection of well-produced original assets over hundreds of procedural files.
10. Include an audio asset manifest with source/provenance and usage/license information. If actual commercial-safe music cannot be sourced or generated responsibly, ship ambient loops and a clearly marked **deferred** music task rather than placeholder copyrighted music.

## Concrete events to cover

### Highest priority

- `ui.start`, `ui.select`, `ui.upgrade`, `ui.pause`, `ui.gameOver`
- `player.hurt`, `player.dash`, `player.blink`, `player.death`
- `pickup.xp` (throttled), `pickup.heal`, `pickup.artifact`, `pickup.buff`
- `encounter.bossArrive`, `encounter.guardianAwaken`, `encounter.guardianLaser`, `encounter.guardianMeteor`

### Combat identity (group repeated hits)

- Mage: `fireball.cast/impact`, `frostNova.cast`, `lightning.cast`, `armageddon.impact`, `arcaneShield.trigger`
- Warrior: `cleave.swing/impact`, `whirlwind.active`, `groundSlam.impact`, `bladestorm.active`, `ironSkin.trigger`
- Additional meteor hits should be audibly rhythmic, with controlled overlapping; avoid three identical maximum-volume booms at rank V.

## Verification

- Run `npm.cmd run check`, `npm.cmd run test:e2e`, `npm.cmd run test:e2e:production`, and `git diff --check` using commands that exist in this project.
- Unit tests: event mapping, master/category gain, mute persistence, rate-limiting/concurrency, no replay after restart, no duplicate listeners, pause/blur lifecycle, missing audio codec/file fallback, coalesced XP pickup.
- Browser checks: real click unlocks audio, mute toggles, controls persist over reload, mobile touch unlock, no JS errors, replay/restart ten times without increasing active loops/nodes/subscriptions.
- Capture evidence with audio instrumentation: event counts, voice peaks, rejected/throttled low-priority events, loaded asset bytes. A passing automation test **does not prove that the audio sounds good**.
- Perform manual listening for at least Warrior and Mage runs: loudness, clarity at 100–150 mobs, boss/Guardian cues, mobile speaker/headphones if possible. Mark untested devices honestly.
- Produce `docs/AUDIO_MVP_REPORT.md` with asset/license list, implemented vs deferred events, output tests, audio settings and subjective listening checklist.
- Do not push/merge/deploy. Commit only if separately authorized in the working task. Stop for user listening after QA.

## Ready-to-send Codex instruction

> Continue the existing Pixel Survivor project. Read this file `PIXEL_SURVIVOR_AUDIO_MVP_PLAN.md` in full, plus `AGENTS.md`, `docs/PROGRESS.md` and relevant audio/settings code. Implement milestones A–E in order, keeping the scope to a focused audio MVP iteration. Prefer a coherent smaller sound set over a huge low-quality library. Use original or properly licensed assets; verify source/license provenance. Never alter gameplay balance. Run the full tests and real-browser smoke, report which assets are actually audible and which are deferred. Keep existing game logic isolated from audio presentation. Work in a new feature branch based on the latest accepted local revision; do not push/merge/deploy. Finish with `docs/AUDIO_MVP_REPORT.md` and stop for manual listening. Reasoning: High.
