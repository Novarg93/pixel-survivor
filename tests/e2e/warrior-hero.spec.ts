import {test,expect} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';
const directory='screenshots/warrior-combat-sync-v2';

test('slash waits for the body swing; Space interrupts it with accepted Charge and never replays the cancelled attack',async({page})=>{
 mkdirSync(directory,{recursive:true});const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/?test=1');await page.getByRole('button',{name:/^Warrior/}).click();await page.getByRole('button',{name:'Начать забег'}).click();
 await page.evaluate(()=>{const w=window.__PIXEL__!.world;w.options.spawnRate=0;w.encounterDirector.nextAt=1e6;const e=w.spawn('tank',{x:40,y:0})!;e.hp=e.maxHp=1e5;e.speed=0;});
 await expect.poll(()=>page.evaluate(()=>window.__PIXEL__!.art().warrior?.motion),{intervals:[10]}).toBe('attack');
 expect(await page.evaluate(()=>window.__PIXEL__!.art().warrior?.slash)).toBeUndefined();
 await expect.poll(()=>page.evaluate(()=>!!window.__PIXEL__!.art().warrior?.slash),{intervals:[10]}).toBe(true);
 await page.evaluate(()=>window.__PIXEL__!.world.pause());await page.waitForTimeout(40);
 const hidden=await page.addStyleTag({content:'.overlay{visibility:hidden!important}'});
 const slash=await page.evaluate(()=>window.__PIXEL__!.art().warrior);expect(slash?.index).toBeGreaterThanOrEqual(6);expect(slash?.duration).toBe(.78);
 await page.locator('canvas').screenshot({path:directory+'/slash-at-sword-contact-1280.png'});
 await hidden.evaluate(el=>el.parentNode?.removeChild(el));await page.evaluate(()=>window.__PIXEL__!.world.resume());await expect(page.getByRole('dialog',{name:'Пауза',exact:true})).toHaveCount(0);await page.locator('canvas').click();await page.keyboard.press('Space');
 await expect.poll(()=>page.evaluate(()=>window.__PIXEL__!.art().warrior?.motion),{intervals:[10]}).toBe('charge');
 await expect.poll(()=>page.evaluate(()=>window.__PIXEL__!.art().warrior?.index??-1),{intervals:[10]}).toBeGreaterThanOrEqual(3);
 await page.evaluate(()=>{const w=window.__PIXEL__!.world;w.abilities.cleave.level=0;w.pause();});await page.waitForTimeout(30);
 const charge=await page.evaluate(()=>window.__PIXEL__!.art().warrior);expect(charge).toMatchObject({id:'front-charge',pending:false});expect(charge?.slash).toBeUndefined();
 const hiddenCharge=await page.addStyleTag({content:'.overlay{visibility:hidden!important}'});
 await page.locator('canvas').screenshot({path:directory+'/charge-cancels-attack-1280.png'});
 await page.waitForTimeout(100);expect(await page.evaluate(()=>window.__PIXEL__!.art().warrior)).toEqual(charge);
 await hiddenCharge.evaluate(el=>el.parentNode?.removeChild(el));await page.evaluate(()=>window.__PIXEL__!.world.resume());await page.waitForTimeout(400);
 expect(await page.evaluate(()=>window.__PIXEL__!.art().warrior?.motion)).toBe('idle');expect(await page.evaluate(()=>window.__PIXEL__!.art().warrior?.slash)).toBeUndefined();
 writeFileSync(directory+'/interrupt-evidence.json',JSON.stringify({slash,charge,errors},null,2));expect(errors).toEqual([]);
});

