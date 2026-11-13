import { expect, test } from '@playwright/test';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { mkdirSync } from 'node:fs';

const file=pathToFileURL(resolve('art/generated/warrior-ultimates-gameplay-review-v1/viewer.html')).href;
const directory='screenshots/warrior-ultimates-file-launch';
test('file viewer opens the running local demo and casts a real ultimate',async({page})=>{
  test.setTimeout(45000);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(file);await expect(page).toHaveURL('http://127.0.0.1:5173/art/generated/warrior-ultimates-gameplay-review-v1/viewer.html');
  await expect(page.locator('#loading')).toBeHidden({timeout:30000});await expect(page.locator('#cast')).toBeEnabled();
  const game=page.frames().find(f=>f.url().includes('?test=1'))!;
  expect(await game.evaluate(()=>window.__PIXEL__!.world.ultimate.selected)).toBe('ruin');
  await page.locator('#cast').click();await expect.poll(()=>game.evaluate(()=>window.__PIXEL__!.world.ultimate.sequence)).toBe(1);
  await expect.poll(()=>game.evaluate(()=>window.__PIXEL__!.world.snapshot().ultimateDamage?.ruin??0)).toBeGreaterThan(0);
  await page.locator('#pause').click();mkdirSync(directory,{recursive:true});await page.screenshot({path:`${directory}/file-to-game.png`,fullPage:true});
  expect(errors).toEqual([]);
});
test('file viewer explains a stopped server without loading an invalid file iframe',async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('http://127.0.0.1:5173/favicon.svg?*',route=>route.abort());
  await page.goto(file);await expect(page.locator('#loading')).toContainText('Локальный сервер игры не запущен.');
  await expect(page.locator('#loading')).toContainText('start-demo.cmd');expect(page.url()).toBe(file);
  expect(await page.locator('#game').getAttribute('src')).toBeNull();
  await expect(page.locator('#loading a')).toHaveAttribute('href','http://127.0.0.1:5173/art/generated/warrior-ultimates-gameplay-review-v1/viewer.html');
  mkdirSync(directory,{recursive:true});await page.screenshot({path:`${directory}/server-unavailable.png`,fullPage:true});
  expect(errors).toEqual([]);
});
