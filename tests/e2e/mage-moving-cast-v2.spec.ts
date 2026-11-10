import {test,expect} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';
for(const viewport of [{width:1280,height:720},{width:390,height:844}])test(`layered Mage legs follow live speed without restarting the cast ${viewport.width}`,async({page})=>{
 test.setTimeout(30000);const dir='screenshots/mage-moving-cast-v2/'+viewport.width;mkdirSync(dir,{recursive:true});const errors:string[]=[],rates:unknown[]=[],frames:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize(viewport);await page.goto('/?test=1');await page.getByRole('button',{name:'Начать забег'}).click();await page.addStyleTag({content:'.overlay{display:none!important}'});
 await page.evaluate(()=>{const w=window.__PIXEL__!.world;w.options.spawnRate=0;w.encounterDirector.nextAt=Infinity;w.enemies=[];for(const a of Object.values(w.abilities))a.level=0;});
 await page.keyboard.down('d');await page.waitForFunction(()=>window.__PIXEL__!.art().casting.pose?.motion==='run'&&(window.__PIXEL__!.art().casting.pose?.age??0)>.2);
 await page.evaluate(()=>{const w=window.__PIXEL__!.world;const e=w.spawn('tank',{x:w.player.x-50,y:w.player.y})!;e.speed=0;e.hp=e.maxHp=1e7;w.abilities.meteor.level=5;w.abilities.meteor.readyAt=0;});
 await page.waitForFunction(()=>window.__PIXEL__!.art().casting.layered);await page.evaluate(()=>{window.__PIXEL__!.world.abilities.meteor.level=0;});
 const start=await page.evaluate(()=>window.__PIXEL__!.art().casting.pose!);
 for(const speed of [135,270,67.5,202.5]){
  const sample=await page.evaluate(async speed=>{
   const w=window.__PIXEL__!.world;w.player.speed=speed;const before=window.__PIXEL__!.art().casting,at=w.elapsed,rows:{lower:string;upper:string;age:number;castAge:number}[]=[];
   await new Promise<void>((resolve,reject)=>{const deadline=performance.now()+2000,tick=()=>{const a=window.__PIXEL__!.art().casting;if(!a.pose?.walk||!a.layered){reject(Error('Cast stopped during rate sample: '+JSON.stringify({status:w.status,pose:a.pose})));return;}rows.push({lower:a.lowerFrame,upper:a.upperFrame,age:a.pose.walk.age,castAge:a.pose.age});if(w.elapsed-at>=.1)resolve();else if(performance.now()>deadline)reject(Error('Simulation clock stalled: '+w.status));else requestAnimationFrame(tick);};requestAnimationFrame(tick);});
   const after=window.__PIXEL__!.art().casting;return{before,after,seconds:w.elapsed-at,rows};
  },speed);
  expect(sample.after.pose!.walk!.age-sample.before.pose!.walk!.age).toBeCloseTo(sample.seconds*speed/135,6);expect(sample.after.pose!.age-sample.before.pose!.age).toBeCloseTo(sample.seconds,6);
  expect(sample.after.pose?.castVariant).toBe(start.castVariant);expect(sample.after.layered).toBe(true);expect(sample.after.lowerFrame).toContain('mage-run-v2-');expect(sample.after.upperFrame).toContain('mage-cast-v2-');
  frames.push(...sample.rows.map(r=>r.lower));rates.push({speed,seconds:sample.seconds,walkDelta:sample.after.pose!.walk!.age-sample.before.pose!.walk!.age});
 }
 expect(new Set(frames).size).toBeGreaterThanOrEqual(4);
 await page.evaluate(()=>window.__PIXEL__!.world.pause());await page.waitForTimeout(35);const frozen=await page.evaluate(()=>window.__PIXEL__!.art().casting);await page.waitForTimeout(160);expect(await page.evaluate(()=>window.__PIXEL__!.art().casting)).toEqual(frozen);
 await page.locator('canvas').screenshot({path:dir+'/walking-cast.png'});expect(frozen.allocated).toBe(1);expect(frozen.bodyCropped).toBe(true);
 await page.keyboard.up('d');await page.evaluate(()=>window.__PIXEL__!.world.resume());await page.waitForFunction(()=>!window.__PIXEL__!.art().casting.layered);expect(await page.evaluate(()=>window.__PIXEL__!.art().casting.bodyCropped)).toBe(false);
 expect(errors).toEqual([]);writeFileSync(dir+'/speed-evidence.json',JSON.stringify({rates,frames:[...new Set(frames)],frozen,errors},null,2));
});
