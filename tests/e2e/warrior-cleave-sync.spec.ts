import {test,expect} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';
const root='screenshots/warrior-cleave-sync-v3';

test('a lethal Cleave winds up before HP, death, score and XP change; the contact frame owns the hit',async({page})=>{
 mkdirSync(root,{recursive:true});const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/?test=1');await page.getByRole('button',{name:/^Warrior/}).click();await page.getByRole('button',{name:'Начать забег'}).click();
 await page.evaluate(()=>{const w=window.__PIXEL__!.world;w.options.spawnRate=0;w.encounterDirector.nextAt=Infinity;const e=w.spawn('grunt',{x:50,y:0})!;e.hp=e.maxHp=1;e.speed=e.damage=0;});
 await expect.poll(()=>page.evaluate(()=>!!window.__PIXEL__!.world.warrior.cleave),{intervals:[10]}).toBe(true);
 await page.evaluate(()=>window.__PIXEL__!.world.pause());await page.waitForTimeout(35);
 const windup=await page.evaluate(()=>{const w=window.__PIXEL__!.world;return {swing:w.warrior.cleave!,hp:w.enemies[0]!.hp,kills:w.kills,pose:window.__PIXEL__!.art().warrior};});
 expect(windup.hp).toBe(1);expect(windup.kills).toBe(0);expect(windup.pose).toMatchObject({motion:'attack',pending:false});
 const hide=await page.addStyleTag({content:'.overlay{visibility:hidden!important}'});
 await page.locator('canvas').screenshot({path:root+'/before-contact-1280.png'});
 await page.evaluate(()=>{const w=window.__PIXEL__!.world,at=w.warrior.cleave!.hitAt;w.resume();while(w.elapsed<at-1e-5)w.step(Math.min(.01,at-1e-5-w.elapsed));w.pause();});
 await page.waitForTimeout(35);expect(await page.evaluate(()=>window.__PIXEL__!.world.kills)).toBe(0);
 await page.locator('canvas').screenshot({path:root+'/last-windup-1280.png'});
 await page.evaluate(()=>{const w=window.__PIXEL__!.world;w.resume();w.step(.00002);w.pause();});await page.waitForTimeout(35);
 const contact=await page.evaluate(()=>({kills:window.__PIXEL__!.world.kills,swing:window.__PIXEL__!.world.warrior.cleave,pose:window.__PIXEL__!.art().warrior,orbs:window.__PIXEL__!.world.orbs.length}));
 expect(contact.kills).toBe(1);expect(contact.swing?.hit).toBe(true);expect(contact.pose).toMatchObject({motion:'attack',id:windup.pose!.id});expect(contact.pose!.index).toBeGreaterThan(windup.pose!.index);
 await page.locator('canvas').screenshot({path:root+'/lethal-contact-1280.png'});
 await hide.evaluate(el=>el.parentNode?.removeChild(el));expect(errors).toEqual([]);writeFileSync(root+'/contact-evidence.json',JSON.stringify({windup,contact,errors},null,2));
});

for(const [direction,keys,x,y]of [['south',['s'],0,1],['south-east',['s','d'],1,1],['east',['d'],1,0],['north-east',['w','d'],1,-1],['north',['w'],0,-1],['north-west',['w','a'],-1,-1],['west',['a'],-1,0],['south-west',['s','a'],-1,1]]as const)
test(`running legs continue during Cleave / ${direction}`,async({page})=>{
 mkdirSync(root,{recursive:true});const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/?test=1');await page.getByRole('button',{name:/^Warrior/}).click();await page.getByRole('button',{name:'Начать забег'}).click();
 await page.evaluate(({x,y})=>{const w=window.__PIXEL__!.world;w.options.spawnRate=0;w.encounterDirector.nextAt=Infinity;for(const a of Object.values(w.abilities))a.level=0;const e=w.spawn('tank',{x:x*45,y:y*45})!;e.hp=e.maxHp=1e5;e.speed=e.damage=0;},{x,y});
 for(const key of keys)await page.keyboard.down(key);
 await expect.poll(()=>page.evaluate(()=>window.__PIXEL__!.art().warrior?.direction)).toBe(direction);
 await page.evaluate(()=>{window.__PIXEL__!.world.abilities.cleave.level=1;});
 await expect.poll(()=>page.evaluate(()=>window.__PIXEL__!.art().warrior?.layered),{intervals:[10]}).toBe(true);
 await page.evaluate(()=>window.__PIXEL__!.world.pause());await page.waitForTimeout(35);
 const hide=await page.addStyleTag({content:'.overlay{visibility:hidden!important}'});
 const first=await page.evaluate(()=>window.__PIXEL__!.art().warrior!);await page.locator('canvas').screenshot({path:`${root}/moving-${direction}-a-1280.png`});
 await page.evaluate(({x,y})=>{const w=window.__PIXEL__!.world;w.resume();for(let i=0;i<9;i++)w.step(.01,{x,y});w.pause();},{x,y});await page.waitForTimeout(35);
 const second=await page.evaluate(()=>window.__PIXEL__!.art().warrior!);
 expect(second.motion).toBe('attack');expect(second.layered).toBe(true);expect(second.lowerFrame).not.toBe(first.lowerFrame);expect(second.stride).toBeGreaterThan(first.stride);expect(second.allocated).toBe(1);expect(second.pending).toBe(false);
 await page.locator('canvas').screenshot({path:`${root}/moving-${direction}-b-1280.png`});await page.waitForTimeout(80);expect(await page.evaluate(()=>window.__PIXEL__!.art().warrior)).toEqual(second);
 for(const key of keys)await page.keyboard.up(key);await hide.evaluate(el=>el.parentNode?.removeChild(el));expect(errors).toEqual([]);
 writeFileSync(`${root}/moving-${direction}.json`,JSON.stringify({first,second,errors},null,2));
});

