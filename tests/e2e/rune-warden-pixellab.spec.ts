import {test,expect,type Page} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';
async function advance(page:Page,seconds:number){await page.evaluate(seconds=>{const w=window.__PIXEL__!.world;w.resume();for(let t=0;t<seconds-1e-8;t+=.01)w.step(Math.min(.01,seconds-t));w.pause();},seconds);await page.waitForTimeout(60);}
for(const width of [1280,390])test(`accepted PixelLab Rune Warden: double velocity, real hit, hollow Blink, pause and restart ${width}`,async({page})=>{
 const dir=`screenshots/rune-warden-pixellab-v1/${width}`;mkdirSync(dir,{recursive:true});const errors:string[]=[],loads:string[]=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});page.on('request',r=>{if(r.url().includes('/assets/hd/rune-warden-pixellab-v1/'))loads.push(new URL(r.url()).pathname);});
 await page.setViewportSize({width,height:width===390?844:720});await page.goto('/?test=1');await page.getByRole('button',{name:'Начать забег'}).click();
 const fixture=await page.evaluate(async()=>{
  const w=window.__PIXEL__!.world;w.pause();w.elapsed=630;w.options.spawnRate=0;w.encounterDirector.nextAt=Infinity;w.enemies=[];w.clearTemporaryState();for(const a of Object.values(w.abilities))a.level=0;w.player.invulnerableUntil=0;
  const e=w.spawn('sorcerer',{x:-30,y:-60})!;e.hp=e.maxHp=10000;e.boss!.phase='windup';e.boss!.until=Infinity;e.boss!.magic=undefined;e.boss!.aim={x:0,y:0};e.boss!.late=undefined;
  const path='/src/game/systems/BossMagic.ts',{fireBossVolley}=await import(path);w.resume();fireBossVolley(w,e);w.pause();return{hp:w.player.hp,damage:e.damage,shots:w.projectiles.map(p=>({...p}))};
 });
 await page.addStyleTag({content:'.overlay{display:none!important}'});await expect.poll(()=>page.evaluate(()=>window.__PIXEL__!.art().actors.filter(a=>a.texture==='rune-warden-pixellab-v1').length)).toBe(3);
 let art=await page.evaluate(()=>window.__PIXEL__!.art());const bolts=art.actors.filter(a=>a.texture==='rune-warden-pixellab-v1');
 for(const a of bolts){expect(a.frame).toBe('rune-ai-flight-0');expect(a.width).toBe(52);expect(a.height).toBe(52);expect(a.originX).toBe(95/128);expect(a.originY).toBe(61/128);expect(a.tint).toBe(0xffffff);}for(const s of fixture.shots)expect(Math.hypot(s.vx,s.vy)).toBeCloseTo(420,8);
 await page.locator('canvas').screenshot({path:dir+'/flight-spawn.png'});await page.evaluate(()=>{const w=window.__PIXEL__!.world;w.projectiles=w.projectiles.slice(0,1);});await advance(page,.05);
 const moved=await page.evaluate(()=>({...window.__PIXEL__!.world.projectiles[0]!}));expect(moved.x-fixture.shots[0]!.x).toBeCloseTo(fixture.shots[0]!.vx*.05,8);expect(moved.y-fixture.shots[0]!.y).toBeCloseTo(fixture.shots[0]!.vy*.05,8);
 await advance(page,.05);await page.locator('canvas').screenshot({path:dir+'/flight.png'});
 const frozen=await page.locator('canvas').screenshot();await page.waitForTimeout(120);expect(await page.locator('canvas').screenshot()).toEqual(frozen);
 await advance(page,.1);expect(await page.evaluate(()=>window.__PIXEL__!.world.player.hp)).toBeCloseTo(fixture.hp-fixture.damage);expect(await page.evaluate(()=>window.__PIXEL__!.world.projectiles.length)).toBe(0);
 art=await page.evaluate(()=>window.__PIXEL__!.art());const hit=art.runeWarden.active.find(v=>v.frame==='rune-ai-impact-0')!;expect(hit.texture).toBe('rune-warden-pixellab-v1');expect(hit.alpha).toBeGreaterThan(0);expect(hit.alpha).toBeLessThan(1);expect(hit.originX).toBe(95/128);await page.locator('canvas').screenshot({path:dir+'/hit-fade.png'});
 await advance(page,.6);expect(await page.evaluate(()=>window.__PIXEL__!.art().runeWarden.active.some(v=>v.frame==='rune-ai-impact-0'))).toBe(false);
 const anchors=await page.evaluate(async()=>{const w=window.__PIXEL__!.world,e=w.bosses[0]!;w.clearHostileThreats();e.boss!.phase='approach';e.boss!.until=Infinity;e.boss!.magic={nextAt:w.elapsed,teleports:0};const path='/src/game/systems/BossMagic.ts',{updateMagicTeleport}=await import(path);w.resume();updateMagicTeleport(w,e);w.pause();const m=e.boss!.magic;return{from:m.from!,to:m.target!,until:e.boss!.until};});
 await expect.poll(()=>page.evaluate(()=>window.__PIXEL__!.art().runeWarden.active.filter(v=>v.frame.startsWith('rune-ai-blink-idle-')).length)).toBe(2);
 art=await page.evaluate(()=>window.__PIXEL__!.art());const marks=art.runeWarden.active.filter(v=>v.frame.startsWith('rune-ai-blink-idle-'));expect(marks.map(v=>[v.x,v.y])).toEqual([[anchors.from.x,anchors.from.y+23],[anchors.to.x,anchors.to.y+23]]);for(const m of marks){expect(m.texture).toBe('rune-warden-pixellab-v1');expect(m.depth).toBeLessThan(art.actors.find(a=>a.texture==='rune-warden-v1')!.depth);}
 await page.locator('canvas').screenshot({path:dir+'/blink-warning.png'});await advance(page,.2);await page.locator('canvas').screenshot({path:dir+'/blink-warning-mid.png'});
 const wait=await page.evaluate(until=>until-window.__PIXEL__!.world.elapsed+.005,anchors.until);await advance(page,wait);
 expect(await page.evaluate(()=>{const e=window.__PIXEL__!.world.bosses[0]!;return{x:e.x,y:e.y};})).toEqual(anchors.to);
 art=await page.evaluate(()=>window.__PIXEL__!.art());expect(art.runeWarden.active.filter(v=>v.frame==='rune-ai-blink-fade-0')).toHaveLength(2);await page.locator('canvas').screenshot({path:dir+'/blink-anchors.png'});
 await advance(page,.15);await page.locator('canvas').screenshot({path:dir+'/blink-fade.png'});await advance(page,.25);expect(await page.evaluate(()=>window.__PIXEL__!.art().runeWarden.active.some(v=>v.frame.startsWith('rune-ai-blink-')))).toBe(false);
 await page.evaluate(()=>{const w=window.__PIXEL__!.world;w.damageEnemy(w.bosses[0]!,1e9);});await advance(page,.01);expect(await page.evaluate(()=>window.__PIXEL__!.art().runeWarden.active)).toEqual([]);
 for(let i=0;i<3;i++){await page.evaluate(()=>window.__PIXEL__!.restartScene());await page.waitForFunction(()=>window.__PIXEL__!.world.status==='menu');const a=await page.evaluate(()=>window.__PIXEL__!.art());expect(a.runeWarden).toMatchObject({active:[],allocated:0});expect(a.clock).toEqual([0,0,0]);expect(a.tweens).toBe(0);expect(a.textureBytes).toBeLessThan(144*1024*1024);expect(await page.evaluate(()=>window.__PIXEL__!.listeners())).toEqual({commands:1,snapshots:1,metrics:1});}
 expect(loads.sort()).toEqual(['/assets/hd/rune-warden-pixellab-v1/atlas.json','/assets/hd/rune-warden-pixellab-v1/atlas.png']);expect(errors).toEqual([]);writeFileSync(dir+'/evidence.json',JSON.stringify({fixture,moved,hit,anchors,marks,loads,errors},null,2));
});
