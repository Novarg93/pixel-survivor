import { expect, test } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';

const directory = 'screenshots/frost-armageddon';
for (const width of [1280, 390]) test(`Nova/Armageddon names, ranked descriptions and existing card selection at${width}`, async ({ page }) => {
  mkdirSync(directory, { recursive: true }); await page.setViewportSize({ width, height: width === 390 ? 844 : 720 });
  await page.goto('/?test=1'); await page.getByRole('button', { name: 'Начать забег' }).click();
  await page.evaluate(async () => {
    const w = window.__PIXEL__!.world, module = '/src/game/systems/UpgradeSystem.ts', { eligibleUpgrades } = await import(module);
    w.options.spawnRate = 0; w.encounterDirector.nextAt = 1e6; w.abilities.frost.level = w.abilities.meteor.level = 2;
    w.gainXp(w.snapshot().xpNext); const pool = eligibleUpgrades(w); w.choices = ['rank-frost', 'rank-meteor', 'area'].map(id => pool.find((c: { id: string }) => c.id === id));
  });
  await expect(page.locator('.choice')).toHaveCount(3); await expect(page.locator('[data-upgrade="rank-frost"]')).toContainText('Морозная нова');
  await expect(page.locator('[data-upgrade="rank-frost"]')).toContainText('cooldown −15%'); await expect(page.locator('[data-upgrade="rank-meteor"]')).toContainText('Армагеддон');
  await expect(page.locator('[data-upgrade="rank-meteor"]')).toContainText('75%');
  expect(await page.locator('[data-upgrade="rank-frost"]').evaluate(e => getComputedStyle(e).getPropertyValue('--skill-color').trim())).toBe('#D9F3F7');
  expect(await page.locator('[data-upgrade="rank-meteor"]').evaluate(e => getComputedStyle(e).getPropertyValue('--skill-color').trim())).toBe('#F59E46');
  await page.screenshot({ path: `${directory}/cards-${width}.png` }); await page.keyboard.press('1');
  await expect(page.getByRole('dialog', { name: 'Новый уровень' })).toHaveCount(0);
  expect(await page.evaluate(() => window.__PIXEL__!.world.abilities.frost.level)).toBe(3);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
});
for (const width of [1280, 390]) for (const rank of [1, 3, 5]) test(`remote Frost Nova and sequential Armageddon rank${rank} at${width}`, async ({ page }) => {
  test.setTimeout(50000); mkdirSync(directory, { recursive: true }); const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await page.setViewportSize({ width, height: width === 390 ? 844 : 720 }); await page.goto('/?test=1'); await page.getByRole('button', { name: 'Начать забег' }).click();
  const nova = await page.evaluate(rank => {
    const w = window.__PIXEL__!.world; w.options.spawnRate = 0; w.encounterDirector.nextAt = 1e6; w.elapsed = 20;
    for (const a of Object.values(w.abilities)) a.level = 0;
    w.abilities.frost.level = rank; w.abilities.frost.readyAt = 0;
    const center = w.width < 300 ? { x: 20, y: 135 } : { x: 150, y: 25 };
    const ids = [];
    for (let i = 0; i < 4; i++) { const e = w.spawn(i === 3 ? 'caster' : 'tank', { x: center.x + i * 3, y: center.y + i % 2 * 3 })!; e.hp = e.maxHp = 10000; e.speed = 25; e.shootAt = w.elapsed; ids.push(e.id); }
    return { center, ids };
  }, rank);
  await page.waitForFunction(() => window.__PIXEL__!.world.effects.some(e => e.kind === 'frost'));
  const started = await page.evaluate(() => { const w = window.__PIXEL__!.world, effect = w.effects.find(e => e.kind === 'frost')!; return { time: effect.started, x: effect.x, y: effect.y, radius: effect.radius, expires: effect.expires, readyAt: w.abilities.frost.readyAt }; });
  expect(Math.hypot(started.x, started.y)).toBeGreaterThan(started.radius);
  expect(started.expires - started.time).toBeCloseTo(rank === 5 ? 2 : 1.2);
  expect(started.readyAt - started.time).toBeCloseTo(rank >= 3 ? 2.38 : 2.8);
  await page.waitForFunction(start => window.__PIXEL__!.world.elapsed >= start + .3, started.time);
  await page.evaluate(() => window.__PIXEL__!.world.pause());
  const frozen = await page.evaluate(() => { const w = window.__PIXEL__!.world; return { elapsed: w.elapsed, enemies: w.enemies.map(e => ({ id: e.id, x: e.x, y: e.y, until: e.freezeUntil })), clock: window.__PIXEL__!.art().clock }; });
  expect(frozen.enemies.every(e => e.until! > frozen.elapsed)).toBe(true); expect(frozen.clock).toEqual([0, 0, 0]);
  await page.addStyleTag({ content: '.overlay{display:none!important}' }); await page.waitForTimeout(80);
  await page.screenshot({ path: `${directory}/frost-rank${rank}-${width}.png` }); await page.locator('canvas').screenshot({ path: `${directory}/frost-canvas-rank${rank}-${width}.png` });
  await page.waitForTimeout(120); expect(await page.evaluate(() => window.__PIXEL__!.world.elapsed)).toBe(frozen.elapsed);
  await page.evaluate(() => window.__PIXEL__!.world.resume());
  await page.waitForFunction(() => window.__PIXEL__!.world.projectiles.some(p => p.hostile));
  const shooting = await page.evaluate(() => { const w = window.__PIXEL__!.world; return { at: w.elapsed, caster: w.enemies.find(e => e.kind === 'caster')!.freezeUntil }; });
  expect(shooting.at).toBeLessThan(shooting.caster!);
  await page.waitForFunction(end => window.__PIXEL__!.world.elapsed > end + .1, started.expires);
  await page.evaluate(() => window.__PIXEL__!.world.pause()); await page.waitForTimeout(60);
  const expired = await page.evaluate(() => { const w = window.__PIXEL__!.world; return { effects: w.effects.filter(e => e.kind === 'frost').length, enemies: w.enemies.map(e => ({ id: e.id, x: e.x, y: e.y })) }; });
  expect(expired.effects).toBe(0); expect(expired.enemies.some(e => Math.hypot(e.x - frozen.enemies.find(p => p.id === e.id)!.x, e.y - frozen.enemies.find(p => p.id === e.id)!.y) > .1)).toBe(true);
  await page.locator('canvas').screenshot({ path: `${directory}/frost-expired-rank${rank}-${width}.png` });

  const old = await page.evaluateHandle(() => window.__PIXEL__!.world);
  await page.evaluate(() => window.__PIXEL__!.restartScene()); await page.getByRole('button', { name: 'Начать забег' }).click();
  expect(await old.evaluate(w => [w.impacts.length, w.effects.filter(e => e.kind === 'frost').length, w.enemies.some(e => (e.freezeUntil ?? 0) > w.elapsed)])).toEqual([0, 0, false]);
  const state = await page.evaluateHandle(rank => {
    const w = window.__PIXEL__!.world; w.options.spawnRate = 0; w.encounterDirector.nextAt = 1e6; w.elapsed = 20;
    for (const a of Object.values(w.abilities)) a.level = 0;
    w.abilities.frost.level = 5; w.abilities.frost.readyAt = 0; w.abilities.meteor.level = rank; w.abilities.meteor.readyAt = w.elapsed + .2;
    const centers = w.width < 300 ? [{ x: -25, y: -145 }, { x: 25, y: 0 }, { x: -25, y: 145 }] : [{ x: -170, y: -80 }, { x: 165, y: -80 }, { x: 0, y: 140 }];
    for (const c of centers) for (let i = 0; i < 3; i++) { const e = w.spawn('tank', { x: c.x + i * 3, y: c.y + i % 2 * 3 })!; e.hp = e.maxHp = 10000; e.speed = 0; }
    const state = { landings: [] as number[], hits: [] as { id: number; damage: number; at: number }[] };
    const effect = w.effect.bind(w), damage = w.damageEnemy.bind(w);
    w.effect = (...args) => { if (args[0] === 'meteor') state.landings.push(w.elapsed); return effect(...args); };
    w.damageEnemy = (...args) => { const before = args[0].hp, result = damage(...args); if (args[2] === 'meteor') state.hits.push({ id: args[0].id, damage: before - args[0].hp, at: w.elapsed }); return result; };
    return state;
  }, rank);
  const count = rank === 5 ? 3 : rank === 3 ? 2 : 1;
  await page.waitForFunction(() => window.__PIXEL__!.world.impacts.some(i => i.source === 'meteor'));
  const planned = await page.evaluate(() => { const w = window.__PIXEL__!.world; return { impacts: w.impacts.filter(i => i.source === 'meteor').map(i => ({ x: i.x, y: i.y, launchAt: i.launchAt!, landAt: i.landAt, damage: i.damage })), roots: w.enemies.filter(e => (e.freezeUntil ?? 0) > w.elapsed).map(e => ({ x: e.x, y: e.y })), frostReady: w.abilities.frost.readyAt, meteorReady: w.abilities.meteor.readyAt }; });
  expect(planned.impacts).toHaveLength(count); expect(planned.frostReady).not.toBe(planned.meteorReady);
  expect(planned.roots.some(e => Math.hypot(e.x - planned.impacts[0].x, e.y - planned.impacts[0].y) < 20)).toBe(true);
  planned.impacts.forEach((i, n) => { expect(i.landAt - planned.impacts[0].landAt).toBeCloseTo(n * .15); expect(i.damage).toBe((55 + rank * 25) * (n ? .75 : 1)); });
  await page.waitForFunction(at => window.__PIXEL__!.world.elapsed >= at + .4, planned.impacts[0].launchAt);
  await page.evaluate(() => window.__PIXEL__!.world.pause()); await page.waitForTimeout(80);
  await page.screenshot({ path: `${directory}/meteor-rank${rank}-${width}.png` }); await page.locator('canvas').screenshot({ path: `${directory}/meteor-canvas-rank${rank}-${width}.png` });
  const clock = await page.evaluate(() => window.__PIXEL__!.world.elapsed); await page.waitForTimeout(100); expect(await page.evaluate(() => window.__PIXEL__!.world.elapsed)).toBe(clock);
  await page.evaluate(() => window.__PIXEL__!.world.resume());
  await page.waitForFunction(() => !window.__PIXEL__!.world.impacts.some(i => i.source === 'meteor'));
  await page.evaluate(() => window.__PIXEL__!.world.pause()); await page.waitForTimeout(50);
  const landed = await state.evaluate(s => ({ ...s }));
  expect(landed.hits).toHaveLength(3 * count); expect(landed.hits.reduce((n, h) => n + h.damage, 0)).toBeCloseTo(3 * (55 + rank * 25) * (1 + .75 * (count - 1)));
  for (let i = 1; i < count; i++) expect(landed.landings[i] - landed.landings[i - 1]).toBeCloseTo(.15, 1);
  await page.locator('canvas').screenshot({ path: `${directory}/meteor-impact-rank${rank}-${width}.png` });
  const layers = await page.evaluate(() => window.__PIXEL__!.art().layers); expect(layers.find(l => l.name === 'hostile-tells')!.depth).toBeGreaterThan(layers.find(l => l.name === 'friendly-feedback')!.depth);
  await page.evaluate(() => { const w = window.__PIXEL__!.world; w.resume(); w.damagePlayer(1e6); });
  expect(await page.evaluate(() => { const w = window.__PIXEL__!.world; return [w.status, w.impacts.length, w.effects.filter(e => e.kind === 'frost').length, w.effects.filter(e => e.kind === 'meteor').length]; })).toEqual(['over', 0, 0, 0]);
  expect(errors).toEqual([]); writeFileSync(`${directory}/rank${rank}-${width}.json`, JSON.stringify({ nova, started, frozen, shooting, expired, planned, landed, layers, errors }, null, 2));
});