for(const [direction,keys,x,y]of [['south',['s'],0,1],['north',['w'],0,-1],['north-west',['w','a'],-1,-1]]as const)
test(`all moving Cleave variants retain weapons at contact and clean up / ${direction}`,async({page})=>{
 test.setTimeout(60000);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));mkdirSync(root,{recursive:true});
 for(const [sequence,variant]of ['c1','c3','heavy','skill'].entries()){
  await page.goto('/?test=1');await page.getByRole('button',{name:/^Warrior/}).click();await page.getByRole('button',{name:'Начать забег'}).click();
  await page.evaluate(({x,y,sequence})=>{const w=window.__PIXEL__!.world;w.options.spawnRate=0;w.encounterDirector.nextAt=Infinity;for(const a of Object.values(w.abilities))a.level=0;w.warrior.cleaveSequence=sequence;const e=w.spawn('tank',{x:x*45,y:y*45})!;e.hp=e.maxHp=1e5;e.speed=e.damage=0;},{x,y,sequence});
  for(const key of keys)await page.keyboard.down(key);
  await expect.poll(()=>page.evaluate(()=>window.__PIXEL__!.art().warrior?.direction)).toBe(direction);
  await page.evaluate(()=>{window.__PIXEL__!.world.abilities.cleave.level=1;});
  await expect.poll(()=>page.evaluate(()=>window.__PIXEL__!.art().warrior?.layered),{intervals:[10]}).toBe(true);
  await page.evaluate(({x,y})=>{const w=window.__PIXEL__!.world;w.pause();const at=w.warrior.cleave!.hitAt+.035;w.resume();while(w.elapsed<at)w.step(Math.min(.01,at-w.elapsed),{x,y});w.pause();},{x,y});await page.waitForTimeout(35);
  const pose=await page.evaluate(()=>window.__PIXEL__!.art().warrior!);expect(pose).toMatchObject({motion:'attack',variant,layered:true,allocated:1});
  const hidden=await page.addStyleTag({content:'.overlay{visibility:hidden!important}'});await page.locator('canvas').screenshot({path:`${root}/contact-${direction}-${variant}-1280.png`});
  if(variant==='skill'){await page.setViewportSize({width:390,height:844});await page.locator('canvas').screenshot({path:`${root}/contact-${direction}-skill-390.png`});}
  await hidden.evaluate(el=>el.parentNode?.removeChild(el));for(const key of keys)await page.keyboard.up(key);
  const before=await page.evaluate(()=>({listeners:window.__PIXEL__!.listeners(),textures:window.__PIXEL__!.art().textures.filter(t=>!t.startsWith('chunk-'))}));
  await page.evaluate(()=>window.__PIXEL__!.restartScene());await expect.poll(()=>page.evaluate(()=>window.__PIXEL__?.world.status)).toBe('menu');
  await page.getByRole('button',{name:/^Warrior/}).click();await page.getByRole('button',{name:'Начать забег'}).click();
  expect(await page.evaluate(()=>window.__PIXEL__!.listeners())).toEqual(before.listeners);
  expect(await page.evaluate(()=>window.__PIXEL__!.art().textures.filter(t=>!t.startsWith('chunk-')))).toEqual(before.textures);
  expect(await page.evaluate(()=>window.__PIXEL__!.art().warrior?.allocated)).toBe(0);expect(await page.evaluate(()=>window.__PIXEL__!.world.warrior.cleave)).toBeUndefined();
 }
 expect(errors).toEqual([]);
});
