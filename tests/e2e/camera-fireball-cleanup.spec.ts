import { expect, test, type Page } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import type { GameScene } from '../../src/game/scenes/GameScene';
import { chunkKeys } from '../../src/game/utils/worldTiles';

const directory = 'screenshots/camera-fireball-cleanup';

async function start(page: Page, scale = 2) {
  await page.addInitScript(() => {
    Object.defineProperty(HTMLElement.prototype, 'requestFullscreen', { value: undefined });
  });
  await page.goto('/?test=1');
  await expect.poll(() => page.evaluate(() => !!window.__PIXEL__)).toBe(true);
  const scene = await page.evaluateHandle(async () => {
    const path = '/src/game/scenes/GameScene.ts', { GameScene } = await import(path), create = GameScene.prototype.create;
    const ready = new Promise<GameScene>(resolve => {
      GameScene.prototype.create = function (this: GameScene) {
        GameScene.prototype.create = create;
        create.call(this);
        resolve(this);
      };
    });
    window.__PIXEL__!.restartScene();
    return ready;
  });
  await page.getByRole('button', { name: 'Настройки', exact: true }).click();
  await page.getByRole('button', { name: `${scale}×`, exact: true }).click();
  await page.getByRole('button', { name: 'Готово', exact: true }).click();
  await page.getByRole('button', { name: /^Начать забег/ }).click();
  await page.evaluate(() => {
    const world = window.__PIXEL__!.world;
    world.options.spawnRate = 0;
    world.encounterDirector.nextAt = 1e6;
    world.player.invulnerableUntil = 1e6;
    for (const ability of Object.values(world.abilities)) { ability.level = 0; ability.readyAt = 1e6; }
  });
  return scene;
}

for (const [width, height, scale, touch] of [
  [844, 390, 2, true], [1024, 768, 2, true],
  [844, 390, 3, true], [1024, 768, 3, true], [1280, 720, 2, false],
] as const) test(`camera geometry, full world coverage and crisp art ${width}x${height} / scale${scale}`, async ({ browser, baseURL }) => {
  mkdirSync(directory, { recursive: true });
  const context = await browser.newContext({ baseURL, viewport: { width, height }, hasTouch: touch });
  try {
    const page = await context.newPage(), errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    const scene = await start(page, scale), base = Math.max(scale, Math.ceil(width / 960), Math.ceil(height / 640));
    const zoom = touch ? base * .83 / 1.3 : base;
    await expect.poll(() => scene.evaluate(s => s.cameras.main.zoom)).toBeCloseTo(zoom, 8);
    const geometry = await scene.evaluate(s => ({
      zoom: s.cameras.main.zoom, width: s.world.width, height: s.world.height,
      pixelArt: s.game.config.pixelArt, rounded: s.cameras.main.roundPixels,
      filtering: s.textures.get('hd-mage').source.map(source => source.scaleMode),
    }));
    expect(geometry).toMatchObject({ width: width / base, height: height / base, pixelArt: true, rounded: true, filtering: [1] });
    expect(await page.locator('canvas').evaluate(canvas => getComputedStyle(canvas).imageRendering)).toBe('pixelated');
    if (touch) {
      expect((width / zoom) / (width / (base * .83))).toBeCloseTo(1.3, 8);
      await expect(page.locator('.radar')).toBeHidden();
    } else await expect(page.locator('.radar')).toBeVisible();
    await page.evaluate(() => window.__PIXEL__!.world.pause());
    await page.addStyleTag({ content: '.overlay{display:none!important}' });
    for (const [x, y] of [[-127, -127], [63, 63], [1023, 257], [0, 0]]) {
      await page.evaluate(({ x, y }) => { const world = window.__PIXEL__!.world; world.player.x = x; world.player.y = y; }, { x, y });
      await expect.poll(async () => {
        const camera = await scene.evaluate(s => {
          const textures = s.textures.getTextureKeys().filter(key => key.startsWith('chunk-'));
          return { x: s.cameras.main.midPoint.x, y: s.cameras.main.midPoint.y,
            allNormal: textures.every(key => key.endsWith('-normal')),
            chunks: textures.map(key => key.replace(/-(normal|dusk|dying|burning)$/, '')).sort() };
        });
        const required = chunkKeys(camera.x, camera.y, width / zoom, height / zoom, touch ? 0 : 1).map(chunk => chunk.key).sort();
        return camera.x === x && camera.y === y && camera.allNormal && JSON.stringify(camera.chunks) === JSON.stringify(required);
      }).toBe(true);
    }
    // Actual battle and live automatic casts, with deterministic test-only targets.
    await page.evaluate(() => {
      const world = window.__PIXEL__!.world;
      world.resume(); world.abilities.fireball.level = 3; world.abilities.fireball.readyAt = 0;
      for (let i = 0; i < 18; i++) world.spawn(i % 4 === 0 ? 'tank' : i % 3 === 0 ? 'runner' : 'grunt', { x: Math.cos(i * 2.4) * (90 + i * 9), y: Math.sin(i * 2.4) * (70 + i * 6) });
    });
    await expect.poll(() => page.evaluate(() => window.__PIXEL__!.world.projectiles.length)).toBeGreaterThan(0);
    await page.screenshot({ path: `${directory}/battle-${width}x${height}-scale${scale}.png` });
    if (touch) {
      await page.setViewportSize({ width: height, height: width });
      await expect(page.locator('.rotate-device')).toBeVisible();
      const portraitBase = Math.max(scale, Math.ceil(height / 960), Math.ceil(width / 640));
      await expect.poll(() => scene.evaluate(s => s.cameras.main.zoom)).toBeCloseTo(portraitBase * .83, 8);
      expect(await page.evaluate(() => window.__PIXEL__!.world.status)).toBe('paused');
      await page.setViewportSize({ width, height });
      await expect.poll(() => scene.evaluate(s => s.cameras.main.zoom)).toBeCloseTo(zoom, 8);
    }
    writeFileSync(`${directory}/camera-${width}x${height}-scale${scale}.json`, JSON.stringify({ geometry, errors }, null, 2));
    expect(errors).toEqual([]);
    await scene.dispose();
  } finally { await context.close(); }
});

