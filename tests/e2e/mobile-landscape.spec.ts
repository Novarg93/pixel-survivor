import { test, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import type { Command } from '../../src/game/events/bridge';
test.use({ hasTouch: true });
for (const [width,height] of [[844,390],[390,844],[1024,768],[768,1024]]) test(`touch landscape policy ${width}x${height}`,async({page})=>{
  await page.setViewportSize({width,height}); await page.goto('/?test=1');
  await expect.poll(()=>page.evaluate(()=>!!window.__PIXEL__)).toBe(true);
  const blocked=height>width;
  if(blocked){
    await expect(page.getByRole('dialog',{name:'Поверните устройство горизонтально'})).toBeVisible();
    await page.evaluate(async()=>{const p='/src/game/events/bridge.ts';const {commands}=await import(p);commands.emit({type:'restart'});});
    expect(await page.evaluate(()=>window.__PIXEL__!.world.status)).toBe('menu');
  }else{
    await page.evaluate(()=>{Object.defineProperty(HTMLElement.prototype,'requestFullscreen',{value:()=>Promise.reject(new Error('test layout without fullscreen'))});});
    await page.getByRole('button',{name:/^Начать забег/}).click();
    await expect(page.locator('.radar')).toBeHidden(); await expect(page.locator('.mobility-control')).toBeVisible();
    expect((await page.locator('.mobility-control').boundingBox())!.width).toBe(80);
    await expect(page.locator('.skill-dock [role="listitem"]:visible')).toHaveCount(5);
    await page.evaluate(()=>{const w=window.__PIXEL__!.world;w.options.spawnRate=0;w.player.invulnerableUntil=1e6;});
    await page.evaluate(async () => {
      const path = '/src/game/events/bridge.ts';
      const { commands } = await import(path);
      Reflect.set(window, '__blinkCommands', 0);
      commands.on((command: Command) => {
        if (command.type === 'mobility') Reflect.set(window, '__blinkCommands', Reflect.get(window, '__blinkCommands') + 1);
      });
    });
    const cdp=await page.context().newCDPSession(page), box=(await page.locator('.joystick').boundingBox())!, button=(await page.locator('.mobility-control').boundingBox())!;
    const stick={id:1,x:box.x+box.width/2+32,y:box.y+box.height/2},blink={id:2,x:button.x+40,y:button.y+40};
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[stick]}); await page.waitForTimeout(150);
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[stick,blink]}); await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[blink]});
    await expect.poll(()=>page.evaluate(()=>window.__PIXEL__!.world.mobility.sequence)).toBe(1);
    await page.evaluate(()=>{const w=window.__PIXEL__!.world;w.gainXp(w.snapshot().xpNext);}); await expect(page.locator('.upgrade-panel')).toBeVisible();
    const x=await page.evaluate(()=>window.__PIXEL__!.world.player.x);
    const card = (await page.locator('[data-upgrade]').first().boundingBox())!;
    const choice = { id: 3, x: card.x + card.width / 2, y: card.y + card.height / 2 };
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [stick, choice] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [choice] });
    await expect(page.locator('.upgrade-panel')).toHaveCount(0);
    await expect.poll(()=>page.evaluate(()=>window.__PIXEL__!.world.player.x)).toBeGreaterThan(x+3);
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await cdp.detach();
    expect(await page.evaluate(() => Reflect.get(window, '__blinkCommands'))).toBe(1);
    // Clear cooldown so a duplicate click could not be hidden by MobilitySystem.
    await page.evaluate(() => { window.__PIXEL__!.world.mobility.readyAt = 0; });
    await page.locator('.mobility-control').click();
    await expect.poll(() => page.evaluate(() => Reflect.get(window, '__blinkCommands'))).toBe(2);
    await expect.poll(() => page.evaluate(() => window.__PIXEL__!.world.mobility.sequence)).toBe(2);
    await page.setViewportSize({width:height,height:width});await expect(page.locator('.rotate-device')).toBeVisible();
    const elapsed=await page.evaluate(()=>window.__PIXEL__!.world.elapsed);await page.waitForTimeout(180);expect(await page.evaluate(()=>window.__PIXEL__!.world.elapsed)).toBe(elapsed);
    await page.setViewportSize({width,height});await expect.poll(()=>page.evaluate(()=>window.__PIXEL__!.world.status)).toBe('playing');
    expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(width);
  }
  mkdirSync('screenshots/mobile-landscape',{recursive:true});await page.screenshot({path:`screenshots/mobile-landscape/${width}x${height}.png`});
});

test('rotation preserves manual pause and upgrade, but restores its own pause', async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 390 });
  await page.goto('/?test=1');
  await page.evaluate(() => {
    Object.defineProperty(HTMLElement.prototype, 'requestFullscreen', { value: () => Promise.reject(new Error('test fallback')) });
  });
  await page.getByRole('button', { name: /^Начать забег/ }).click();
  await page.getByRole('button', { name: 'Пауза', exact: true }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('.rotate-device')).toBeVisible();
  await page.setViewportSize({ width: 844, height: 390 });
  await expect(page.getByRole('dialog', { name: 'Пауза', exact: true })).toBeVisible();
  expect(await page.evaluate(() => window.__PIXEL__!.world.status)).toBe('paused');
  await page.getByRole('button', { name: /Продолжить/ }).click();
  await page.evaluate(() => { const world = window.__PIXEL__!.world; world.gainXp(world.snapshot().xpNext); });
  await expect(page.locator('.upgrade-panel')).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  const elapsed = await page.evaluate(() => window.__PIXEL__!.world.elapsed);
  await page.waitForTimeout(200);
  expect(await page.evaluate(() => window.__PIXEL__!.world.elapsed)).toBe(elapsed);
  await page.setViewportSize({ width: 844, height: 390 });
  await expect(page.locator('.upgrade-panel')).toBeVisible();
  await page.locator('[data-upgrade]').first().click();
  await expect.poll(() => page.evaluate(() => window.__PIXEL__!.world.status)).toBe('playing');
});

