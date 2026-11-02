import { expect, it } from 'vitest';
import { World } from '../../src/game/systems/World';
import { updateBoss } from '../../src/game/systems/BossSystem';
it('central director assigns the first boss at3min and the second at5min', () => {
  const w=new World();w.elapsed=179.99;w.encounterDirector.update(w);expect(w.bosses).toHaveLength(0);
  w.elapsed=180;w.encounterDirector.update(w);expect(w.bosses[0].kind).toBe('charger');
  w.elapsed=300;w.encounterDirector.update(w);expect(w.bosses.map(e=>e.kind)).toEqual(['charger','sorcerer']);
});
it('allows three bosses separately from 150 regular mobs', () => { const w = new World(); w.elapsed = 1300; for (let i = 0; i < 150; i++) w.spawn('grunt'); for (let i = 0; i < 5; i++) w.spawn('charger'); expect(w.bosses).toHaveLength(3); expect(w.enemies).toHaveLength(153); });
it('charge locks at the end of preparation and retains the recovery vulnerability', () => {
  const w = new World(), e = w.spawn('charger', { x: 200, y: 0 })!;
  w.elapsed = 2; updateBoss(w, e, .01); expect(e.boss!.phase).toBe('windup');
  w.player.y = 100; w.elapsed = 2.5; updateBoss(w, e, .01); expect(e.boss!.phase).toBe('charge');
  const dir = { ...e.boss!.direction }; w.player.y = -100; w.elapsed += .1; updateBoss(w, e, .1);
  expect(e.boss!.direction).toEqual(dir); expect(e.y).toBeGreaterThan(0);
  w.elapsed = e.boss!.until; updateBoss(w, e, 1.2); expect(e.boss!.phase).toBe('recover');
  const hp = e.hp; w.damageEnemy(e, 100); expect(hp - e.hp).toBe(125);
});
it('rune caster telegraphs dodgeable floor attacks then fires volley', () => { const w = new World(); const e = w.spawn('sorcerer', { x: 200, y: 0 })!; w.elapsed = 2; updateBoss(w, e, 0.01); expect(w.impacts).toHaveLength(3); expect(w.impacts.every(i => i.landAt >= w.elapsed + 1)).toBe(true); w.elapsed = 3.2; updateBoss(w, e, 0.01); expect(w.projectiles).toHaveLength(5); expect(e.boss!.phase).toBe('recover'); });
it('cleans owned danger on boss death and awards exactly 1000 once', () => { const w = new World(); const e = w.spawn('sorcerer', { x: 200, y: 0 })!; w.elapsed = 2; updateBoss(w, e, 0.01); expect(w.impacts.length).toBeGreaterThan(0); w.damageEnemy(e, 99999); w.damageEnemy(e, 99999); expect(w.score).toBe(1000); expect(w.kills).toBe(1); expect(w.impacts).toHaveLength(0); expect(w.bosses).toHaveLength(0); });
it('cannot hit with a dead boss projectile later in the same update', () => { const w = new World(); w.abilities.fireball.level = 0; const boss = w.spawn('sorcerer', { x: 200, y: 0 })!; w.shoot({ x: 170, y: 0, vx: 1000, vy: 0, damage: 99999, hostile: false }); w.shoot({ x: -10, y: 0, vx: 200, vy: 0, damage: 22, hostile: true, ownerId: boss.id }); w.step(0.05); expect(w.kills).toBe(1); expect(w.player.hp).toBe(100); expect(w.projectiles.some(p => p.ownerId === boss.id)).toBe(false); });
it.each(['charger', 'sorcerer'] as const)('a developed build dodges and beats %s using real abilities', kind => {
  const w = new World(98); for (const a of Object.values(w.abilities)) a.level = 5; w.stats.projectiles = 4; w.stats.damage = 2.25; w.stats.cooldown = 0.7;
  const boss = w.spawn(kind, { x: 140, y: 0 })!;
  for (let i = 0; i < 1200 && w.enemies.includes(boss) && w.status !== 'over'; i++) {
    while (w.status === 'upgrade') w.selectUpgrade(w.choices[0].id);
    const angle = w.elapsed * 0.9; w.step(0.05, { x: boss.x + Math.cos(angle) * 115 - w.player.x, y: boss.y + Math.sin(angle) * 115 - w.player.y });
  }
  expect(w.snapshot().killsByKind[kind]).toBe(1); expect(w.player.hp).toBeGreaterThan(0);
});