for (const width of [1280, 390]) test(`Nova/Armageddon bounded150+3+3 stress and scene teardown at${width}`, async ({ page }) => {
  test.setTimeout(55000); mkdirSync(directory, { recursive: true }); const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await page.setViewportSize({ width, height: width === 390 ? 844 : 720 }); await page.goto('/?test=1'); await page.getByRole('button', { name: 'Начать забег' }).click();
  await page.evaluate(() => {
    const w = window.__PIXEL__!.world; w.options.spawnRate = 0; w.elapsed = 720; w.encounterDirector.nextAt = 720; w.encounterDirector.update(w); w.encounterDirector.nextAt = 1e6;
    // Constant load: populate all three boss families independently of the new30s schedule.
    for(const kind of ['charger','sorcerer','eclipse'] as const)if(!w.bosses.some(e=>e.kind===kind))w.spawn(kind);
    // Hold the specified benchmark load even if random safe placement skipped a slot.
    for(let i=w.guardians.length;i<3;i++)w.spawn('guardian',{x:-30,y:(i-1)*155});
    w.experience.level = 39; w.player.invulnerableUntil = 1e6; // Constant performance load only.
    for (const def of w.abilityDefinitions) w.abilities[def.id].level = 5;
    w.upgrades['evolve-frost'] = w.upgrades['evolve-meteor'] = 1; w.stats.cooldown = .35;
    for (let i = 0; i < 150; i++) w.spawn((['tank', 'caster', 'rusher', 'runner', 'grunt', 'splitter'] as const)[i % 6], { x: (i % 15 - 7) * 18, y: (Math.floor(i / 15) - 4) * 22 });
    for (const e of w.enemies) e.hp = e.maxHp = 1e6;
    w.guardians.forEach((g, i) => { g.x = i === 1 ? 80 : -30; g.y = (i - 1) * 155; g.discovered = true; w.damageEnemy(g, 1); });
      w.guardianSystem.finalizePlacement(w,w.guardians.map(g=>g.id));
  });
  const samples = [];
  for (let i = 0; i < 12; i++) {
    const key = ['d', 's', 'a', 'w'][i % 4]; await page.keyboard.down(key); await page.waitForTimeout(1000); await page.keyboard.up(key);
    const sample = await page.evaluate(() => { const w = window.__PIXEL__!.world; return { ...window.__PIXEL__!.metrics(), hazards: w.impacts.length + w.zones.length, roots: w.enemies.filter(e => (e.freezeUntil ?? 0) > w.elapsed).length, meteorImpacts: w.impacts.filter(p => p.source === 'meteor').length, states: w.guardianSystem.encounters.size, clock: window.__PIXEL__!.art().clock, allocated: w.allocations }; });
    expect(sample.enemies).toBe(150); expect(sample.bosses).toBe(3); expect(sample.guardians).toBe(3); expect(sample.states).toBe(3); expect(sample.hazards).toBeLessThanOrEqual(24); expect(sample.effects).toBeLessThanOrEqual(96); expect(sample.projectiles).toBeLessThanOrEqual(96); expect(sample.allocated.effects).toBeLessThanOrEqual(96); expect(sample.clock).toEqual([0, 0, 0]); samples.push(sample);
  }
  expect(samples.some(s => s.roots > 0)).toBe(true); expect(samples.some(s => s.meteorImpacts > 0)).toBe(true);
  await page.screenshot({ path: `${directory}/stress-${width}.png` }); await page.locator('canvas').screenshot({ path: `${directory}/stress-canvas-${width}.png` });
  const old = await page.evaluateHandle(() => window.__PIXEL__!.world), cycles = [];
  for (let i = 0; i < 5; i++) { await page.evaluate(() => window.__PIXEL__!.restartScene()); await page.getByRole('button', { name: 'Начать забег' }).click(); await page.waitForFunction(() => window.__PIXEL__!.world.elapsed > .1); const art = await page.evaluate(() => window.__PIXEL__!.art()); expect(await page.evaluate(() => window.__PIXEL__!.listeners())).toEqual({ commands: 1, snapshots: 1, metrics: 1 }); expect(art.clock).toEqual([0, 0, 0]); expect(art.playerHealth.objects).toBe(1); cycles.push({ objects: art.objects, textures: art.textures.filter(t => !t.startsWith('chunk-')) }); }
  expect(cycles.at(-1)).toEqual(cycles[0]); expect(await old.evaluate(w => [w.impacts.length, w.zones.length, w.effects.filter(e => e.kind === 'frost' || e.kind === 'meteor').length, w.enemies.some(e => (e.freezeUntil ?? 0) > w.elapsed)])).toEqual([0, 0, 0, false]); expect(errors).toEqual([]);
  const fps = samples.slice(2).map(s => s.fps).sort((a, b) => a - b), ms = samples.slice(2).map(s => s.updateMs).sort((a, b) => a - b);
  writeFileSync(`${directory}/stress-${width}.json`, JSON.stringify({ fixture: '12s real RAF,150regular+3boss+3activeGuardian,allMageV+Frost/Meteor evolutions,globalCDRfloor; invulnerability only for constant load.', medianFps: fps[Math.floor(fps.length / 2)], p95UpdateMs: ms.at(-1), samples, cycles, errors }, null, 2));
});
