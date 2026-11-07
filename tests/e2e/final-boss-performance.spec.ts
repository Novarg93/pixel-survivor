import {test,expect} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';
import {cpus,totalmem} from 'node:os';
for(const [width,height]of [[1280,720],[844,390]])test(`Warden baseline,150+3+3 entry and phase3 ultimates frame metrics ${width}`,async({browser,baseURL})=>{
 test.setTimeout(60000);const context=await browser.newContext({baseURL,viewport:{width,height},hasTouch:width<1000}),page=await context.newPage(),errors:string[]=[];
 page.on('pageerror',e=>errors.push(e.message));await page.addInitScript(()=>Object.defineProperty(HTMLElement.prototype,'requestFullscreen',{value:undefined}));await page.goto('/?test=1');await page.locator('.play-button').click();
 await page.evaluate(()=>{const w=window.__PIXEL__!.world;w.options.spawnRate=0;w.encounterDirector.nextAt=1e9;w.elapsed=1170;w.experience.level=70;w.player.invulnerableUntil=1e9;for(const a of Object.values(w.abilities))a.level=0;
  for(let i=0;i<150;i++)w.spawn('tank',{x:(i%15-7)*18,y:(Math.floor(i/15)-5)*20});for(const kind of ['charger','sorcerer','eclipse','guardian','guardian','guardian']as const)w.spawn(kind,{x:150,y:20});
 });
 const rows=[];
 for(const phase of ['baseline','entry','lightning','frost','fire']as const){
  await page.evaluate(phase=>{const w=window.__PIXEL__!.world;if(phase==='entry')w.elapsed=1199.99;
   if(phase==='lightning'||phase==='frost'||phase==='fire'){
    const f=w.finalEncounter;f.phase='phase3';f.pending=null;f.nextVolley=f.clock+.4;f.nextCombo=Infinity;f.attack={...f.attack,kind:'approach',age:0};f.boss!.hp=f.boss!.maxHp;w.player.x=f.boss!.x+80;w.player.y=f.boss!.y;
    w.ultimate.clear();w.ultimate.choose(w,phase);w.ultimate.activate(w);
   }
  },phase);
  const sample=await page.evaluate(async()=>{
   const deltas:number[]=[],updates:number[]=[],objects:number[]=[],start=performance.now();let previous=start;
   await new Promise<void>(resolve=>{const frame=(now:number)=>{deltas.push(now-previous);previous=now;updates.push(window.__PIXEL__!.metrics().updateMs);objects.push(window.__PIXEL__!.art().objects);if(now-start<3200)requestAnimationFrame(frame);else resolve();};requestAnimationFrame(frame);});
   const art=window.__PIXEL__!.art();return{deltas,updates,objects,bytes:art.textureBytes,textures:art.textures.length,clock:art.clock,listeners:window.__PIXEL__!.listeners(),metrics:window.__PIXEL__!.metrics()};
  });
  const sorted=sample.deltas.filter(n=>n>0).sort((a,b)=>a-b),times=sample.updates.sort((a,b)=>a-b);rows.push({phase,...sample,medianFps:1000/sorted[Math.floor(sorted.length*.5)]!,p95FrameMs:sorted[Math.floor(sorted.length*.95)],p95UpdateMs:times[Math.floor(times.length*.95)]});
  expect(sample.clock).toEqual([0,0,0]);expect(sample.metrics.projectiles).toBeLessThanOrEqual(96);
 }
 const device={browser:browser.version(),dpr:await page.evaluate(()=>devicePixelRatio),cpu:cpus()[0]!.model,logicalCores:cpus().length,ramGiB:totalmem()/1073741824};
 expect(errors).toEqual([]);mkdirSync('docs/final-boss',{recursive:true});writeFileSync(`docs/final-boss/performance-${width}.json`,JSON.stringify({device,context:'Same Chromium/DPR/device: baseline1170s150+3+3 vs entry and phase3. New atlas preloaded in all samples. Invulnerable player only for resource stress; no balance claims.',rows,errors},null,2));await context.close();
});
