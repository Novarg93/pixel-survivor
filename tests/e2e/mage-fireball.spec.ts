import {expect,test,type Page} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';
async function advance(page:Page,seconds:number){await page.evaluate(seconds=>{const w=window.__PIXEL__!.world;w.resume();for(let t=0;t<seconds-1e-8;t+=.01)w.step(Math.min(.01,seconds-t));w.pause();},seconds);await page.waitForTimeout(65);}
for(const rank of [1,5])for(const viewport of [{width:1280,height:720},{width:844,height:390}])test(`Mage Fireball forming, flight, collision, fixed size and cleanup rank${rank} ${viewport.width}`,async({page})=>{
  const directory=`screenshots/mage-fireball-pixellab-v1/rank-${rank}-${viewport.width}`;mkdirSync(directory,{recursive:true});const errors:string[]=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'||m.type()==='warning'&&/Texture|Frame/.test(m.text()))errors.push(m.text());});page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
  await page.setViewportSize(viewport);await page.goto('/?test=1');await page.getByRole('button',{name:'Начать забег'}).click();await page.addStyleTag({content:'.overlay{display:none!important}'});
  await page.evaluate(async rank=>{const w=window.__PIXEL__!.world;w.pause();w.elapsed=rank===5?915:20;w.options.spawnRate=0;w.encounterDirector.nextAt=Infinity;w.experience.level=30;w.enemies=[];w.clearTemporaryState();for(const a of Object.values(w.abilities))a.level=0;w.abilities.fireball.level=rank;w.abilities.fireball.readyAt=Infinity;w.upgrades.damage=rank===5?3:0;w.player.invulnerableUntil=Infinity;const e=w.spawn('tank',{x:180,y:0})!;e.speed=0;e.hp=e.maxHp=1e5;const path='/src/game/abilities/fireball.ts';const {fireball}=await import(path);fireball(w);},rank);
  const art=()=>page.evaluate(()=>window.__PIXEL__!.art()),shots=()=>page.evaluate(()=>window.__PIXEL__!.art().actors.filter(a=>a.texture==='mage-fireball-pixellab-v1'));
  const records:{name:string;frames:string[];impacts:string[]}[]=[];
  const shot=async(name:string)=>{await page.locator('canvas').screenshot({path:`${directory}/${name}.png`});const a=await art();records.push({name,frames:(await shots()).map(s=>String(s.frame)),impacts:a.fireball.active.map(v=>v.frame)});};
  await page.waitForTimeout(65);expect((await shots()).every(s=>s.frame==='fireball-forming-0'&&s.width===64&&s.height===64&&s.visible&&s.originX===77/128&&s.originY===61/128)).toBe(true);await shot('forming-start');
  await advance(page,.07);expect((await shots()).every(s=>s.frame==='fireball-forming-0')).toBe(true);await shot('forming-spark');
  await advance(page,.07);expect((await shots()).every(s=>s.frame==='fireball-forming-1')).toBe(true);await shot('forming-growth');
  await advance(page,.059);expect((await shots()).every(s=>s.frame==='fireball-forming-1')).toBe(true);await shot('forming-full');
  await advance(page,.002);expect((await shots()).every(s=>s.frame==='fireball-idle-0')).toBe(true);await shot('flight-start');
  if(viewport.width===844){await page.setViewportSize({width:390,height:844});await page.waitForTimeout(65);await shot('portrait-flight');await page.setViewportSize(viewport);}
  await advance(page,.25);await shot('flight');expect((await shots()).every(s=>s.width===64&&s.height===64&&s.visible)).toBe(true);
  const hp=await page.evaluate(()=>window.__PIXEL__!.world.enemies[0]!.hp);await advance(page,.2);
  expect(await page.evaluate(()=>window.__PIXEL__!.world.enemies[0]!.hp)).toBeLessThan(hp);expect((await art()).fireball.active.length).toBeGreaterThan(0);await shot('collision');
  const paused=JSON.stringify((await art()).fireball.active);await page.waitForTimeout(100);expect(JSON.stringify((await art()).fireball.active)).toBe(paused);
  await advance(page,.08);expect((await art()).fireball.active.length).toBeGreaterThan(0);expect((await art()).fireball.active.every(v=>v.frame.startsWith('fireball-explosion-'))).toBe(true);await shot('collision-embers');await advance(page,.6);expect((await art()).fireball.active).toEqual([]);await shot('collision-cleared');
  // The source anchor tracks velocity through both reverse and vertical travel.
  for(const direction of [{x:-1,y:0},{x:0,y:1}]){
    await page.evaluate(d=>{const w=window.__PIXEL__!.world;w.clearTemporaryState();w.enemies=[];w.shoot({x:0,y:0,vx:d.x*270,vy:d.y*270,hostile:false,source:'fireball',damage:1});},direction);await advance(page,.3);
    const delta=(await shots())[0]!.rotation-Math.atan2(direction.y,direction.x);expect(Math.atan2(Math.sin(delta),Math.cos(delta))).toBeCloseTo(0);await shot(direction.x?'flight-left':'flight-down');
  }
  await page.evaluate(()=>window.__PIXEL__!.restartScene());await page.waitForFunction(()=>window.__PIXEL__?.world.status==='menu');expect((await art()).fireball.allocated).toBe(0);await expect(page.locator('canvas')).toHaveCount(1);expect((await art()).clock).toEqual([0,0,0]);expect(errors).toEqual([]);
  writeFileSync(`${directory}/evidence.json`,JSON.stringify({rank,viewport,records,errors},null,2));
});
