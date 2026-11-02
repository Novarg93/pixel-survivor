import { World } from '../../src/game/systems/World';
import type { EnemyKind } from '../../src/game/config/enemyDefinitions';
import { applyUpgrade } from '../../src/game/systems/UpgradeSystem';

// 38 legal choices, no assumed artifacts/evolutions. The user's passive ranks are unknown.
export function strongMage(w: World) {
  const choices: Record<string, number> = { 'rank-fireball': 4, 'unlock-frost': 1, 'unlock-lightning': 1, 'rank-lightning': 3, 'unlock-meteor': 1, 'rank-meteor': 1, 'unlock-shield': 1, damage: 5, projectiles: 3, cooldown: 5, area: 3, speed: 3, health: 4, pickup: 3 };
  for (const [id, count] of Object.entries(choices)) for (let i = 0; i < count; i++) if (!applyUpgrade(w, id)) throw new Error(`Invalid fixture upgrade ${id}`);
  w.experience.level = 39;
}

export function survivalTrial(seed: number, moving: boolean, start = 600, duration = 120, enhanced = false, width = 640, height = 360) {
  const w = new World(seed); strongMage(w); w.elapsed = start;
  w.width = width; w.height = height;
  if (enhanced) { w.upgrades.pickup--; w.stats.pickup -= 20; applyUpgrade(w, 'evolve-fireball'); for (let i = 0; i < 3; i++) w.artifacts.grant(w, 'damage'); }
  // Isolate regular-wave pressure. Boss/Guardian TTK and evasion are separate trials.
  w.encounterDirector.nextAt = 1e6;
  let hits = 0, blocked = 0, attempts = 0, shots = 0, rushes = 0, peak = 0;
  const damage = w.damagePlayer.bind(w), shoot = w.shoot.bind(w), rushing = new Set<number>();
  w.damagePlayer = amount => { attempts++; const hp = w.player.hp, charges = w.shield.charges, result = damage(amount); if (w.player.hp < hp) hits++; if (charges > w.shield.charges) blocked++; return result; };
  w.shoot = shot => { if (shot.hostile) shots++; shoot(shot); };
  for (let tick = 0; tick < duration * 20 && w.status !== 'over'; tick++) {
    // Hold the fixed level-39 loadout while still processing real XP, loot and shields.
    if (w.status === 'upgrade') { w.experience.pending = 0; w.choices = []; w.status = 'playing'; }
    const input = moving ? { x: Math.cos((w.elapsed - start) * .12), y: Math.sin((w.elapsed - start) * .12) } : { x: 0, y: 0 };
    if (moving) w.mobility.activate(w, input);
    w.step(.05, input); peak = Math.max(peak, w.regularCount);
    for (const e of w.enemies) if (e.rush?.phase === 'windup' && !rushing.has(e.id)) { rushing.add(e.id); rushes++; }
  }
  return { seed, moving, start, enhanced, width, height, survived: w.status !== 'over', seconds: +(w.elapsed - start).toFixed(2), hp: +w.player.hp.toFixed(2), hits, blocked, attempts, shots, rushersAttacked: rushes, peak, kills: w.kills, score: w.score, scorePerMinute: +(w.score * 60 / (w.elapsed - start)).toFixed(1), mobilityUses: w.mobility.sequence, damage: w.snapshot().damageByAbility };
}

// Isolated sustained-DPS target, not a survival test. Disable incoming damage here only.
export function ttkTrial(kind: EnemyKind, strong: boolean) {
  const w = new World(12345, { spawnRate: 0 });
  if (strong) strongMage(w);
  else { applyUpgrade(w, 'unlock-frost'); applyUpgrade(w, 'unlock-lightning'); applyUpgrade(w, 'damage'); }
  w.elapsed = 600; w.encounterDirector.nextAt = 1e6;
  const e = w.spawn(kind, { x: 65, y: 0 })!, hp = e.hp;
  w.damagePlayer = () => false;
  for (let i = 0; i < 12000 && w.enemies.includes(e); i++) {
    e.x = w.player.x + 65; e.y = w.player.y;
    w.step(.05);
  }
  return { kind, strong, hp, seconds: +(w.elapsed - 600).toFixed(2), killed: !w.enemies.includes(e) && e.hp === 0 };
}
