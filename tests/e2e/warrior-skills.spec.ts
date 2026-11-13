import {test,expect} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';
const directory='screenshots/warrior-skills-runtime-v1';

for(const [direction,keys,x,y,group]of [
 ['south',['s'],0,1,'front'],['north',['w'],0,-1,'north'],['north-west',['w','a'],-1,-1,'north'],
]as const)test(`accepted Warrior skills in real Canvas: ${direction}`,async({page})=>{
 test.setTimeout(90000);mkdirSync(directory,{recursive:true});const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 const evidence=[];
 for(const [skill,ability]of [['cleave','cleave'],['whirlwind','whirlwind'],['stomp','slam'],['block','iron'],['throw','blades'],['charge',null]]as const){
  await page.goto('/?test=1');await page.getByRole('button',{name:/^Warrior/}).click();await page.getByRole('button',{name:'Начать забег'}).click();
  await page.evaluate(()=>{const w=window.__PIXEL__!.world;w.options.spawnRate=0;w.encounterDirector.nextAt=1e6;for(const a of Object.values(w.abilities))a.level=0;});
  for(const key of keys)await page.keyboard.down(key);
  await expect.poll(()=>page.evaluate(()=>window.__PIXEL__!.art().warrior?.direction)).toBe(direction);
  for(const key of keys)await page.keyboard.up(key);
  await page.evaluate(({ability,x,y})=>{const w=window.__PIXEL__!.world;
   const e=w.spawn('tank',{x:w.player.x+x*40,y:w.player.y+y*40})!;e.speed=0;e.damage=0;e.hp=e.maxHp=1e5;
   if(ability){w.abilities[ability].level=1;w.abilities[ability].readyAt=0;}
  },{ability,x,y});
  if(skill==='charge')await page.keyboard.press('Space');
  const id=`${group}-${skill}`;
  await expect.poll(()=>page.evaluate(()=>window.__PIXEL__!.art().warrior?.id),{intervals:[10],timeout:8000}).toBe(id);
  if(skill!=='charge')await expect.poll(()=>page.evaluate(()=>window.__PIXEL__!.art().warrior?.index??-1),{intervals:[10]}).toBeGreaterThanOrEqual(skill==='stomp'?10:4);
  await page.evaluate(()=>window.__PIXEL__!.world.pause());await page.waitForTimeout(35);
  const pose=await page.evaluate(()=>window.__PIXEL__!.art().warrior!);expect(pose.id).toBe(id);expect(pose.flipX).toBe(direction==='north-west');
  const hidden=await page.addStyleTag({content:'.overlay{visibility:hidden!important}'});
  await page.locator('canvas').screenshot({path:`${directory}/${skill}-${direction}-1280.png`});
  await page.waitForTimeout(80);expect(await page.evaluate(()=>window.__PIXEL__!.art().warrior)).toEqual(pose);
  evidence.push({skill,pose,damage:await page.evaluate(()=>window.__PIXEL__!.world.snapshot().damageByAbility)});
  await hidden.evaluate(el=>el.parentNode?.removeChild(el));
 }
 expect(errors).toEqual([]);writeFileSync(`${directory}/${direction}-evidence.json`,JSON.stringify({evidence,errors},null,2));
});

test('mobile Warrior throws a visible physical spear, deals real damage and restarts without extra textures/listeners',async({page})=>{
 mkdirSync(directory,{recursive:true});const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:390,height:844});await page.goto('/?test=1');await page.getByRole('button',{name:/^Warrior/}).click();await page.getByRole('button',{name:'Начать забег'}).click();
 await page.evaluate(()=>{const w=window.__PIXEL__!.world;w.options.spawnRate=0;w.encounterDirector.nextAt=1e6;for(const a of Object.values(w.abilities))a.level=0;w.abilities.blades.level=3;const e=w.spawn('tank',{x:120,y:0})!;e.hp=e.maxHp=1e5;e.speed=e.damage=0;});
 await expect.poll(()=>page.evaluate(()=>window.__PIXEL__!.world.projectiles.some(p=>p.source==='blades')),{intervals:[10]}).toBe(true);
 await page.evaluate(()=>window.__PIXEL__!.world.pause());await page.waitForTimeout(35);
 const hidden=await page.addStyleTag({content:'.overlay{visibility:hidden!important}'});
 await page.locator('canvas').screenshot({path:directory+'/throw-flight-390.png'});await hidden.evaluate(el=>el.parentNode?.removeChild(el));
 const before=await page.evaluate(()=>({listeners:window.__PIXEL__!.listeners(),textures:window.__PIXEL__!.art().textures.filter(t=>!t.startsWith('chunk-'))}));
 await page.evaluate(()=>window.__PIXEL__!.world.resume());
 await expect.poll(()=>page.evaluate(()=>window.__PIXEL__!.world.snapshot().damageByAbility.find(a=>a.id==='blades')!.damage)).toBeGreaterThan(0);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.evaluate(()=>window.__PIXEL__!.restartScene());await expect.poll(()=>page.evaluate(()=>window.__PIXEL__?.world.status)).toBe('menu');
 await page.getByRole('button',{name:/^Warrior/}).click();await page.getByRole('button',{name:'Начать забег'}).click();
 expect(await page.evaluate(()=>window.__PIXEL__!.listeners())).toEqual(before.listeners);
 expect(await page.evaluate(()=>window.__PIXEL__!.art().textures.filter(t=>!t.startsWith('chunk-')))).toEqual(before.textures);
 expect(await page.evaluate(()=>window.__PIXEL__!.world.warrior.pendingSpear)).toBeUndefined();expect(await page.locator('canvas').count()).toBe(1);expect(errors).toEqual([]);
});
