import { expect, test } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import type { World } from '../../src/game/systems/World';

test('causal stationary-build probes: control, knockback, fireball concentration, caster, Rusher and shield', async ({ page }) => {
  await page.goto('/?test=1');
  const result = await page.evaluate(async () => {
    const worldPath = '/src/game/systems/World.ts', fixturePath = '/tests/helpers/combatBalance.ts', upgradePath = '/src/game/systems/UpgradeSystem.ts';
    const { World: Constructor } = await import(worldPath), { strongMage } = await import(fixturePath), { applyUpgrade } = await import(upgradePath);
    return [640, 195].flatMap(width => ['normal', 'no-knockback', 'no-frost', 'single-fireball', 'no-caster-attacks', 'no-rusher-charges', 'no-shield'].map(probe => {
      const w: World = new Constructor(12345); strongMage(w); w.upgrades.pickup--; w.stats.pickup -= 20; applyUpgrade(w, 'evolve-fireball'); for (let i = 0; i < 3; i++) w.artifacts.grant(w, 'damage');
      w.elapsed = 600; w.width = width; w.height = width === 195 ? 422 : 360; w.bossScheduler.nextAt = w.guardianSystem.nextAt = 1e6;
      let hits = 0, blocked = 0, shots = 0;
      const damage = w.damagePlayer.bind(w), damageEnemy = w.damageEnemy.bind(w), shoot = w.shoot.bind(w), spawn = w.spawn.bind(w);
      w.damagePlayer = amount => { const hp = w.player.hp, shield = w.shield.charges, ok = damage(amount); if (hp > w.player.hp) hits++; if (shield > w.shield.charges) blocked++; return ok; };
      if (probe === 'no-knockback') w.damageEnemy = (e, amount, source) => { const at = { x: e.x, y: e.y }, killed = damageEnemy(e, amount, source); if (!killed) { e.x = at.x; e.y = at.y; } return killed; };
      if (probe === 'no-frost') w.abilities.frost.level = 0;
      if (probe === 'single-fireball') { w.stats.projectiles = 1; w.upgrades.damage = 0; }
      if (probe === 'no-shield') w.abilities.shield.level = 0;
      w.shoot = p => { if (p.hostile) { shots++; if (probe === 'no-caster-attacks') return; } shoot(p); };
      if (probe === 'no-rusher-charges') w.spawn = (kind, at, elite) => { const e = spawn(kind, at, elite); if (e?.kind === 'rusher') e.rush = undefined; return e; };
      for (let i = 0; i < 2400 && w.status !== 'over'; i++) {
        if (w.status === 'upgrade') { w.status = 'playing'; w.experience.pending = 0; w.choices = []; }
        w.step(.05);
      }
      return { width, probe, seconds: +(w.elapsed - 600).toFixed(2), hp: +w.player.hp.toFixed(2), hits, blocked, shots, kills: w.kills, damage: w.snapshot().damageByAbility };
    }));
  });
  expect(result).toHaveLength(14); mkdirSync('docs/combat-balance-2', { recursive: true });
  writeFileSync(`docs/combat-balance-2/${process.env.PIXEL_BALANCE_PHASE ?? 'after'}-diagnosis.json`, JSON.stringify({ fixture: 'Causal ablations in actual browser, fixed20Hz simulation, stationary enhanced Mage39, no test invulnerability. Deliberate single-system removals are diagnostic fixtures, not proposed nerfs.', result }, null, 2));
});
