import { expect, it } from 'vitest';
import { mkdirSync, writeFileSync } from 'node:fs';
import { World } from '../../src/game/systems/World';
import { applyUpgrade } from '../../src/game/systems/UpgradeSystem';
import { strongMage } from '../helpers/combatBalance';

it('benchmarks boss TTK for two legal level39 builds at near and medium range', () => {
  const result = [];
  for (const kind of ['charger', 'sorcerer', 'eclipse', 'guardian'] as const) for (const strong of [false, true]) for (const range of [65, 180]) {
    const w = new World(12345, { spawnRate: 0 });
    if (strong) strongMage(w);
    else {
      // 38 real choices, invested mainly in defense, collection and area.
      const choices: Record<string, number> = { 'unlock-frost': 1, 'rank-frost': 4, 'unlock-lightning': 1, 'unlock-meteor': 1, 'rank-meteor': 2, 'unlock-shield': 1, 'rank-shield': 4, damage: 1, cooldown: 5, area: 4, speed: 4, health: 5, pickup: 5 };
      for (const [id, count] of Object.entries(choices)) for (let i = 0; i < count; i++) expect(applyUpgrade(w, id)).toBe(true);
      expect(Object.values(w.upgrades).reduce((a, b) => a + b, 0)).toBe(38); w.experience.level = 39;
    }
    w.elapsed = 600; w.encounterDirector.nextAt = 1e6;
    const e = w.spawn(kind, { x: range, y: 0 })!, hp = e.hp;
    // Isolated sustained-DPS measurement only, explicitly not survival evidence.
    w.damagePlayer = () => false;
    for (let i = 0; i < 12000 && w.enemies.includes(e); i++) { e.x = w.player.x + range; e.y = w.player.y; w.step(.05); }
    result.push({ kind, strong, range, hp, seconds: +(w.elapsed - 600).toFixed(2), killed: e.hp === 0 });
    expect(e.hp).toBe(0);
  }
  mkdirSync('.tmp/combat-balance-2', { recursive: true });
  writeFileSync(`.tmp/combat-balance-2/${process.env.PIXEL_BALANCE_PHASE ?? 'after'}-ttk.json`, JSON.stringify({ fixture: 'Both builds have38 legal choices, level39. Strong: FireballV/FrostI/LightningIV/MeteorII/ShieldI, damageV/CDRV/projectilesIII/areaIII/speedIII/healthIV/pickupIII. Defensive: FireballI/FrostV/LightningI/MeteorIII/ShieldV, damageI/CDRV/areaIV/speedIV/healthV/pickupV. No artifacts. Targets held at65/180px, incoming damage disabled only for this DPS benchmark; no evasion or target competition.', result }, null, 2));
});
