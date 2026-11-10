import {test,expect} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';
const root='screenshots/boss-meteor-ui-fix-v1';
for(const[width,height]of [[1280,720],[844,390]])for(const outcome of ['victory','defeat']as const)test(`ultimate stays below modals and disappears from ${outcome} results ${width}`,async({browser,baseURL})=>{
  test.setTimeout(35000);mkdirSync(root,{recursive:true});
  const context=await browser.newContext({baseURL,viewport:{width,height},hasTouch:width===844}),page=await context.newPage(),errors:string[]=[];
  page.on('pageerror',e=>errors.push(e.message));await page.addInitScript(()=>Object.defineProperty(HTMLElement.prototype,'requestFullscreen',{value:undefined}));
  await page.goto('/?test=1');await page.getByRole('button',{name:/Бой со Стражем/}).click();
  const ultimate=page.locator('.ultimate-control');await expect(ultimate).toBeVisible();const spot=await ultimate.boundingBox();
  await page.getByRole('button',{name:'Пауза',exact:true}).click();await expect(page.getByRole('dialog',{name:'Пауза',exact:true})).toBeVisible();
  const layers=await page.evaluate(()=>({modal:Number(getComputedStyle(document.querySelector('.overlay')!).zIndex),ultimate:Number(getComputedStyle(document.querySelector('.ultimate-control')!).zIndex)}));
  expect(layers.modal).toBeGreaterThan(layers.ultimate);await expect(ultimate).toBeDisabled();
  await page.screenshot({path:`${root}/pause-${outcome}-${width}.png`});
  await page.getByRole('button',{name:'Настройки',exact:true}).click();await expect(page.getByRole('dialog',{name:'Настройки',exact:true})).toBeVisible();
  expect(await page.evaluate(()=>Number(getComputedStyle(document.querySelector('.overlay')!).zIndex))).toBeGreaterThan(layers.ultimate);
  await page.getByRole('button',{name:'Готово',exact:true}).click();await page.getByRole('button',{name:'Продолжить →'}).click();
  await page.waitForFunction(()=>window.__PIXEL__!.world.finalEncounter.phase==='phase1');
  if(outcome==='defeat')await page.evaluate(()=>{const w=window.__PIXEL__!.world;w.shield.clearAbsorb();w.player.invulnerableUntil=w.mobility.protectedUntil=0;w.damagePlayer(1e9);});
  else await page.evaluate(()=>{
    const w=window.__PIXEL__!.world,f=w.finalEncounter;w.player.invulnerableUntil=Infinity;
    w.damageEnemy(f.boss!,1e9);for(let i=0;i<18;i++)w.step(.05);for(const g of [...w.guardians])w.damageEnemy(g,1e9);w.damageEnemy(f.boss!,1e9);for(let i=0;i<37;i++)w.step(.05);w.damageEnemy(f.boss!,1e9);
  });
  const dialog=page.getByRole('dialog',{name:'Игра окончена'});await expect(dialog).toBeVisible();await expect(ultimate).toHaveCount(0);
  // Reproduce a terminal UI snapshot retaining a ready skill, independently
  // of World cleanup clearing the live ultimate at death.
  await page.evaluate(()=>{const u=window.__PIXEL__!.world.ultimate;u.selected='lightning';u.charge=10;});
  await page.waitForTimeout(200);await expect(ultimate).toHaveCount(0);
  expect(await page.evaluate(()=>({outcome:window.__PIXEL__!.world.outcome,ultimate:window.__PIXEL__!.world.ultimate.selected}))).toEqual({outcome,ultimate:'lightning'});
  expect(await page.evaluate(({x,y})=>!!document.elementFromPoint(x,y)?.closest('.overlay'),{x:spot!.x+spot!.width/2,y:spot!.y+spot!.height/2})).toBe(true);
  await page.screenshot({path:`${root}/results-${outcome}-${width}.png`});
  await dialog.getByRole('button',{name:'Начать заново',exact:true}).click();await expect(ultimate).toBeVisible();await expect(ultimate).toContainText('10/10');
  expect(errors).toEqual([]);writeFileSync(`${root}/layers-${outcome}-${width}.json`,JSON.stringify({layers,outcome,ultimateRemovedAtResults:true,restoredOnRestart:true,errors},null,2));await context.close();
});
