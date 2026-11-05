import { expect,test } from '@playwright/test';
import { mkdirSync } from 'node:fs';
for(const [width,height]of [[1280,720],[844,390],[1024,768]])test(`menu has no DEV ultimate launchers and starts an ordinary run ${width}`,async({browser,baseURL})=>{
 const context=await browser.newContext({baseURL,viewport:{width,height},hasTouch:width!==1280}),page=await context.newPage();
 await page.addInitScript(()=>Object.defineProperty(HTMLElement.prototype,'requestFullscreen',{value:undefined}));await page.goto('/?test=1');
 await expect(page.locator('[data-dev-ultimate],.ultimate-practice')).toHaveCount(0);
 mkdirSync('screenshots/menu-clean',{recursive:true});await page.screenshot({path:`screenshots/menu-clean/menu-${width}.png`});
 await page.locator('.play-button').click();
 expect(await page.evaluate(()=>({level:window.__PIXEL__!.world.experience.level,selected:window.__PIXEL__!.world.ultimate.selected,charge:window.__PIXEL__!.world.ultimate.charge}))).toEqual({level:1,selected:null,charge:0});
 await context.close();
});

test('natural level-up at 10:00 grants ready ultimate; next use requires successful Blink',async({page})=>{
  await page.goto('/?test=1');await page.getByRole('button',{name:/^Начать забег/}).click();
  await page.evaluate(()=>{const w=window.__PIXEL__!.world;w.options.spawnRate=0;w.encounterDirector.nextAt=1e9;w.elapsed=600;w.experience.level=39;w.player.invulnerableUntil=1e9;for(const a of Object.values(w.abilities))a.level=0;w.gainXp(2000);});
  await expect(page.locator('[data-upgrade^="ultimate-"]')).toHaveCount(3);await page.locator('[data-upgrade="ultimate-fire"]').click();await expect(page.locator('.ultimate-control')).toContainText('10/10');
  await page.keyboard.press('q');await expect.poll(()=>page.evaluate(()=>window.__PIXEL__!.world.ultimate.sequence)).toBe(1);
  await page.evaluate(()=>{const w=window.__PIXEL__!.world;w.elapsed=w.ultimate.activeUntil;w.ultimate.update(w);});await page.keyboard.press('q');expect(await page.evaluate(()=>window.__PIXEL__!.world.ultimate.sequence)).toBe(1);
  for(let i=0;i<10;i++){await page.evaluate(()=>{const w=window.__PIXEL__!.world;w.mobility.readyAt=w.elapsed;});await page.keyboard.press('Space');await expect.poll(()=>page.evaluate(()=>window.__PIXEL__!.world.ultimate.charge)).toBe(i+1);}
  await page.keyboard.press('q');await expect.poll(()=>page.evaluate(()=>window.__PIXEL__!.world.ultimate.sequence)).toBe(2);expect(await page.evaluate(()=>window.__PIXEL__!.world.ultimate.charge)).toBe(0);
});
