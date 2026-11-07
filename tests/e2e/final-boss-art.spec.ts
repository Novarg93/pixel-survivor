import {test,expect} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';
for(const [width,height]of [[1280,720],[844,390]])test(`Warden directional sword, frozen beams, Fire and Lightning art ${width}`,async({browser,baseURL})=>{
 test.setTimeout(40000);mkdirSync('screenshots/final-boss',{recursive:true});
 const context=await browser.newContext({baseURL,viewport:{width,height},hasTouch:width<1000,recordVideo:{dir:'screenshots/final-boss/videos',size:{width,height}}}),page=await context.newPage(),errors:string[]=[];
 page.on('pageerror',e=>errors.push(e.message));await page.addInitScript(()=>Object.defineProperty(HTMLElement.prototype,'requestFullscreen',{value:undefined}));await page.goto('/?test=1');await page.locator('.play-button').click();
 await page.evaluate(()=>{const w=window.__PIXEL__!.world;w.options.spawnRate=0;w.encounterDirector.nextAt=1e9;w.experience.level=70;w.elapsed=1200;w.player.invulnerableUntil=1e9;for(const a of Object.values(w.abilities))a.level=0;w.finalEncounter.begin(w);});await page.waitForFunction(()=>window.__PIXEL__!.world.finalEncounter.phase==='phase1');
 const frames=[];
 for(const [direction,x,y]of [['down',0,1],['up',0,-1],['right',1,0],['left',-1,0]]as const){
  await page.evaluate(({x,y})=>{const w=window.__PIXEL__!.world,f=w.finalEncounter,e=f.boss!;e.x=f.center.x;e.y=f.center.y;w.player.x=e.x+70;w.player.y=e.y+65;f.nextCombo=Infinity;f.attack={...f.attack,kind:'swordWindup',age:0,duration:.9,direction:{x,y},contacted:false};}, {x,y});
  await page.waitForTimeout(550);await page.screenshot({path:`screenshots/final-boss/sword-${direction}-windup-${width}.png`});
  await page.waitForFunction(()=>window.__PIXEL__!.world.finalEncounter.attack.kind==='swordActive');
  frames.push(await page.evaluate(()=>{const f=window.__PIXEL__!.world.finalEncounter;return{kind:f.attack.kind,direction:f.attack.direction,age:f.attack.age};}));await page.screenshot({path:`screenshots/final-boss/sword-${direction}-active-${width}.png`});
 }
 await page.evaluate(()=>{const w=window.__PIXEL__!.world;w.damageEnemy(w.finalEncounter.boss!,1e9);});await page.waitForFunction(()=>window.__PIXEL__!.world.finalEncounter.supports.size===3);
 await page.evaluate(()=>{const w=window.__PIXEL__!.world;w.ultimate.choose(w,'frost');w.ultimate.activate(w);});await page.waitForFunction(()=>{const w=window.__PIXEL__!.world;return!!w.finalEncounter.boss!.ultimateFreeze;});
 await page.screenshot({path:`screenshots/final-boss/frozen-beams-${width}.png`});expect(await page.evaluate(()=>window.__PIXEL__!.world.finalEncounter.supports.size)).toBe(3);
 await page.evaluate(()=>{const w=window.__PIXEL__!.world;for(const g of [...w.guardians])w.damageEnemy(g,1e9);w.ultimate.clear();w.ultimate.choose(w,'fire');w.ultimate.activate(w);});await page.waitForTimeout(500);await page.screenshot({path:`screenshots/final-boss/with-fire-${width}.png`});
 await page.evaluate(()=>{const w=window.__PIXEL__!.world;w.ultimate.clear();w.ultimate.choose(w,'lightning');w.ultimate.activate(w);});await page.waitForTimeout(550);await page.screenshot({path:`screenshots/final-boss/with-lightning-${width}.png`});
 expect(errors).toEqual([]);writeFileSync(`docs/final-boss/directions-${width}.json`,JSON.stringify({frames,errors},null,2));await context.close();
});
