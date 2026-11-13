import {expect,test} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';

const root='screenshots/warrior-empty-hand-runtime-v1';
const directions=[['south',0,1],['north',0,-1],['north-east',1,-1],['north-west',-1,-1]] as const;
test('empty handed Throw and Ruin render in front and all northern routes with real damage and clean restart',async({page})=>{
 test.setTimeout(90000);mkdirSync(root,{recursive:true});const errors:string[]=[],evidence=[];
 page.on('pageerror',e=>errors.push(e.message));
 for(const kind of ['throw','ruin'] as const)for(const [direction,x,y] of directions){
  await page.goto('/?test=1');await page.getByRole('button',{name:/^Warrior/}).click();await page.getByRole('button',{name:'Начать забег'}).click();
  await page.evaluate(({kind,x,y})=>{
   const w=window.__PIXEL__!.world,n=Math.hypot(x,y);w.options.spawnRate=0;w.encounterDirector.nextAt=Infinity;
   for(const a of Object.values(w.abilities))a.level=0;
   w.facing={x:x/n,y:y/n};w.player.invulnerableUntil=Infinity;
   const e=w.spawn('tank',{x:w.player.x+w.facing.x*55,y:w.player.y+w.facing.y*55})!;e.hp=e.maxHp=1e5;e.speed=e.damage=0;
   if(kind==='ruin'){w.elapsed=300;w.experience.level=30;w.ultimate.choose(w,'ruin');}
   else{w.abilities.blades.level=1;w.abilities.blades.readyAt=0;}
  },{kind,x,y});
  if(kind==='ruin')await page.locator('.ultimate-control').click();
  await expect.poll(()=>page.evaluate(()=>window.__PIXEL__!.art().warrior?.motion),{intervals:[10]}).toBe(kind==='ruin'?'ultimate-ruin':'throw');
  await page.evaluate(()=>{const w=window.__PIXEL__!.world;w.abilities.blades.level=0;w.pause();});
  await page.evaluate(kind=>{
   const w=window.__PIXEL__!.world,start=kind==='ruin'?w.ultimate.started:w.warrior.throwStarted;
   w.resume();while(w.elapsed<start+.88-1e-7)w.step(Math.min(.01,start+.88-w.elapsed));w.pause();
  },kind);
  await expect.poll(()=>page.evaluate(()=>window.__PIXEL__!.art().warrior?.index)).toBeGreaterThanOrEqual(9);
  const pose=await page.evaluate(()=>window.__PIXEL__!.art().warrior!);
  expect(pose.direction).toBe(direction);expect(pose.flipX).toBe(direction==='north-west');
  expect(pose.id).toBe(direction.startsWith('north')?'north-throw':kind==='ruin'?'gesture-ruin':'front-throw');
  const damage=await page.evaluate(kind=>{const s=window.__PIXEL__!.world.snapshot();return kind==='ruin'?s.ultimateDamage?.ruin??0:s.damageByAbility.find(a=>a.id==='blades')?.damage??0;},kind);
  expect(damage).toBeGreaterThan(0);
  await page.addStyleTag({content:'.overlay{visibility:hidden!important}'});
  await page.locator('canvas').screenshot({path:`${root}/${kind}-${direction}.png`});
  evidence.push({kind,direction,pose,damage});
 }
 await page.setViewportSize({width:390,height:844});await page.locator('canvas').screenshot({path:`${root}/ruin-north-west-390.png`});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 const listeners=await page.evaluate(()=>window.__PIXEL__!.listeners());
 await page.evaluate(()=>window.__PIXEL__!.restartScene());await expect.poll(()=>page.evaluate(()=>window.__PIXEL__?.world.status)).toBe('menu');
 expect(await page.evaluate(()=>window.__PIXEL__!.listeners())).toEqual(listeners);expect(await page.locator('canvas').count()).toBe(1);
 expect(errors).toEqual([]);writeFileSync(`${root}/evidence.json`,JSON.stringify({evidence,errors},null,2));
});
