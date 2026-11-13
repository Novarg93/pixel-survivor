import {expect,test} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';

test('Throw starts flying on frame six in front, north and mirrored north-west',async({page})=>{
 test.setTimeout(60000);const root='screenshots/warrior-spear-release-v1';mkdirSync(root,{recursive:true});
 const errors:string[]=[],evidence=[];page.on('pageerror',e=>errors.push(e.message));
 for(const [direction,x,y]of [['south',0,1],['north',0,-1],['north-west',-1,-1]]as const){
  await page.goto('/?test=1');await page.getByRole('button',{name:/^Warrior/}).click();await page.getByRole('button',{name:'Начать забег'}).click();
  await page.evaluate(({x,y})=>{
   const w=window.__PIXEL__!.world,n=Math.hypot(x,y);w.options.spawnRate=0;w.encounterDirector.nextAt=Infinity;
   for(const a of Object.values(w.abilities))a.level=0;
   const e=w.spawn('tank',{x:w.player.x+x/n*200,y:w.player.y+y/n*200})!;e.speed=e.damage=0;e.hp=e.maxHp=1e5;
   w.abilities.blades.level=1;w.abilities.blades.readyAt=0;
  },{x,y});
  await expect.poll(()=>page.evaluate(()=>window.__PIXEL__!.art().warrior?.motion),{intervals:[10]}).toBe('throw');
  await page.evaluate(()=>{const w=window.__PIXEL__!.world;w.abilities.blades.level=0;w.pause();});
  const release=await page.evaluate(()=>window.__PIXEL__!.world.warrior.pendingSpear!.releaseAt);
  await page.evaluate(end=>{const w=window.__PIXEL__!.world;w.resume();while(w.elapsed<end-1e-8)w.step(Math.min(.005,end-w.elapsed));w.pause();},release-.001);
  await expect.poll(()=>page.evaluate(()=>window.__PIXEL__!.art().warrior?.index)).toBe(4);
  expect(await page.evaluate(()=>window.__PIXEL__!.world.projectiles.filter(p=>p.source==='blades').length)).toBe(0);
  await page.addStyleTag({content:'.overlay{visibility:hidden!important}'});
  await page.locator('canvas').screenshot({path:`${root}/${direction}-before.png`});
  await page.evaluate(end=>{const w=window.__PIXEL__!.world;w.resume();w.step(end-w.elapsed);w.pause();},release+.001);
  await expect.poll(()=>page.evaluate(()=>window.__PIXEL__!.art().warrior?.index)).toBe(5);
  const state=await page.evaluate(()=>{const w=window.__PIXEL__!.world;return {pose:window.__PIXEL__!.art().warrior,age:w.elapsed-w.warrior.throwStarted,shots:w.projectiles.filter(p=>p.source==='blades').map(p=>({x:p.x,y:p.y,vx:p.vx,vy:p.vy}))};});
  expect(state.pose?.direction).toBe(direction);expect(state.shots).toHaveLength(1);expect(state.age).toBeCloseTo(.376,6);
  await page.locator('canvas').screenshot({path:`${root}/${direction}-release.png`});evidence.push(state);
 }
 expect(errors).toEqual([]);writeFileSync(`${root}/evidence.json`,JSON.stringify({evidence,errors},null,2));
});
