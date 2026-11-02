import { expect, it } from 'vitest';
import { mkdirSync, writeFileSync } from 'node:fs';
import { survivalTrial, ttkTrial } from '../helpers/combatBalance';

it('measures fixed-build survival without test invulnerability and isolated sustained TTK', () => {
  const survival = [12345, 42, 2026].flatMap(seed => [false, true].map(moving => survivalTrial(seed, moving)));
  const enhanced = [640, 195].flatMap(width => [false, true].map(moving => survivalTrial(12345, moving, 600, 120, true, width, width === 195 ? 422 : 360)));
  expect(survival[0]).toEqual(survivalTrial(12345, false));
  for (const s of survival) { expect(s.peak).toBeLessThanOrEqual(150); expect(s.seconds).toBeGreaterThan(0); }
  const ttk = (['charger', 'sorcerer', 'eclipse', 'guardian'] as const).flatMap(kind => [false, true].map(strong => ttkTrial(kind, strong)));
  mkdirSync('docs/combat-balance-2', { recursive: true });
  writeFileSync(`docs/combat-balance-2/${process.env.PIXEL_BALANCE_PHASE ?? 'after'}.json`, JSON.stringify({ base: 'a089c62', fixture: 'Mage39; 38 legal upgrades; FireballV/FrostI/LightningIV/MeteorII/ShieldI; damageV/projectilesIII/CDRV/areaIII/speedIII/healthIV/pickupIII; no artifacts/explicit evolution cards (automatic Fireball capstone active). Enhanced: replace pickupIII with pickupII + Fireball evolution, 3 damage artifacts. Survival: 10-12min regular waves, empty initial field, real HP/loot/CDR, frozen upgrade choices, continuous circular pilot with Blink versus stationary. TTK: isolated target65px, incoming damage disabled, 600s ceiling; not survival evidence.', survival, enhanced, ttk }, null, 2));
}, 60000);
