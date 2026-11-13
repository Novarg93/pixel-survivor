import {test,expect} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';
const root='screenshots/warrior-buffs-v4';

for(const [direction,keys,x,y]of [['south',['s'],0,1],['north',['w'],0,-1],['north-west',['w','a'],-1,-1]]as const)
test(`moving Stomp, Block, Throw and Charge; original Whirlwind / ${direction}`,async({page})=>{
 test.setTimeout(60000);mkdirSync(root,{recursive:true});const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));const evidence=[];
 for(const [motion,ability,frame]of [['stomp','slam',8],['block','iron',4],['throw','blades',6],['charge',null,0],['whirlwind','whirlwind',4]]as const){
  await page.goto('/?test=1');await page.getByRole('button',{name:/^Warrior/}).click();await page.getByRole('button',{name:'Начать забег'}).click();
  await page.evaluate(({x,y})=>{const w=window.__PIXEL__!.world;w.options.spawnRate=0;w.encounterDirector.nextAt=Infinity;for(const a of Object.values(w.abilities))a.level=0;const e=w.spawn('tank',{x:x*90,y:y*90})!;e.hp=e.maxHp=1e5;e.speed=e.damage=0;},{x,y});
  for(const key of keys)await page.keyboard.down(key);await expect.poll(()=>page.evaluate(()=>window.__PIXEL__!.art().warrior?.direction)).toBe(direction);
  if(ability){await page.evaluate(ability=>{const w=window.__PIXEL__!.world;w.abilities[ability].level=1;w.abilities[ability].readyAt=0;},ability);await expect.poll(()=>page.evaluate(()=>window.__PIXEL__!.art().warrior?.motion),{intervals:[10]}).toBe(motion);await expect.poll(()=>page.evaluate(()=>window.__PIXEL__!.art().warrior?.index??-1),{intervals:[10]}).toBeGreaterThanOrEqual(frame);await page.evaluate(()=>window.__PIXEL__!.world.pause());}
  else await page.evaluate(({x,y})=>{const w=window.__PIXEL__!.world;w.mobility.activate(w,{x,y});w.pause();},{x,y});
  await page.waitForTimeout(35);const first=await page.evaluate(()=>window.__PIXEL__!.art().warrior!);expect(first.motion).toBe(motion);expect(first.layered).toBe(motion!=='whirlwind');
  const hide=await page.addStyleTag({content:'.overlay{visibility:hidden!important}'});await page.locator('canvas').screenshot({path:`${root}/${motion}-${direction}-a-1280.png`});
  await page.evaluate(({x,y})=>{const w=window.__PIXEL__!.world;w.resume();for(let i=0;i<9;i++)w.step(.01,{x,y});w.pause();},{x,y});await page.waitForTimeout(35);
  const second=await page.evaluate(()=>window.__PIXEL__!.art().warrior!);expect(second.motion).toBe(motion);
  if(motion!=='whirlwind'){expect(second.lowerFrame).not.toBe(first.lowerFrame);expect(second.stride).toBeGreaterThan(first.stride);expect(second.allocated).toBe(1);}else expect(second.layered).toBe(false);
  await page.locator('canvas').screenshot({path:`${root}/${motion}-${direction}-b-1280.png`});await page.waitForTimeout(75);expect(await page.evaluate(()=>window.__PIXEL__!.art().warrior)).toEqual(second);
  for(const key of keys)await page.keyboard.up(key);await hide.evaluate(el=>el.parentNode?.removeChild(el));evidence.push({motion,first,second});
 }
 expect(errors).toEqual([]);writeFileSync(`${root}/moving-${direction}.json`,JSON.stringify({evidence,errors},null,2));
});