test('viewport listeners remain bounded through ten restarts and are removed on unmount', async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 390 });
  await page.goto('/?test=1');
  await expect.poll(() => page.evaluate(() => !!window.__PIXEL__)).toBe(true);
  const cdp = await page.context().newCDPSession(page);
  async function listeners() {
    const counts: Record<string, number> = {};
    for (const expression of ['window', 'document', 'screen.orientation', 'visualViewport']) {
      const { result } = await cdp.send('Runtime.evaluate', { expression });
      if (!result.objectId) continue;
      const { listeners } = await cdp.send('DOMDebugger.getEventListeners', { objectId: result.objectId });
      counts[expression] = listeners.filter(listener => ['resize', 'fullscreenchange', 'change'].includes(listener.type)).length;
      await cdp.send('Runtime.releaseObject', { objectId: result.objectId });
    }
    return counts;
  }
  const baseline = await listeners();
  expect(baseline.document).toBeGreaterThan(0);
  expect(baseline['screen.orientation']).toBeGreaterThanOrEqual(1);
  expect(baseline.visualViewport).toBe(1);
  for (let index = 0; index < 10; index++) {
    await page.evaluate(() => window.__PIXEL__!.restartScene());
    await expect(page.getByRole('button', { name: /^Начать забег/ })).toBeVisible();
    expect(await listeners()).toEqual(baseline);
    expect(await page.evaluate(() => window.__PIXEL__!.listeners())).toEqual({ commands: 1, snapshots: 1, metrics: 1 });
  }
  await page.evaluate(() => Reflect.get(document.querySelector('#app')!, '__vue_app__').unmount());
  await expect.poll(() => page.locator('canvas').count()).toBe(0);
  // Phaser completes Game.destroy on its next frame after Vue removes the Canvas.
  await expect.poll(listeners).toEqual({ window: 0, document: 0, 'screen.orientation': 0, visualViewport: 0 });
  await cdp.detach();
});
for(const mode of ['success','failure','unsupported','lock-unsupported','lock-failure'] as const)test(`fullscreen gesture and orientation ${mode}`,async({page})=>{
  await page.setViewportSize({width:844,height:390});
  await page.addInitScript(mode=>{
    const calls:string[]=[];Object.defineProperty(window,'__mobileCalls',{value:calls});
    Object.defineProperty(HTMLElement.prototype,'requestFullscreen',{value:mode==='unsupported'?undefined:function(){calls.push('fullscreen:'+navigator.userActivation.isActive);if(mode==='failure')return Promise.reject(new Error('denied'));Object.defineProperty(document,'fullscreenElement',{configurable:true,value:document.documentElement});document.dispatchEvent(new Event('fullscreenchange'));return Promise.resolve();}});
    Object.defineProperty(screen.orientation,'lock',{value:mode==='unsupported'||mode==='lock-unsupported'?undefined:()=>{calls.push('landscape');return mode==='lock-failure'?Promise.reject(new Error('denied')):Promise.resolve();}});
  },mode);
  await page.goto('/?test=1');expect(await page.evaluate(()=>Reflect.get(window,'__mobileCalls'))).toEqual([]);
  await page.getByRole('button',{name:/^Начать забег/}).click();
  await expect.poll(()=>page.evaluate(()=>window.__PIXEL__!.world.status)).toBe('playing');
  await page.waitForTimeout(150);const calls=await page.evaluate(()=>Reflect.get(window,'__mobileCalls'));
  expect(calls).toEqual(mode==='success'||mode==='lock-failure'?['fullscreen:true','landscape']:mode==='failure'||mode==='lock-unsupported'?['fullscreen:true']:[]);
  await page.evaluate(()=>{Object.defineProperty(document,'fullscreenElement',{configurable:true,value:null});document.dispatchEvent(new Event('fullscreenchange'));});await page.setViewportSize({width:900,height:420});await page.waitForTimeout(100);
  expect(await page.evaluate(()=>Reflect.get(window,'__mobileCalls'))).toEqual(calls);
  expect((await page.locator('canvas').boundingBox())!.width).toBe(900);
});
test('native Chromium fullscreen enters and exits from the start gesture',async({page})=>{
  await page.setViewportSize({width:844,height:390});await page.goto('/?test=1');await page.getByRole('button',{name:/^Начать забег/}).click();
  await expect.poll(()=>page.evaluate(()=>!!document.fullscreenElement)).toBe(true);
  await page.evaluate(()=>document.exitFullscreen());await expect.poll(()=>page.evaluate(()=>!!document.fullscreenElement)).toBe(false);
});
test.describe('desktop unchanged',()=>{test.use({hasTouch:false});test('desktop Canvas and HUD',async({page})=>{
  await page.setViewportSize({width:1280,height:720});await page.goto('/?test=1');await page.getByRole('button',{name:/^Начать забег/}).click();
  await expect(page.locator('.radar')).toBeVisible();await expect(page.locator('.mobility-control')).toBeHidden();expect(await page.evaluate(()=>!!document.fullscreenElement)).toBe(false);
  await page.screenshot({path:'screenshots/mobile-landscape/1280x720.png'});
});});
