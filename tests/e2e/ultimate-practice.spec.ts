import { expect,test } from '@playwright/test';
import { mkdirSync } from 'node:fs';
const directory='screenshots/ultimate-practice';
for(const [width,height]of [[1280,720],[844,390],[1024,768]])test(`three DEV launches, first charge, real casts and no records ${width}`,async({browser,baseURL})=>{
  test.setTimeout(45000);
  const context=await browser.newContext({baseURL,viewport:{width,height},hasTouch:width!==1280}),page=await context.newPage(),errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>Object.defineProperty(HTMLElement.prototype,'requestFullscreen',{value:undefined}));
  await page.goto('/?test=1');await expect(page.locator('[data-dev-ultimate]')).toHaveCount(3);
  mkdirSync(directory,{recursive:true});await page.screenshot({path:`${directory}/menu-${width}.png`});
  const stored=await page.evaluate(()=>localStorage.getItem('pixel-survivor-v1'));
  for(const id of ['lightning','frost','fire'] as const){
    await page.locator(`[data-dev-ultimate="${id}"]`).click();
    await expect.poll(()=>page.evaluate(()=>window.__PIXEL__!.world.status)).toBe('playing');
    const initial=await page.evaluate(()=>{const w=window.__PIXEL__!.world;return{time:w.elapsed,level:w.experience.level,practice:w.snapshot().practice,ultimate:w.ultimate.selected,charge:w.ultimate.charge,abilities:w.abilityDefinitions.map(a=>w.abilities[a.id].level),pending:w.experience.pending,immune:w.player.invulnerableUntil};});
    expect(initial).toMatchObject({level:40,practice:true,ultimate:id,charge:10,pending:0,immune:0});expect(initial.time).toBeGreaterThanOrEqual(600);expect(initial.time).toBeLessThan(604);expect(initial.abilities.every(n=>n>=1&&n<=5)).toBe(true);
    await expect(page.locator('.ultimate-control')).toContainText('10/10');
    await page.screenshot({path:`${directory}/${id}-ready-${width}.png`});
    if(width===1280)await page.keyboard.press('q');else await page.locator('.ultimate-control').dispatchEvent('pointerdown',{pointerId:7,pointerType:'touch'});
    await expect.poll(()=>page.evaluate(()=>window.__PIXEL__!.world.ultimate.sequence)).toBe(1);expect(await page.evaluate(()=>window.__PIXEL__!.world.ultimate.charge)).toBe(0);
    await page.waitForTimeout(id==='lightning'?430:150);await page.screenshot({path:`${directory}/${id}-cast-${width}.png`});
    if(id==='lightning')await page.waitForFunction(()=>!window.__PIXEL__!.world.ultimate.casting);
    await page.evaluate(()=>{const w=window.__PIXEL__!.world;w.player.invulnerableUntil=w.mobility.protectedUntil=0;w.damagePlayer(1e9);});
    await expect.poll(()=>page.evaluate(()=>window.__PIXEL__!.world.status)).toBe('over');
    await expect(page.getByText('DEV · ТЕСТОВЫЙ ЗАБЕГ БЕЗ РЕКОРДА',{exact:true})).toBeVisible();
    expect(await page.evaluate(()=>localStorage.getItem('pixel-survivor-v1'))).toBe(stored);
    await page.evaluate(async()=>{const path='/src/game/events/bridge.ts',{commands}=await import(path);commands.emit({type:'menu'});});
    await expect(page.locator('[data-dev-ultimate]')).toHaveCount(3);
  }
  await page.getByRole('button',{name:/^Начать забег/}).click();
  expect(await page.evaluate(()=>({level:window.__PIXEL__!.world.experience.level,practice:window.__PIXEL__!.world.snapshot().practice,selected:window.__PIXEL__!.world.ultimate.selected}))).toEqual({level:1,practice:undefined,selected:null});
  expect(errors).toEqual([]);await context.close();
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
