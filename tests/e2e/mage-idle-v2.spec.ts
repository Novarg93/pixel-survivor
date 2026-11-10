import {test,expect,type Page} from '@playwright/test';
import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
const MAGE_IDLE=JSON.parse(readFileSync('src/game/art/mageIdleManifest.json','utf8')) as typeof import('../../src/game/art/mageIdlePack').MAGE_IDLE;
const root='screenshots/mage-idle-v2';
const directions=[['south',['s']],['south-east',['s','d']],['east',['d']],['west',['a']],['south-west',['s','a']],['north',['w']],['north-west',['w','a']],['north-east',['w','d']]] as const;
async function start(page:Page){
 await page.goto('/?test=1');await page.getByRole('button',{name:'Начать забег'}).click();
 await page.addStyleTag({content:'.overlay{display:none!important}'});
 await page.evaluate(()=>{const w=window.__PIXEL__!.world;w.options.spawnRate=0;w.encounterDirector.nextAt=Infinity;w.enemies=[];for(const a of Object.values(w.abilities))a.level=0;});
}
for(const viewport of [{width:1280,height:720},{width:390,height:844}])test(`user Mage Idle: two views, mirrors, timing, pause and unchanged other actions ${viewport.width}`,async({page})=>{
 test.setTimeout(60000);mkdirSync(root,{recursive:true});const errors:string[]=[],records:unknown[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
 await page.setViewportSize(viewport);await start(page);
 for(const [direction,keys]of directions){
  for(const key of keys)await page.keyboard.down(key);
  await expect.poll(()=>page.evaluate(()=>window.__PIXEL__!.art().casting.pose?.direction),{intervals:[15]}).toBe(direction);
  await expect.poll(()=>page.evaluate(()=>window.__PIXEL__!.art().heroFrame),{intervals:[15]}).toContain('mage-run-v2-');
  for(const key of keys)await page.keyboard.up(key);
  await expect.poll(()=>page.evaluate(()=>window.__PIXEL__!.art().casting.pose?.motion),{intervals:[20]}).toBe('idle');
  await page.evaluate(()=>window.__PIXEL__!.world.pause());
  const art=await page.evaluate(()=>window.__PIXEL__!.art()),pose=art.casting.pose!,hero=art.actors.find(a=>a.texture==='mage-idle-v2')!;
  const body=direction.startsWith('north')?'north':'front',flipX=['west','south-west','north-east'].includes(direction),index=Math.floor((pose.age*1000+1e-7)%1690/130),pivot=MAGE_IDLE.clips[body].pivot;
  expect(art.heroFrame).toBe(`mage-idle-v2-${body}-${index}`);expect(art.casting.idle).toEqual({body,index,flipX});
  expect(hero).toMatchObject({width:MAGE_IDLE.displaySize,height:MAGE_IDLE.displaySize,originX:(flipX?96-pivot.x:pivot.x)/96,originY:pivot.y/96,rotation:0,visible:true});expect(art.casting.bodyCropped).toBe(false);expect(art.casting.layered).toBe(false);
  const frozen=art.heroFrame;await page.waitForTimeout(150);expect(await page.evaluate(()=>window.__PIXEL__!.art().heroFrame)).toBe(frozen);
  if(['south','west','north','north-east'].includes(direction))await page.locator('canvas').screenshot({path:`${root}/${viewport.width}-${direction}.png`});
  records.push({direction,frame:art.heroFrame,idle:art.casting.idle,hero});await page.evaluate(()=>window.__PIXEL__!.world.resume());
 }
 await page.evaluate(()=>window.__PIXEL__!.world.pause());
 for(let i=0;i<13;i++){
  await page.evaluate(i=>{window.__PIXEL__!.world.elapsed=16.9+i*.13+.01;},i);
  await expect.poll(()=>page.evaluate(()=>window.__PIXEL__!.art().casting.idle?.index),{intervals:[15]}).toBe(i);
 }
 await page.evaluate(()=>{window.__PIXEL__!.world.elapsed=18.6;});await expect.poll(()=>page.evaluate(()=>window.__PIXEL__!.art().casting.idle?.index),{intervals:[15]}).toBe(0);
 // A real auto-shot leaves Idle, uses the existing cast and returns to the new Idle.
 await page.evaluate(()=>{const w=window.__PIXEL__!.world;w.resume();const e=w.spawn('tank',{x:w.player.x+100,y:w.player.y})!;e.speed=0;e.hp=e.maxHp=10000;w.abilities.fireball.level=1;w.abilities.fireball.readyAt=0;});
 await expect.poll(()=>page.evaluate(()=>window.__PIXEL__!.art().heroFrame),{intervals:[15]}).toContain('mage-cast-v2-');
 const cast=await page.evaluate(()=>window.__PIXEL__!.art().casting);expect(cast.hands.length).toBeGreaterThan(0);expect(cast.hands.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y))).toBe(true);
 await page.evaluate(()=>{window.__PIXEL__!.world.abilities.fireball.level=0;});await expect.poll(()=>page.evaluate(()=>window.__PIXEL__!.art().heroFrame)).toContain('mage-idle-v2-');
 await page.locator('canvas').screenshot({path:`${root}/${viewport.width}-game.png`});
 await page.evaluate(()=>{const w=window.__PIXEL__!.world;w.player.invulnerableUntil=0;w.damagePlayer(20);});
 await expect.poll(()=>page.evaluate(()=>window.__PIXEL__!.art().casting.mode),{intervals:[10]}).toBe('hurt');expect(await page.evaluate(()=>window.__PIXEL__!.art().heroFrame)).toContain('mage-idle-v2-');
 await page.evaluate(()=>{const w=window.__PIXEL__!.world;w.player.invulnerableUntil=0;w.damagePlayer(99999);});await expect.poll(()=>page.evaluate(()=>window.__PIXEL__!.art().heroFrame)).toContain('-death-');
 expect(errors).toEqual([]);writeFileSync(`${root}/${viewport.width}-evidence.json`,JSON.stringify({records,all13Frames:true,loopWrap:true,pauseFrozen:true,existingCast:true,existingDeath:true,errors},null,2));
});
