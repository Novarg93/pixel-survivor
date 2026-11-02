import { expect, it } from 'vitest';
import { mkdirSync, writeFileSync } from 'node:fs';
import { World } from '../../src/game/systems/World';
import { meteor } from '../../src/game/abilities/meteor';

it('measures Meteor damage in identical seeded one/three-group scenarios', () => {
  const rows = [];
  for (const groups of [1, 3]) for (const rank of [1, 2, 3, 4, 5]) for (const seed of [7, 31, 12345]) {
    const w = new World(seed, { spawnRate: 0 }); w.encounterDirector.nextAt = 1e6;
    for (const a of Object.values(w.abilities)) a.level = 0;
    w.abilities.meteor.level = rank; w.abilities.meteor.readyAt = 1e6;
    w.stats.damage = 1.5; w.artifacts.grant(w, 'damage'); w.player.x = -40;
    const positions = groups === 1 ? [{ x: 140, y: 0 }] : [{ x: -190, y: -95 }, { x: 130, y: -95 }, { x: 0, y: 135 }];
    for (const center of positions) for (let i = 0; i < 5; i++) { const e = w.spawn('tank', { x: center.x + (i % 3) * 6, y: center.y + Math.floor(i / 3) * 6 })!; e.hp = e.maxHp = 1e6; e.speed = 0; }
    const hp = w.enemies.reduce((n, e) => n + e.hp, 0); expect(meteor(w)).toBe(true);
    const impacts = w.impacts.map(i => ({ x: i.x, y: i.y, damage: i.damage, landAt: i.landAt }));
    for (let i = 0; i < 30; i++) w.step(.05);
    rows.push({ groups, rank, seed, impacts, damage: +(hp - w.enemies.reduce((n, e) => n + e.hp, 0)).toFixed(6), statsDamage: 1.5, artifactDamage: 1.08 });
    expect(w.impacts).toHaveLength(0);
  }
  mkdirSync('.tmp/frost-armageddon', { recursive: true });
  writeFileSync(`.tmp/frost-armageddon/${process.env.PIXEL_MAGE_PHASE ?? 'after'}-damage.json`, JSON.stringify({ fixture: 'Single cast; same seeded static durable tanks, five targets/group; one/three separated visible groups, ranksI-V, statsDamage1.5+one damage artifact1.08; no evolutions or incoming damage suppression, no survival claim.', rows }, null, 2));
});
