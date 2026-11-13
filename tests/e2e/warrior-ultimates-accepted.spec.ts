import { expect, test, type Page } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';

const root = 'screenshots/warrior-ultimates-accepted-v1';
const directions = [['south',0,1],['south-east',1,1],['east',1,0],['north-east',1,-1],['north',0,-1],['north-west',-1,-1],['west',-1,0],['south-west',-1,1]] as const;
async function start(page: Page, x: number, y: number) {
  await page.goto('/?test=1'); await page.getByRole('button', { name: /^Warrior/ }).click();
  await page.getByRole('button', { name: 'Начать забег' }).click();
  await page.evaluate(({x,y}) => {
    const w = window.__PIXEL__!.world, len = Math.hypot(x,y);
    w.options.spawnRate = 0; w.encounterDirector.nextAt = Infinity;
    for (const a of Object.values(w.abilities)) a.level = 0;
    w.elapsed = 300; w.experience.level = 29; w.facing = {x:x/len,y:y/len};
    w.player.hp = 20; w.player.invulnerableUntil = Infinity; w.gainXp(w.snapshot().xpNext);
  }, {x,y});
  await expect(page.locator('[data-upgrade^="ultimate-"]')).toHaveCount(3);
  await page.locator('[data-upgrade="ultimate-banner"]').click();
  await expect(page.getByRole('dialog', { name: 'Новый уровень' })).toHaveCount(0);
  // Ordinary input activates the ultimate; pause afterwards to inspect simulation ages.
  await page.locator('.ultimate-control').click();
  await expect.poll(() => page.evaluate(() => window.__PIXEL__!.world.ultimate.sequence)).toBe(1);
  await page.evaluate(() => window.__PIXEL__!.world.pause());
}
async function at(page: Page, age: number) {
  await page.evaluate(age => {
    const w = window.__PIXEL__!.world, end = w.ultimate.started + age;
    w.resume(); while (w.elapsed < end - 1e-7) w.step(Math.min(.01, end - w.elapsed)); w.pause();
  }, age);
  await page.waitForTimeout(45);
}
test('accepted Banner: eight routes, contact/animated flag, pause, expiry and teardown on real Canvas', async ({page}) => {
  test.setTimeout(90000); mkdirSync(root, {recursive:true});
  const errors: string[] = [], evidence = []; page.on('pageerror', e => errors.push(e.message));
  for (const [direction,x,y] of directions) {
    await start(page,x,y); await at(page,.25);
    expect(await page.evaluate(() => window.__PIXEL__!.world.player.hp)).toBe(20);
    expect(await page.evaluate(() => window.__PIXEL__!.art().ultimate.banner.active)).toBe(false);
    await at(page,.54);
    const state = await page.evaluate(() => ({pose:window.__PIXEL__!.art().warrior, banner:window.__PIXEL__!.art().ultimate.banner, origin:window.__PIXEL__!.world.ultimate.banner.origin}));
    expect(state.pose?.motion).toBe('ultimate-banner'); expect(state.pose?.direction).toBe(direction);
    expect(state.pose?.id).toBe(direction.startsWith('north') ? 'north-block' : 'gesture-banner');
    expect(state.banner.active).toBe(true); expect(state.banner.allocated).toBe(2);
    const hide = await page.addStyleTag({content:'.overlay{visibility:hidden!important}'});
    await page.locator('canvas').screenshot({path:`${root}/banner-${direction}-1280.png`});
    const frozen = await page.evaluate(() => window.__PIXEL__!.art().ultimate.banner);
    await page.waitForTimeout(100); expect(await page.evaluate(() => window.__PIXEL__!.art().ultimate.banner)).toEqual(frozen);
    await at(page,.7); expect(await page.evaluate(() => window.__PIXEL__!.art().ultimate.banner.frame)).not.toBe(frozen.frame);
    await at(page,1); expect(await page.evaluate(() => window.__PIXEL__!.art().warrior?.motion)).toBe('idle');
    expect(await page.evaluate(() => window.__PIXEL__!.world.ultimate.banner.origin)).toEqual(state.origin);
    await at(page,15.46); expect(await page.evaluate(() => window.__PIXEL__!.art().ultimate.banner.active)).toBe(false);
    await hide.evaluate(el => el.parentNode?.removeChild(el)); evidence.push({direction,...state});
  }
  await page.evaluate(() => window.__PIXEL__!.restartScene());
  await expect(page.getByRole('button', {name:'Начать забег'})).toBeVisible();
  expect(await page.evaluate(() => window.__PIXEL__!.world.ultimate.banner.started)).toBe(-Infinity);
  expect(await page.evaluate(() => window.__PIXEL__!.listeners())).toEqual({commands:1,snapshots:1,metrics:1});
  expect(await page.locator('canvas').count()).toBe(1); expect(errors).toEqual([]);
  writeFileSync(`${root}/banner-evidence.json`,JSON.stringify({evidence,errors},null,2));
});

test('accepted Banner: touch cast and animated healing flag in portrait/landscape', async ({page}) => {
  mkdirSync(root,{recursive:true}); await page.setViewportSize({width:390,height:844});
  await start(page,-1,-1); await at(page,.65);
  const hide = await page.addStyleTag({content:'.overlay{visibility:hidden!important}'});
  await page.screenshot({path:`${root}/banner-390.png`});
  await page.setViewportSize({width:844,height:390}); await page.waitForTimeout(60);
  await page.screenshot({path:`${root}/banner-844.png`});
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await hide.evaluate(el => el.parentNode?.removeChild(el));
});
