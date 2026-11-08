import {expect,test,type Page} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';
import {mockGamepads,connectPad,padFocus,pressPad} from '../helpers/gamepad';
const directory='screenshots/rootbound-guardian-v1/practice';
const profile=JSON.stringify({version:2,settings:{volume:.3,muted:true,pixelScale:2},records:[],lastPlayed:null,statistics:{runs:3,kills:12,seconds:360}});
async function captureArena(page:Page,path:string){
  const hide=await page.addStyleTag({content:'.overlay{display:none!important}'});
  try{await page.locator('canvas').screenshot({path});}finally{await hide.evaluate(el=>el.parentNode?.removeChild(el));}
}
for(const [width,height]of [[1280,720],[844,390],[740,360]])test(`menu Guardian duel, terminal state, restart and records ${width}`,async({browser,baseURL})=>{
  test.setTimeout(35000);mkdirSync(directory,{recursive:true});
  const context=await browser.newContext({baseURL,viewport:{width,height},hasTouch:width<1000}),page=await context.newPage(),errors:string[]=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(profile=>{localStorage.setItem('pixel-survivor-v1',profile);Object.defineProperty(HTMLElement.prototype,'requestFullscreen',{value:undefined});},profile);
  await page.goto('/?test=1');const button=page.getByRole('button',{name:/Бой с Хранителем/});
  await expect(page.getByRole('button',{name:/Бой с Хранителем затмения/})).toHaveCount(0);await expect(button).toBeInViewport({ratio:1});await expect(page.getByRole('button',{name:/Бой со Стражем/})).toBeInViewport({ratio:1});
  await page.screenshot({path:`${directory}/menu-${width}.png`});
  if(width===1280){await button.focus();await page.keyboard.press('Enter');}else await button.tap();
  await page.waitForFunction(()=>window.__PIXEL__?.world.practiceBoss==='rootbound-guardian');
  const entry=await page.evaluate(()=>{const w=window.__PIXEL__!.world;w.pause();return {run:w.runId,practice:w.practice,boss:w.practiceBoss,level:w.experience.level,hp:w.player.hp,protection:w.player.invulnerableUntil,kinds:w.enemies.map(e=>e.kind),encounter:!!w.guardianSystem.encounter,final:w.finalEncounter.phase};});
  expect(entry).toMatchObject({practice:true,boss:'rootbound-guardian',level:54,hp:200,protection:0,kinds:['guardian'],encounter:true,final:'inactive'});
  await expect(page.locator('.run-clock')).toContainText('Корневой хранитель · 1×1');await expect(page.locator('.boss-bar')).toHaveCount(0);await expect(page.locator('.guardian-waves')).toHaveCount(0);await expect(page.locator('.final-boss-bar')).toHaveCount(0);await expect(page.getByLabel('Шкала запланированных событий')).toHaveCount(0);
  const elapsed=await page.evaluate(()=>window.__PIXEL__!.world.elapsed);await page.waitForTimeout(120);expect(await page.evaluate(()=>window.__PIXEL__!.world.elapsed)).toBe(elapsed);
  await page.screenshot({path:`${directory}/entry-${width}.png`});
  await captureArena(page,`${directory}/entry-canvas-${width}.png`);
  await page.getByRole('button',{name:'Продолжить →'}).click();await page.waitForFunction(()=>window.__PIXEL__!.world.guardianSystem.encounter?.phase==='orb-warning');
  await page.evaluate(()=>window.__PIXEL__!.world.pause());await page.waitForTimeout(100);
  const kinds=await page.evaluate(()=>window.__PIXEL__!.world.enemies.map(e=>e.kind));expect(kinds).toEqual(['guardian']);
  await page.screenshot({path:`${directory}/casting-${width}.png`});
  await captureArena(page,`${directory}/casting-canvas-${width}.png`);
  if(width===844)await page.evaluate(()=>{const w=window.__PIXEL__!.world;w.resume();w.damagePlayer(1e9);});
  else{await page.getByRole('button',{name:'Продолжить →'}).click();await page.waitForFunction(()=>window.__PIXEL__!.world.outcome==='victory');}
  await expect(page.getByText('Тренировка · результат не записывается в рекорды.',{exact:true})).toBeVisible();
  expect(await page.evaluate(()=>window.__PIXEL__!.world.outcome)).toBe(width===844?'defeat':'victory');
  if(width!==844)await expect(page.getByText('ХРАНИТЕЛЬ ПОВЕРЖЕН',{exact:true})).toBeVisible();
  expect(await page.evaluate(()=>localStorage.getItem('pixel-survivor-v1'))).toBe(profile);await page.screenshot({path:`${directory}/result-${width}.png`});
  await page.getByRole('button',{name:'Начать заново',exact:true}).click();await expect.poll(()=>page.evaluate(()=>window.__PIXEL__!.world.runId)).not.toBe(entry.run);
  expect(await page.evaluate(()=>({boss:window.__PIXEL__!.world.practiceBoss,kinds:window.__PIXEL__!.world.enemies.map(e=>e.kind)}))).toEqual({boss:'rootbound-guardian',kinds:['guardian']});
  await page.getByRole('button',{name:'Пауза',exact:true}).click();await page.getByRole('button',{name:'В главное меню',exact:true}).click();await page.locator('.play-button').click();
  expect(await page.evaluate(()=>({practice:window.__PIXEL__!.world.practice,boss:window.__PIXEL__!.world.practiceBoss,level:window.__PIXEL__!.world.experience.level}))).toEqual({practice:false,boss:null,level:1});
  await expect(page.locator('canvas')).toHaveCount(1);expect(await page.evaluate(()=>window.__PIXEL__!.listeners())).toEqual({commands:1,snapshots:1,metrics:1});
  expect(errors).toEqual([]);writeFileSync(`${directory}/evidence-${width}.json`,JSON.stringify({entry,kinds,errors},null,2));await context.close();
});
test('controller starts the Guardian duel using the real menu button',async({page})=>{
  await mockGamepads(page);await page.goto('/?test=1');await connectPad(page);await padFocus(page,page.getByRole('button',{name:/Бой с Хранителем/}));await pressPad(page,'confirm');
  await page.waitForFunction(()=>window.__PIXEL__?.world.practiceBoss==='rootbound-guardian');
  expect(await page.evaluate(()=>window.__PIXEL__!.world.enemies.map(e=>e.kind))).toEqual(['guardian']);await expect(page.locator('.mobility-slot')).toHaveAttribute('aria-label',/X/);
});
