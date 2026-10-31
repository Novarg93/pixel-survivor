import { describe, expect, it } from 'vitest';
import { World } from '../../src/game/systems/World';
import { ExperienceSystem, xpThreshold } from '../../src/game/systems/ExperienceSystem';
import { UPGRADES, chooseUpgrades, applyUpgrade } from '../../src/game/systems/UpgradeSystem';
describe('experience and upgrades', () => {
  it('increases thresholds and carries excess across levels', () => { const xp = new ExperienceSystem(); xp.gain(45); expect(xpThreshold(1)).toBe(20); expect(xpThreshold(2)).toBe(23); expect(xp.level).toBe(3); expect(xp.xp).toBe(2); expect(xp.pending).toBe(2); });
  it('produces three unique deterministic eligible choices', () => { const a = new World(5), b = new World(5); expect(chooseUpgrades(a).map(u => u.id)).toEqual(chooseUpgrades(b).map(u => u.id)); expect(new Set(chooseUpgrades(a).map(u => u.id)).size).toBe(3); });
  it('excludes capped upgrades and has three real supplies at cap', () => { const w = new World(); for (const u of UPGRADES) w.upgrades[u.id] = u.max; expect(new Set(chooseUpgrades(w).map(u => u.id))).toEqual(new Set(['restore', 'nova', 'magnet'])); expect(applyUpgrade(w, 'damage')).toBe(false); });
  it('queues levels and rejects unoffered and duplicate selections', () => { const w = new World(); w.gainXp(45); expect(w.status).toBe('upgrade'); const t = w.elapsed; w.step(0.05, { x: 1, y: 0 }); expect(w.elapsed).toBe(t); expect(w.player.x).toBe(0); expect(w.selectUpgrade('invalid')).toBe(false); const first = w.choices[0].id; expect(w.selectUpgrade(first)).toBe(true); expect(w.status).toBe('upgrade'); expect(w.selectUpgrade(w.choices[0].id)).toBe(true); expect(w.status).toBe('playing'); expect(w.selectUpgrade(first)).toBe(false); });
  it('drops and collects pooled XP on real kills', () => { const w = new World(); const e = w.spawn('grunt', { x: 0, y: 0 })!; w.damageEnemy(e, 99); expect(w.orbs).toHaveLength(1); w.step(0.01); expect(w.orbs).toHaveLength(0); expect(w.experience.xp).toBe(5); });
  it('bounds orbs without losing newly dropped XP when full', () => { const w = new World(); for (let i = 0; i < 300; i++) w.dropXp({ x: 100, y: 100 }, 5); expect(w.orbs).toHaveLength(240); expect(w.orbs.reduce((n, o) => n + o.value, 0)).toBe(1500); });
});
