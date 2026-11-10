import {expect,test} from '@playwright/test';
import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
const pack=JSON.parse(readFileSync('src/game/art/mageRunManifestV2.json','utf8')) as typeof import('../../src/game/art/mageRunPackV2').MAGE_RUN_V2;
const directions=[{id:'south',keys:['s']},{id:'south-east',keys:['s','d']},{id:'east',keys:['d']},{id:'north-east',keys:['w','d']},{id:'north',keys:['w']},{id:'north-west',keys:['w','a']},{id:'west',keys:['a']},{id:'south-west',keys:['s','a']}];
for(const width of [1280,390])test(`Mage authored running: three views, all phases, transitions, repeated wraps and frozen pause ${width}`,async({page})=>{
 test.setTimeout(90000);const root=`screenshots/mage-run-v2/${width}`;mkdirSync(root,{recursive:true});const evidence:unknown[]=[],errors:string[]=[];
 await page.setViewportSize({width,height:width===390?844:720});page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/?test=1');await page.getByRole('button',{name:'Начать забег'}).click();await page.addStyleTag({content:'.overlay{display:none!important}'});
 await page.evaluate(()=>{const w=window.__PIXEL__!.world;w.options.spawnRate=0;w.encounterDirector.nextAt=Infinity;w.enemies=[];for(const a of Object.values(w.abilities))a.level=0;});
 for(const d of directions){
  for(const key of d.keys)await page.keyboard.down(key);
  const sequence=await page.evaluate(async()=>{
   const rows:{motion:string;frame:string;elapsed:number;x:number;y:number}[]=[],images:{frame:string;png:string}[]=[];
   const canvas=document.querySelector('canvas')!,crop=document.createElement('canvas');crop.width=160;crop.height=180;const g=crop.getContext('2d')!,begin=performance.now();
   await new Promise<void>(resolve=>{const sample=()=>{const w=window.__PIXEL__!.world,a=window.__PIXEL__!.art(),motion=a.casting.pose!.motion;rows.push({motion,frame:a.heroFrame,elapsed:w.elapsed,x:w.player.x,y:w.player.y});
    if(!images.some(i=>i.frame===a.heroFrame)){g.drawImage(canvas,canvas.width/2-80,canvas.height/2-100,160,180,0,0,160,180);images.push({frame:a.heroFrame,png:crop.toDataURL()});}
    if(performance.now()-begin<3600)requestAnimationFrame(sample);else resolve();};requestAnimationFrame(sample);});return{rows,images};
  });
  const body=d.id==='north'?'north':d.id==='north-east'||d.id==='north-west'?'north-east':'south',flipX=['west','south-west','north-west'].includes(d.id),clip=pack.clips[body].run;
  const running=sequence.rows.filter(r=>r.motion==='run');expect(new Set(running.map(r=>r.frame)).size).toBe(clip.frames.length);
  const wrap=running.filter((r,i)=>i>0&&r.frame.endsWith('-0')&&running[i-1]!.frame.endsWith('-'+(clip.frames.length-1)));expect(wrap.length).toBeGreaterThanOrEqual(2);
  const firstRun=sequence.rows.findIndex(r=>r.motion==='run');for(const row of sequence.rows.slice(firstRun))expect(row.motion).toBe('run');
  expect(sequence.rows.some(r=>r.motion==='run-start')).toBe(true);
  for(const row of running)expect(clip.frames.some(f=>f.frame===row.frame)).toBe(true);
  const art=await page.evaluate(()=>window.__PIXEL__!.art()),hero=art.actors.find(a=>a.texture==='mage-run-v2')!,pivot=pack.clips[body].pivot;
  expect(art.casting.running).toMatchObject({body,flipX});expect(hero).toMatchObject({width:pack.displaySize,height:pack.displaySize,originX:(flipX?96-pivot.x:pivot.x)/96,originY:pivot.y/96,rotation:0});expect(art.casting.bodyCropped).toBe(false);
  const first=sequence.rows[0]!,last=sequence.rows.at(-1)!;expect(Math.hypot(last.x-first.x,last.y-first.y)/(last.elapsed-first.elapsed)).toBeCloseTo(135,1);
  for(const image of sequence.images)writeFileSync(`${root}/${image.frame}.png`,Buffer.from(image.png.split(',')[1]!,'base64'));
  await page.evaluate(()=>window.__PIXEL__!.world.pause());await page.waitForTimeout(35);const paused=await page.evaluate(()=>window.__PIXEL__!.art().casting);await page.waitForTimeout(150);expect(await page.evaluate(()=>window.__PIXEL__!.art().casting)).toEqual(paused);
  await page.locator('canvas').screenshot({path:`${root}/run-${d.id}.png`});await page.evaluate(()=>window.__PIXEL__!.world.resume());
  for(const key of d.keys)await page.keyboard.up(key);
  await page.waitForFunction(()=>{if(window.__PIXEL__!.art().casting.pose?.motion!=='run-stop')return false;window.__PIXEL__!.world.pause();return true;},null,{polling:'raf'});
  await page.waitForTimeout(35);const stopped=await page.evaluate(()=>({pose:window.__PIXEL__!.art().casting.pose,frame:window.__PIXEL__!.art().heroFrame,player:{...window.__PIXEL__!.world.player}}));
  await page.locator('canvas').screenshot({path:`${root}/stop-${d.id}.png`});await page.waitForTimeout(80);
  expect(await page.evaluate(()=>({pose:window.__PIXEL__!.art().casting.pose,frame:window.__PIXEL__!.art().heroFrame,player:{...window.__PIXEL__!.world.player}}))).toEqual(stopped);
  await page.evaluate(()=>window.__PIXEL__!.world.resume());await page.waitForFunction(()=>window.__PIXEL__!.art().casting.pose?.motion==='idle');
  expect(await page.evaluate(()=>({x:window.__PIXEL__!.world.player.x,y:window.__PIXEL__!.world.player.y}))).toEqual({x:stopped.player.x,y:stopped.player.y});
  evidence.push({direction:d.id,body,flipX,rows:sequence.rows,stopped,wraps:wrap.length});
 }
 expect(errors).toEqual([]);writeFileSync(`${root}/evidence.json`,JSON.stringify({evidence,errors},null,2));
});
