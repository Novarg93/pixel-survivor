import { expect, it } from 'vitest';
import { UPGRADES, SUPPLIES, applyUpgrade } from '../../src/game/systems/UpgradeSystem';
import { upgradeCard } from '../../src/ui/upgradeCards';
import { EMBLEMS } from '../../src/ui/upgradeEmblems';
import { World } from '../../src/game/systems/World';
import { fireball } from '../../src/game/abilities/fireball';

it('owns additional projectiles by actual Fireball effect and does not mislabel global damage/area/CDR', () => {
  const w = new World(7, { spawnRate: 0 }); w.spawn('tank', { x: 100, y: 0 }); fireball(w);
  expect(w.projectiles).toHaveLength(1); w.projectiles = [];
  applyUpgrade(w, 'projectiles'); fireball(w); expect(w.projectiles).toHaveLength(2);
  expect(w.projectiles.every(p => p.source === 'fireball')).toBe(true);
  expect(upgradeCard({ id: 'projectiles', tier: 1, description: '' })).toMatchObject({ family: 'fireball', icon: 'projectiles', value: '+1', color: '#F05252' });
  for (const id of ['damage', 'cooldown', 'area', 'health', 'speed', 'pickup']) expect(upgradeCard({ id, tier: 1, description: '' }).family).toBe('general');
});
it('covers every actual upgrade and supply with an original emblem and meaningful bonus', () => {
  for (const upgrade of [...UPGRADES, ...SUPPLIES]) {
    const card = upgradeCard({ ...upgrade, tier: 1 });
    expect(card.icon, upgrade.id).not.toBe('rune'); expect(EMBLEMS[card.icon]).toHaveLength(2);
    expect(card.value, upgrade.id).not.toBe('Усиление'); expect(card.summary.length).toBeGreaterThan(0);
  }
  expect(upgradeCard({ id: 'rank-unknown', tier: 1, description: 'Future' })).toMatchObject({ family: 'general', icon: 'rune' });
});
it('reads ranked control/meteor and Blink bonuses from existing balance data without changing World', () => {
  expect(upgradeCard({ id: 'rank-frost', tier: 4, description: '' }).value).toBe('1.7с');
  expect(upgradeCard({ id: 'rank-meteor', tier: 5, description: '' }).value).toBe('3 удара');
  expect(upgradeCard({ id: 'mobility-arcane-sprint', tier: 3, description: '' }).value).toBe('+40%');
  expect(upgradeCard({ id: 'mobility-flame-trail', tier: 2, description: '' }).value).toBe('18');
  const w = new World(), before = JSON.stringify(w);
  for (const u of UPGRADES) upgradeCard({ ...u, tier: 3 });
  expect(JSON.stringify(w)).toBe(before);
});
it.each([1, 2, 3])('shows the Berserk rank%i sprint bonus and refresh rule in the upgrade card', tier => {
  const card = upgradeCard({ id: 'mobility-berserk', tier, description: '' });
  expect(card.summary).toContain(`скорость движения +${[30, 35, 40][tier - 1]}%`);
  expect(card.summary).toContain('На 2с'); expect(card.summary).toContain('без накопления');
});
