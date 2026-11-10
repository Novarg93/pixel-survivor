import {test,expect,type Page} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';

const directions=[{id:'south',x:0,y:1},{id:'south-east',x:1,y:1},{id:'east',x:1,y:0},{id:'north-east',x:1,y:-1},{id:'north',x:0,y:-1},{id:'north-west',x:-1,y:-1},{id:'west',x:-1,y:0},{id:'south-west',x:-1,y:1}];
async function blink(page:Page,direction:{x:number;y:number}){
 return page.evaluate(async direction=>{
  const api=window.__PIXEL__!,w=api.world;w.resume();w.player.x=w.player.y=0;w.mobility.readyAt=0;const before={...w.player};if(!w.mobility.activate(w,direction))throw Error('Blink failed');
  await new Promise<void>((resolve,reject)=>{const start=performance.now(),sample=()=>{const c=api.art().casting;if(c.pose?.castAbility==='blink'&&c.active?.started===w.mobility.started){w.pause();resolve();}else if(performance.now()-start>1000)reject(Error('Blink gesture not observed: '+JSON.stringify({status:w.status,elapsed:w.elapsed,started:w.mobility.started,casting:c})));else requestAnimationFrame(sample);};requestAnimationFrame(sample);});
  return{before,after:{...w.player},from:{...w.mobility.from},to:{...w.mobility.to},distance:w.mobility.distance,started:w.mobility.started,art:api.art()};
 },direction);
}
async function seek(page:Page,seconds:number){await page.evaluate(seconds=>{const w=window.__PIXEL__!.world;w.elapsed=w.mobility.started+seconds;},seconds);await page.waitForFunction(seconds=>Math.abs((window.__PIXEL__!.art().casting.pose?.age??-1)-seconds)<1e-6,seconds);}
for(const width of [1280,390])test(`PixelLab Blink and directional casting in real Canvas, normal/burning Grove and eight directions ${width}`,async({page})=>{
 test.setTimeout(90000);const root=`screenshots/mage-blink-v1/game/${width}`;mkdirSync(root,{recursive:true});const errors:string[]=[],requests:string[]=[],records:unknown[]=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('request',r=>{if(r.url().includes('/assets/hd/mage-blink-v1/'))requests.push(r.url());});page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
 await page.setViewportSize({width,height:width===390?844:720});await page.goto('/?test=1');await page.getByRole('button',{name:'Начать забег'}).click();await page.addStyleTag({content:'.overlay{display:none!important}'});
 for(const phase of [{id:'normal',time:0},{id:'burning',time:1170.08}]){
  const biome=phase.id;
  await page.evaluate(async phase=>{const path='/src/game/events/bridge.ts',{commands}=await import(path);commands.emit({type:'restart',character:'mage',biome:'grove'});const api=window.__PIXEL__!,w=api.world;api.setVisualTime(phase.time);w.options.spawnRate=0;w.encounterDirector.nextAt=Infinity;w.enemies=[];w.player.invulnerableUntil=Infinity;for(const a of Object.values(w.abilities))a.level=0;},phase);
  await page.waitForFunction(()=>window.__PIXEL__!.art().casting.pose?.motion==='idle');
  for(const d of directions){
   const result=await blink(page,d);expect(result.after.x).toBe(result.to.x);expect(result.after.y).toBe(result.to.y);expect(Math.hypot(result.to.x-result.from.x,result.to.y-result.from.y)).toBeCloseTo(result.distance);expect(result.art.blink.active).toHaveLength(4);expect(result.art.casting.pose).toMatchObject({castAbility:'blink',direction:d.id});
   await seek(page,.12);const art=await page.evaluate(()=>window.__PIXEL__!.art());expect(art.casting.pose).toMatchObject({castAbility:'blink',direction:d.id});expect(art.casting.authoredCast?.index).toBe(4);expect(art.blink.active.every(v=>v.index===3)).toBe(true);expect(art.blink.active.filter(v=>v.endpoint==='arrival').every(v=>v.x===result.to.x&&v.y===result.to.y)).toBe(true);expect(art.blink.active.map(v=>v.depth)).toEqual([9.99,10.02,9.99,10.02]);
   await page.screenshot({path:`${root}/${biome}-${d.id}.png`});records.push({biome,direction:d.id,distance:result.distance,blink:art.blink,cast:art.casting.authoredCast,pose:art.casting.pose});
  }
  await page.evaluate(()=>{const w=window.__PIXEL__!.world,p=w.player;for(let i=0;i<12;i++)w.spawn((['grunt','runner','tank','caster'] as const)[i%4]!,{x:p.x+Math.cos(i)*40,y:p.y+Math.sin(i)*32});for(const [i,kind]of (['charger','sorcerer','eclipse'] as const).entries())w.spawn(kind,{x:p.x+(i-1)*60,y:p.y+65});w.spawn('guardian',{x:p.x-80,y:p.y-30});});
  await expect(page.locator('.boss-bar')).toHaveCount(1);await page.screenshot({path:`${root}/${biome}-mixed-encounter.png`});
  const frozen=await page.evaluate(()=>({elapsed:window.__PIXEL__!.world.elapsed,blink:window.__PIXEL__!.art().blink,pose:window.__PIXEL__!.art().casting.pose}));await page.waitForTimeout(130);expect(await page.evaluate(()=>({elapsed:window.__PIXEL__!.world.elapsed,blink:window.__PIXEL__!.art().blink,pose:window.__PIXEL__!.art().casting.pose}))).toEqual(frozen);
  await page.evaluate(()=>{const w=window.__PIXEL__!.world;w.player.x+=40;w.player.y+=10;});await page.waitForTimeout(30);expect(await page.evaluate(()=>window.__PIXEL__!.art().blink)).toEqual(frozen.blink);
  await seek(page,.28);expect(await page.evaluate(()=>window.__PIXEL__!.art().blink.active)).toEqual([]);
  await page.evaluate(()=>{const w=window.__PIXEL__!.world;w.elapsed=w.mobility.started+.32;w.resume();});await page.waitForFunction(()=>window.__PIXEL__!.art().casting.pose?.castAbility!=='blink');expect(await page.evaluate(()=>window.__PIXEL__!.art().blink.active)).toEqual([]);expect(await page.evaluate(()=>window.__PIXEL__!.art().blink.allocated)).toBe(4);
 }
 // Scene restarts rebuild the four-image pool and reuse the already loaded atlas.
 const listeners=await page.evaluate(()=>window.__PIXEL__!.listeners());
 for(let i=0;i<3;i++){await page.evaluate(()=>window.__PIXEL__!.restartScene());await expect(page.getByRole('button',{name:'Начать забег'})).toBeVisible();expect(await page.evaluate(()=>window.__PIXEL__!.art().blink.allocated)).toBe(0);expect(await page.evaluate(()=>window.__PIXEL__!.listeners())).toEqual(listeners);await page.getByRole('button',{name:'Начать забег'}).click();await page.evaluate(()=>{const w=window.__PIXEL__!.world;for(const a of Object.values(w.abilities))a.level=0;w.options.spawnRate=0;w.encounterDirector.nextAt=Infinity;w.player.invulnerableUntil=Infinity;});await blink(page,{x:1,y:0});expect(await page.evaluate(()=>window.__PIXEL__!.art().blink.allocated)).toBe(4);}
 expect(requests).toHaveLength(2);expect(errors).toEqual([]);writeFileSync(`${root}/evidence.json`,JSON.stringify({records,requests,listeners,restarts:3,errors},null,2));
});
test('Blink uses the real keyboard while running, and settings reduce flash or hide its sprites',async({page})=>{
 const root='screenshots/mage-blink-v1/game/moving';mkdirSync(root,{recursive:true});const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/?test=1');await page.getByRole('button',{name:'Начать забег'}).click();await page.addStyleTag({content:'.overlay{display:none!important}'});
 await page.evaluate(()=>{const w=window.__PIXEL__!.world;w.options.spawnRate=0;w.encounterDirector.nextAt=Infinity;for(const a of Object.values(w.abilities))a.level=0;w.player.invulnerableUntil=Infinity;});
 await page.keyboard.down('w');await page.keyboard.down('d');await page.waitForFunction(()=>window.__PIXEL__!.art().casting.pose?.motion==='run-start');await page.keyboard.press('Space');await page.waitForFunction(()=>window.__PIXEL__!.art().casting.pose?.castAbility==='blink');await page.evaluate(()=>window.__PIXEL__!.world.pause());
 const cast=await page.evaluate(()=>window.__PIXEL__!.art().casting);expect(cast.pose?.direction).toBe('north-east');expect(cast.layered).toBe(true);expect(cast.upperFrame).toContain('mage-cast-v2-north-east');expect(cast.lowerFrame).toContain('mage-run-v2-north-east');await page.keyboard.up('w');await page.keyboard.up('d');await page.screenshot({path:root+'/running-cast.png'});
 const settings=async(effectsIntensity:number,reducedFlash:boolean)=>page.evaluate(async value=>{const path='/src/game/events/bridge.ts',settings='/src/game/services/storage.ts',{commands}=await import(path),{DEFAULT_SETTINGS}=await import(settings);commands.emit({type:'settings',value:{...DEFAULT_SETTINGS,...value,reducedMotion:true}});},{effectsIntensity,reducedFlash});
 await settings(1,true);await page.waitForFunction(()=>window.__PIXEL__!.art().blink.active.every(v=>v.tint===0xc3b3e5&&v.alpha===.65));await page.screenshot({path:root+'/reduced-flash.png'});
 await settings(0,true);await page.waitForFunction(()=>window.__PIXEL__!.art().blink.active.length===0);expect(await page.evaluate(()=>window.__PIXEL__!.art().blink.allocated)).toBe(4);await page.screenshot({path:root+'/zero-intensity.png'});expect(errors).toEqual([]);
});