test('normal, rank III, rank V and evolved Fireball preserve their real projectiles', async ({ page }) => {
  mkdirSync(directory, { recursive: true });
  const scene = await start(page), evidence = [];
  await page.addStyleTag({ content: '.overlay{display:none!important}' });
  for (const [name, rank, damageUpgrades] of [['normal', 1, 0], ['rank-III', 3, 0], ['rank-V', 5, 0], ['evolved', 5, 3]] as const) {
    const state = await page.evaluate(async ({ rank, damageUpgrades }) => {
      const path = '/src/game/abilities/fireball.ts', { fireball } = await import(path), world = window.__PIXEL__!.world;
      world.clearTemporaryState(); world.enemies = []; world.effects = []; world.feedbackEvents = [];
      world.resume(); world.abilities.fireball.level = rank; world.abilities.fireball.readyAt = 1e6;
      world.upgrades.damage = damageUpgrades;
      const enemy = world.spawn('tank', { x: 220, y: 0 })!; enemy.speed = 0; enemy.hp = enemy.maxHp = 1e5;
      fireball(world);
      for (let i = 0; i < 15; i++) world.step(.02);
      world.pause();
      return { shots: world.projectiles.map(shot => ({ ...shot, hits: [...(shot.hits ?? [])] })), hp: enemy.hp, stats: { ...world.stats } };
    }, { rank, damageUpgrades });
    expect(state.shots).toHaveLength(name === 'evolved' ? 2 : 1);
    for (const shot of state.shots) { expect(Math.hypot(shot.vx, shot.vy)).toBeCloseTo(270); expect(shot.pierce).toBe(name === 'evolved' ? 1 : 0); }
    await expect.poll(() => page.evaluate(() => window.__PIXEL__!.art().actors.filter(actor => actor.frame.startsWith('fireball-')).length)).toBe(state.shots.length);
    await page.screenshot({ path: `${directory}/fireball-${name}.png` });
    const center = await scene.evaluate(s => {
      const shot = s.world.projectiles[0], camera = s.cameras.main;
      return { x: camera.width / 2 + (shot.x - camera.midPoint.x) * camera.zoom, y: camera.height / 2 + (shot.y - camera.midPoint.y) * camera.zoom };
    });
    await page.screenshot({ path: `${directory}/fireball-${name}-detail.png`, clip: { x: Math.round(center.x) - 64, y: Math.round(center.y) - 48, width: 128, height: 96 } });
    evidence.push({ name, rank, damageUpgrades, ...state });
  }
  writeFileSync(`${directory}/fireball.json`, JSON.stringify(evidence, null, 2));
  await scene.dispose();
});
