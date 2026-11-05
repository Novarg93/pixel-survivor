import { expect,test } from '@playwright/test';
import { mkdirSync,writeFileSync } from 'node:fs';
const directory='screenshots/lightning-spawn-relief',report='docs/lightning-spawn-relief';
for(const [width,height] of [[1280,720],[844,390]])test(`Lightning quiet forest, pause and gradual real spawning ${width}`,async({browser,baseURL})=>{
  const context=await browser.newContext({viewport:{width,height},hasTouch:width===844,baseURL}),page=await context.newPage(),errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>Object.defineProperty(HTMLElement.prototype,'requestFullscreen',{value:undefined}));
  await page.goto('/?test=1');await page.getByRole('button',{name:'Dark Forest',exact:true}).click();await page.getByRole('button',{name:/^Начать забег/}).click();
  await page.evaluate(()=>{
    const w=window.__PIXEL__!.world;w.elapsed=601;w.experience.level=40;w.options.spawnRate=0;w.encounterDirector.nextAt=1e9;w.player.invulnerableUntil=1e9;w.enemies=[];
    for(const a of Object.values(w.abilities))a.level=0;
    for(let i=0;i<24;i++)w.spawn(i%2?'splitter':'tank',{x:50+i%6*19,y:(Math.floor(i/6)-2)*22});
    w.facing={x:1,y:0};w.ultimate.choose(w,'lightning');
  });
  mkdirSync(directory,{recursive:true});mkdirSync(report,{recursive:true});
  await page.screenshot({path:`${directory}/before-${width}.png`});
  await page.keyboard.press('q');await page.waitForFunction(()=>Number.isFinite(window.__PIXEL__!.world.ultimate.released));
  await page.evaluate(()=>{const w=window.__PIXEL__!.world;w.options.spawnRate=1.3;w.pause();});
  const frozen=await page.evaluate(()=>({now:window.__PIXEL__!.world.elapsed,spawned:window.__PIXEL__!.world.spawnedRegular}));await page.waitForTimeout(200);
  expect(await page.evaluate(()=>({now:window.__PIXEL__!.world.elapsed,spawned:window.__PIXEL__!.world.spawnedRegular}))).toEqual(frozen);
  await page.evaluate(()=>window.__PIXEL__!.world.resume());
  const result=await page.evaluate(async()=>{
    const w=window.__PIXEL__!.world,at=w.ultimate.released,rows:{age:number;factor:number;spawned:number;live:number}[]=[],frames:{age:number;png:string}[]=[];let next=0;
    const initial=w.spawnedRegular;
    await new Promise<void>(resolve=>{const frame=()=>{
      const age=w.elapsed-at;rows.push({age,factor:w.ultimate.regularSpawnFactor(w.elapsed),spawned:w.spawnedRegular,live:w.regularCount});
      if(next<3&&age>=[.9,1.8,3.8][next]){next++;frames.push({age,png:document.querySelector('canvas')!.toDataURL('image/png')});}
      if(age<3.9)requestAnimationFrame(frame);else resolve();
    };requestAnimationFrame(frame);});
    return{initial,kills:w.kills,rows,frames};
  });
  expect(result.initial).toBe(24);expect(result.kills).toBe(24);
  const quiet=result.rows.filter(r=>r.age<2);expect(quiet.length).toBeGreaterThan(40);expect(quiet.every(r=>r.spawned===24&&r.live===0&&r.factor===0)).toBe(true);
  const ramp=result.rows.filter(r=>r.age>2&&r.age<2.7);expect(ramp.length).toBeGreaterThan(20);expect(ramp.every(r=>r.factor>0&&r.factor<1)).toBe(true);
  expect(result.rows.at(-1)!.spawned).toBeGreaterThan(24);expect(result.rows.filter(r=>r.age>2.7).every(r=>r.factor===1)).toBe(true);
  const firstBirth=result.rows.find(r=>r.spawned>24)!;expect(firstBirth.age).toBeGreaterThan(2.05);expect(firstBirth.age).toBeLessThan(3.4);
  for(const [i,f] of result.frames.entries())writeFileSync(`${directory}/${['ash','quiet','return'][i]}-${width}.png`,Buffer.from(f.png.split(',')[1],'base64'));
  writeFileSync(`${report}/live-${width}.json`,JSON.stringify({...result,frames:result.frames.map(({png,...f})=>({...f,bytes:png.length})),firstBirth,errors},null,2));
  await page.evaluate(()=>window.__PIXEL__!.restartScene());await page.waitForFunction(()=>window.__PIXEL__!.world.status==='menu');expect(await page.evaluate(()=>window.__PIXEL__!.world.ultimate.regularSpawnFactor(window.__PIXEL__!.world.elapsed))).toBe(1);
  expect(errors).toEqual([]);await context.close();
});