test('public Warrior uses accepted locomotion in eight projections, freezes and restarts cleanly',async({page})=>{
 mkdirSync(directory,{recursive:true});const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/?test=1');await page.getByRole('button',{name:/^Warrior/}).click();await expect(page.getByRole('button',{name:/^Warrior/})).toHaveAttribute('aria-pressed','true');
 await page.getByRole('button',{name:'Начать забег'}).click();await expect(page.locator('.hero-name')).toContainText('WARRIOR');
 await page.evaluate(()=>{const w=window.__PIXEL__!.world;w.options.spawnRate=0;w.encounterDirector.nextAt=1e6;});
 await expect.poll(()=>page.evaluate(()=>window.__PIXEL__!.art().warrior?.motion)).toBe('idle');
 await page.locator('canvas').screenshot({path:directory+'/idle-south-1280.png'});
 const routes=[['s','south'],['s,d','south-east'],['d','east'],['w,d','north-east'],['w','north'],['w,a','north-west'],['a','west'],['s,a','south-west']] as const;
 for(const [keys,direction]of routes){
  for(const key of keys.split(','))await page.keyboard.down(key);
  await expect.poll(()=>page.evaluate(()=>window.__PIXEL__!.art().warrior?.direction)).toBe(direction);
  await expect.poll(()=>page.evaluate(()=>window.__PIXEL__!.art().warrior?.motion)).toBe('run');
  await page.locator('canvas').screenshot({path:`${directory}/run-${direction}-1280.png`});
  for(const key of keys.split(','))await page.keyboard.up(key);
  await expect.poll(()=>page.evaluate(()=>window.__PIXEL__!.art().warrior?.motion)).toBe('idle');
 }
 await page.getByRole('button',{name:'Пауза',exact:true}).click();
 const before=await page.evaluate(()=>({pose:window.__PIXEL__!.art().warrior,listeners:window.__PIXEL__!.listeners(),textures:window.__PIXEL__!.art().textures}));
 await page.waitForTimeout(180);expect(await page.evaluate(()=>window.__PIXEL__!.art().warrior)).toEqual(before.pose);
 await page.evaluate(()=>window.__PIXEL__!.restartScene());await expect.poll(()=>page.evaluate(()=>window.__PIXEL__!.world.status)).toBe('menu');
 await page.getByRole('button',{name:/^Warrior/}).click();await page.getByRole('button',{name:'Начать забег'}).click();
 expect(await page.evaluate(()=>window.__PIXEL__!.listeners())).toEqual(before.listeners);
 expect((await page.evaluate(()=>window.__PIXEL__!.art().textures)).filter(t=>!t.startsWith('chunk-'))).toEqual(before.textures.filter(t=>!t.startsWith('chunk-')));
 expect(await page.evaluate(()=>window.__PIXEL__!.art().chunks)).toBeLessThanOrEqual(81);
 expect(await page.locator('canvas').count()).toBe(1);expect(await page.evaluate(()=>window.__PIXEL__!.art().warrior?.pending)).toBe(false);expect(errors).toEqual([]);
});

test('real automatic Cleave plays all three accepted swings, full frame tails, damage and northern mirror',async({page})=>{
 mkdirSync(directory,{recursive:true});const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/?test=1');await page.getByRole('button',{name:/^Warrior/}).click();await page.getByRole('button',{name:'Начать забег'}).click();
 await page.evaluate(()=>{
  const w=window.__PIXEL__!.world;w.options.spawnRate=0;w.encounterDirector.nextAt=1e6;
  const e=w.spawn('tank',{x:-40,y:-40})!;e.hp=e.maxHp=100000;e.speed=0;
 });
 const samples=[];
 for(const [variant,last]of [['c1',12],['c3',12],['heavy',16]]as const){
  await expect.poll(()=>page.evaluate(()=>window.__PIXEL__!.art().warrior?.variant),{intervals:[10],timeout:6000}).toBe(variant);
  await expect.poll(()=>page.evaluate(()=>window.__PIXEL__!.art().warrior?.index),{intervals:[10]}).toBeGreaterThanOrEqual(5);
  const v=await page.evaluate(()=>window.__PIXEL__!.art().warrior!);expect(v.direction).toBe('north-west');expect(v.flipX).toBe(true);expect(v.id).toBe('north-'+variant);
  samples.push(v);await page.locator('canvas').screenshot({path:`${directory}/attack-${variant}-north-west-1280.png`});
  await expect.poll(()=>page.evaluate(variant=>{const v=window.__PIXEL__!.art().warrior;return v?.variant===variant?v.index:-1;},variant),{intervals:[10]}).toBe(last);
 }
 const damage=await page.evaluate(()=>window.__PIXEL__!.world.snapshot().damageByAbility.find(d=>d.id==='cleave')!.damage);expect(damage).toBeGreaterThanOrEqual(102);
 await page.setViewportSize({width:390,height:844});await page.locator('canvas').screenshot({path:directory+'/attack-mobile-390.png'});
 await page.getByRole('button',{name:'Пауза',exact:true}).click();const frozen=await page.evaluate(()=>window.__PIXEL__!.art().warrior);await page.waitForTimeout(150);expect(await page.evaluate(()=>window.__PIXEL__!.art().warrior)).toEqual(frozen);
 writeFileSync(directory+'/evidence.json',JSON.stringify({samples,damage,errors},null,2));expect(errors).toEqual([]);
});
