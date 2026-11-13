# Изменённые файлы: эволюция Grove

## Игровой клиент

- `src/App.vue`
- `src/env.d.ts`
- `src/game/art/ForestAtmosphere.ts`
- `src/game/art/groveArtPack.ts`
- `src/game/art/hdGrove.ts`
- `src/game/config/atmosphere.ts`
- `src/game/config/biomes.ts`
- `src/game/scenes/GameScene.ts`
- `src/game/systems/AtmospherePhaseController.ts`
- `src/game/systems/World.ts`
- `src/game/systems/WorldChunkSystem.ts`
- `src/ui/components/LocalRecords.vue`
- `src/ui/components/MainMenu.vue`

## Тесты и фикстуры

- `tests/e2e/camera-fireball-cleanup.spec.ts`
- `tests/e2e/atmosphere-milestones.spec.ts`
- `tests/e2e/atmosphere.spec.ts`
- `tests/e2e/fire-inferno.spec.ts`
- `tests/e2e/fire-radius.spec.ts`
- `tests/e2e/frost-seal.spec.ts`
- `tests/e2e/gamepad.spec.ts`
- `tests/e2e/grove-evolution.spec.ts`
- `tests/e2e/hd-bosses.spec.ts`
- `tests/e2e/hd-elites.spec.ts`
- `tests/e2e/hd-enemies.spec.ts`
- `tests/e2e/hd-integration.spec.ts`
- `tests/e2e/hd-live-stress.spec.ts`
- `tests/e2e/hd-loot.spec.ts`
- `tests/e2e/hd-performance.spec.ts`
- `tests/e2e/hd-rework-performance.spec.ts`
- `tests/e2e/hd-ui.spec.ts`
- `tests/e2e/hd-warrior.spec.ts`
- `tests/e2e/lightning-aftershock.spec.ts`
- `tests/e2e/lightning-cinematic.spec.ts`
- `tests/e2e/lightning-devastation.spec.ts`
- `tests/e2e/lightning-spawn-relief.spec.ts`
- `tests/e2e/loot.spec.ts`
- `tests/e2e/phase2.spec.ts`
- `tests/e2e/phase3.spec.ts`
- `tests/e2e/production.spec.ts`
- `tests/e2e/runner-art.spec.ts`
- `tests/e2e/runner-performance.spec.ts`
- `tests/helpers/map.ts`
- `tests/unit/atmosphere.test.ts`
- `tests/unit/grove-evolution.test.ts`
- `tests/unit/phase2-biomes.test.ts`

## Локальная документация и свидетельства проверки

- `docs/PROGRESS.md`
- `docs/DECISIONS.md`
- `docs/TEST_REPORT.md`
- `docs/grove-evolution/AUDIT.md`
- `docs/grove-evolution/REVIEW.md`
- `docs/grove-evolution/FILES.md`
- `docs/grove-evolution/phases-1280.json`, `phases-844.json`
- `docs/grove-evolution/combat-1280.json`, `combat-844.json`
- `docs/grove-evolution/CHECK.log`, `E2E-full.log`, `E2E-final.log`, `PRODUCTION.log`
- `docs/atmosphere/` and `docs/atmosphere-fast/`: lifecycle, stress, transition evidence
- `screenshots/grove-evolution/`: original Canvas captures and atlas proof
- `screenshots/atmosphere/`, `screenshots/atmosphere-fast/`: stress captures / transition videos

Зависимости и lockfile не менялись. Документация и скриншоты остаются локальными согласно существующему .gitignore.
