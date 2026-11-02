import { expect, it } from 'vitest';
import { SKILL_CARD_COLORS, upgradeIdentity } from '../../src/ui/upgradeIdentity';
import { World } from '../../src/game/systems/World';
import { chooseUpgrades, eligibleUpgrades } from '../../src/game/systems/UpgradeSystem';

it('uses the exact Mage palette and the five distinct Warrior material colors for all skill card kinds', () => {
  expect(Object.values(SKILL_CARD_COLORS).slice(0, 5)).toEqual(['#F05252', '#D9F3F7', '#458FFF', '#F59E46', '#B58CFA']);
  expect(new Set(Object.values(SKILL_CARD_COLORS)).size).toBe(10);
  for (const [skill, color] of Object.entries(SKILL_CARD_COLORS)) for (const prefix of ['rank', 'unlock', 'evolve']) {
    expect(upgradeIdentity(`${prefix}-${skill}`)).toEqual({ family: skill, color });
  }
});
it('keeps general stats/supplies neutral and all mobility paths in a separate family', () => {
  for (const id of ['damage', 'cooldown', 'health', 'speed', 'projectiles', 'area', 'pickup', 'restore', 'nova', 'magnet']) expect(upgradeIdentity(id).family).toBe('general');
  for (const id of ['shockwave', 'frost-blink', 'arcane-sprint', 'impact-dash', 'iron-charge', 'battle-momentum']) expect(upgradeIdentity(`mobility-${id}`)).toEqual({ family: 'mobility', color: '#9BCBC5' });
});
it('presentation leaves seeded three-choice offers, eligibility and all gameplay state unchanged', () => {
  for (const character of ['mage', 'warrior'] as const) for (const seed of [1, 7, 12345]) {
    const a = new World(seed, { character }), b = new World(seed, { character });
    const before = JSON.stringify(a);
    for (const choice of eligibleUpgrades(a)) upgradeIdentity(choice.id);
    expect(JSON.stringify(a)).toBe(before);
    for (let i = 0; i < 30; i++) {
      const left = chooseUpgrades(a).map(u => u.id), right = chooseUpgrades(b).map(u => u.id);
      expect(left).toEqual(right); expect(new Set(left).size).toBe(3);
    }
  }
});
