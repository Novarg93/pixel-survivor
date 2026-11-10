import {test,expect,type Page} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';
const shell=(page:Page)=>page.evaluate(()=>window.__PIXEL__!.art().mageAbilities.active.filter(v=>v.frame.startsWith('mage-shield-')));
async function age(page:Page,now:number){await page.evaluate(now=>{window.__PIXEL__!.world.elapsed=now;},now);await page.waitForTimeout(50);}
for(const width of [1280,390])test(`accepted PixelLab shield in game: follows, absorbs, pauses, fades, expires and restarts ${width}`,async({page})=>{
 const dir=`screenshots/mage-shield-pixellab-v1/${width}`;mkdirSync(dir,{recursive:true});const errors:string[]=[],loads:string[]=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});page.on('request',r=>{if(r.url().includes('/assets/hd/mage-shield-nova-pixellab-v1/'))loads.push(new URL(r.url()).pathname);});
 await page.setViewportSize({width,height:width===390?844:720});await page.goto('/?test=1');await page.getByRole('button',{name:'Начать забег'}).click();
 const fixture=await page.evaluate(async()=>{
  const w=window.__PIXEL__!.world;w.pause();w.elapsed=20;w.clearTemporaryState();w.enemies=[];w.options.spawnRate=0;w.encounterDirector.nextAt=Infinity;
  for(const a of Object.values(w.abilities)){a.level=0;a.readyAt=Infinity;}w.abilities.shield.level=3;w.player.invulnerableUntil=0;
  const path='/src/game/abilities/arcaneShield.ts',{arcaneShield}=await import(path);w.resume();const fired=arcaneShield(w);w.pause();return{fired,started:w.elapsed,until:w.shield.absorbUntil,absorb:w.absorb,hp:w.player.hp};
 });
 expect(fixture).toMatchObject({fired:true,absorb:25,until:28});await page.addStyleTag({content:'.overlay{display:none!important}'});
 await expect.poll(async()=>(await shell(page))[0]?.frame).toBe('mage-shield-fade-8');
 await age(page,20.5);await expect.poll(async()=>(await shell(page))[0]?.frame).toBe('mage-shield-fade-0');await page.locator('canvas').screenshot({path:dir+'/appearance.png'});
 await age(page,20.6);const sustained=(await shell(page))[0]!;expect(sustained).toMatchObject({texture:'mage-shield-nova-pixellab-v1',size:64,originX:.5,originY:108/128,alpha:.7,depth:10.03,blendMode:0,tint:0xffffff});
 const paused=await page.locator('canvas').screenshot();await page.waitForTimeout(120);expect(await page.locator('canvas').screenshot()).toEqual(paused);await page.locator('canvas').screenshot({path:dir+'/sustain.png'});
 const moved=await page.evaluate(()=>{const w=window.__PIXEL__!.world;w.resume();w.mobility.activate(w,{x:1,y:0});w.pause();return{x:w.player.x,y:w.player.y};});
 await expect.poll(async()=>(await shell(page)).map(v=>[v.x,v.y])).toEqual([[moved.x,moved.y]]);await age(page,21.3);await page.locator('canvas').screenshot({path:dir+'/after-blink.png'});
 const hit=await page.evaluate(()=>{const w=window.__PIXEL__!.world;w.resume();w.mobility.protectedUntil=w.player.invulnerableUntil=0;w.damagePlayer(40);w.pause();return{hp:w.player.hp,absorb:w.absorb};});expect(hit).toEqual({hp:85,absorb:0});
 await expect.poll(async()=>(await shell(page))[0]?.frame).toBe('mage-shield-fade-0');await age(page,21.55);await page.locator('canvas').screenshot({path:dir+'/depleted-fade.png'});await age(page,21.84);await expect.poll(async()=>(await shell(page)).length).toBe(0);
 await page.evaluate(async()=>{const w=window.__PIXEL__!.world,path='/src/game/abilities/arcaneShield.ts',{arcaneShield}=await import(path);w.resume();arcaneShield(w);w.pause();});await expect.poll(async()=>(await shell(page)).length).toBe(1);
 await age(page,29.9);await expect.poll(async()=>(await shell(page))[0]?.frame).toBe('mage-shield-fade-1');await age(page,30.38);await expect.poll(async()=>(await shell(page)).length).toBe(0);
 const evidence=await page.evaluate(()=>({art:window.__PIXEL__!.art().mageAbilities,clock:window.__PIXEL__!.art().clock,tweens:window.__PIXEL__!.art().tweens}));expect(evidence.clock).toEqual([0,0,0]);expect(evidence.tweens).toBe(0);expect(evidence.art.allocated).toBe(1);
 for(let i=0;i<3;i++){await page.evaluate(()=>window.__PIXEL__!.restartScene());await page.waitForFunction(()=>window.__PIXEL__!.world.status==='menu');expect(await shell(page)).toEqual([]);expect(await page.evaluate(()=>window.__PIXEL__!.art().mageAbilities.allocated)).toBe(0);}
 expect(loads.sort()).toEqual(['/assets/hd/mage-shield-nova-pixellab-v1/atlas.json','/assets/hd/mage-shield-nova-pixellab-v1/atlas.png']);expect(errors).toEqual([]);writeFileSync(dir+'/evidence.json',JSON.stringify({fixture,sustained,moved,hit,evidence,loads,errors},null,2));
});