test('Shield Block intercepts a swept projectile and shows a separate refreshable Absorb reserve in the HUD',async({page})=>{
 mkdirSync(root,{recursive:true});const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/?test=1');await page.getByRole('button',{name:/^Warrior/}).click();await page.getByRole('button',{name:'Начать забег'}).click();
 await page.evaluate(()=>{const w=window.__PIXEL__!.world;w.options.spawnRate=0;w.encounterDirector.nextAt=Infinity;for(const a of Object.values(w.abilities))a.level=0;w.abilities.iron.level=1;});
 await expect(page.getByRole('progressbar',{name:'Absorb',exact:true})).toHaveAttribute('aria-valuenow','30');
 await page.evaluate(()=>{const w=window.__PIXEL__!.world;w.pause();w.shoot({x:-120,y:0,vx:4800,vy:0,damage:100,hostile:true});w.resume();w.step(.05);w.pause();});
 const blocked=await page.evaluate(()=>{const w=window.__PIXEL__!.world;return {hp:w.player.hp,absorb:w.absorb,projectiles:w.projectiles.length};});expect(blocked).toEqual({hp:150,absorb:30,projectiles:0});
 const hide=await page.addStyleTag({content:'.overlay{visibility:hidden!important}'});await page.locator('canvas').screenshot({path:root+'/shield-projectile-absorbed-1280.png'});
 await page.evaluate(()=>{const w=window.__PIXEL__!.world;w.resume();w.damagePlayer(100);w.pause();});await expect(page.getByRole('progressbar',{name:'Absorb',exact:true})).toHaveCount(0);
 expect(await page.evaluate(()=>window.__PIXEL__!.world.player.hp)).toBeCloseTo(139);
 await hide.evaluate(el=>el.parentNode?.removeChild(el));expect(errors).toEqual([]);writeFileSync(root+'/shield-evidence.json',JSON.stringify({blocked,errors},null,2));
});

test('Banner is selected through three real cards, cast with Q, heals 10% HP/s in its zone and cleans up on restart',async({page})=>{
 mkdirSync(root,{recursive:true});const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/?test=1');await page.getByRole('button',{name:/^Warrior/}).click();await page.getByRole('button',{name:'Начать забег'}).click();
 await page.evaluate(()=>{const w=window.__PIXEL__!.world;w.options.spawnRate=0;w.encounterDirector.nextAt=Infinity;for(const a of Object.values(w.abilities))a.level=0;w.elapsed=300;w.experience.level=29;w.gainXp(w.snapshot().xpNext+1);});
 await expect(page.locator('[data-upgrade]')).toHaveCount(3);await page.screenshot({path:root+'/banner-three-choices-1280.png'});
 await page.locator('[data-upgrade="ultimate-banner"]').click();await expect(page.locator('.ultimate-control')).toContainText('10/10');
 await page.evaluate(()=>{window.__PIXEL__!.world.player.hp=30;});await page.locator('canvas').click();await page.keyboard.press('q');
 await expect.poll(()=>page.evaluate(()=>window.__PIXEL__!.world.ultimate.banner.active(window.__PIXEL__!.world.elapsed))).toBe(true);
 await page.evaluate(()=>window.__PIXEL__!.world.pause());const before=await page.evaluate(()=>{const w=window.__PIXEL__!.world;return {hp:w.player.hp,elapsed:w.elapsed,anchor:{...w.ultimate.banner.origin},listeners:window.__PIXEL__!.listeners()};});
 await page.evaluate(()=>{const w=window.__PIXEL__!.world;w.resume();for(let i=0;i<50;i++)w.step(.02);w.pause();});
 expect((await page.evaluate(()=>window.__PIXEL__!.world.player.hp))-before.hp).toBeCloseTo(15,6);
 await expect.poll(()=>page.evaluate(()=>window.__PIXEL__!.art().ultimate.banner.active)).toBe(true);const hide=await page.addStyleTag({content:'.overlay{visibility:hidden!important}'});
 await page.locator('canvas').screenshot({path:root+'/banner-healing-1280.png'});
 const healingHp=await page.evaluate(()=>window.__PIXEL__!.world.player.hp);
 await page.evaluate(()=>{const w=window.__PIXEL__!.world;w.player.x=w.ultimate.banner.origin.x+161;w.resume();for(let i=0;i<50;i++)w.step(.02);w.pause();});
 expect(await page.evaluate(()=>window.__PIXEL__!.world.player.hp)).toBe(healingHp);expect(await page.evaluate(()=>window.__PIXEL__!.world.ultimate.banner.origin)).toEqual(before.anchor);
 await page.setViewportSize({width:390,height:844});await page.locator('canvas').screenshot({path:root+'/banner-zone-mobile-390.png'});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await hide.evaluate(el=>el.parentNode?.removeChild(el));await page.evaluate(()=>window.__PIXEL__!.restartScene());await expect.poll(()=>page.evaluate(()=>window.__PIXEL__?.world.status)).toBe('menu');
 expect(await page.evaluate(()=>window.__PIXEL__!.world.ultimate.banner.started)).toBe(-Infinity);expect(await page.evaluate(()=>window.__PIXEL__!.world.blockShield.absorb)).toBe(0);expect(await page.evaluate(()=>window.__PIXEL__!.listeners())).toEqual(before.listeners);expect(await page.locator('canvas').count()).toBe(1);expect(errors).toEqual([]);
 writeFileSync(root+'/banner-evidence.json',JSON.stringify({before,healingHp,errors},null,2));
});
