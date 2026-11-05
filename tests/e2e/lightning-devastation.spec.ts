import { expect,test } from '@playwright/test';
import { mkdirSync,writeFileSync } from 'node:fs';
const directory='screenshots/lightning-devastation',report='docs/lightning-devastation';
for(const [width,height] of [[1280,720],[844,390]])test(`Lightning devastation all directions and quiet ground ${width}`,async({browser,baseURL})=>{
  const context=await browser.newContext({baseURL,viewport:{width,height},hasTouch:width===844}),page=await context.newPage(),errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>Object.defineProperty(HTMLElement.prototype,'requestFullscreen',{value:undefined}));await page.goto('/?test=1');await page.getByRole('button',{name:'Dark Forest',exact:true}).click();await page.getByRole('button',{name:/^Начать забег/}).click();
  await page.evaluate(()=>{
    const w=window.__PIXEL__!.world;w.elapsed=601;w.experience.level=40;w.options.spawnRate=0;w.encounterDirector.nextAt=1e9;w.player.invulnerableUntil=1e9;w.enemies=[];w.facing={x:1,y:0};for(const a of Object.values(w.abilities))a.level=0;
    const view=w.ultimate.viewport;
    for(const [x,y] of [[25,0],[-view.width*.45,0],[0,view.height*.44],[0,-view.height*.44],...[-1,1].flatMap(x=>[-1,1].map(y=>[x*view.width*.46,y*view.height*.44]))]){
      const e=w.spawn('tank',{x,y},true)!;e.hp=e.maxHp=1e6;e.speed=0;e.modifier='shielded';
    }
    w.ultimate.choose(w,'lightning');
  });
  mkdirSync(directory,{recursive:true});mkdirSync(report,{recursive:true});await page.waitForTimeout(120);await page.screenshot({path:`${directory}/before-${width}.png`});
  await page.keyboard.press('q');
  const result=await page.evaluate(async()=>{
    const w=window.__PIXEL__!.world;await new Promise<void>(resolve=>{const wait=()=>{if(w.ultimate.sequence)resolve();else requestAnimationFrame(wait);};wait();});
    const linked=w.ultimate.nodes.length,original=w.damageEnemy.bind(w),hits:{id:number;at:number}[]=[];
    w.damageEnemy=(e,n,source,cap,execute)=>{if(source==='ultimate-lightning')hits.push({id:e.id,at:w.elapsed});return original(e,n,source,cap,execute);};
    const frames:{age:number;live:number;kills:number;art:ReturnType<NonNullable<Window['__PIXEL__']>['art']>['ultimate'];png:string}[]=[];let next=0;
    await new Promise<void>(resolve=>{const frame=()=>{const age=w.elapsed-w.ultimate.started;if(next<5&&age>=[.25,.6,1.1,1.9,2.65][next]){next++;frames.push({age,live:w.regularCount,kills:w.kills,art:window.__PIXEL__!.art().ultimate,png:document.querySelector('canvas')!.toDataURL('image/png')});}if(age<2.8)requestAnimationFrame(frame);else resolve();};requestAnimationFrame(frame);});
    return{linked,hits,frames,audio:window.__PIXEL__!.audio()};
  });
  expect(result.linked).toBeLessThan(8);expect(result.hits).toHaveLength(8);expect(new Set(result.hits.map(h=>h.id)).size).toBe(8);expect(new Set(result.hits.map(h=>h.at)).size).toBe(1);
  expect(result.frames[0].live).toBe(8);for(const f of result.frames.slice(1))expect(f.live).toBe(0);
  expect(result.frames[1].art.ground).toMatchObject({segments:0,alpha:0});
  for(const f of result.frames.slice(2,4)){expect(f.art.ground.arcs).toBeGreaterThan(0);expect(f.art.ground.arcs).toBeLessThanOrEqual(7);}
  expect(result.frames[4].art.ground).toMatchObject({segments:0,alpha:0,geometry:0});
  expect(result.audio.played['ultimate.lightning']).toBe(1);
  for(const [i,f] of result.frames.entries())writeFileSync(`${directory}/${['invocation','release','ground','quiet','restored'][i]}-${width}.png`,Buffer.from(f.png.split(',')[1],'base64'));
  writeFileSync(`${report}/live-${width}.json`,JSON.stringify({...result,frames:result.frames.map(({png,...f})=>({...f,bytes:png.length})),errors},null,2));
  // Restart while scars are active, then check the World and Graphics lifecycle.
  await page.evaluate(()=>{const w=window.__PIXEL__!.world;w.ultimate.charge=10;w.spawn('tank',{x:80,y:0});w.ultimate.activate(w);});await page.waitForFunction(()=>window.__PIXEL__!.art().ultimate.ground.segments>0);
  await page.evaluate(()=>window.__PIXEL__!.world.pause());const frozen=await page.evaluate(()=>window.__PIXEL__!.art().ultimate.ground);await page.waitForTimeout(160);expect(await page.evaluate(()=>window.__PIXEL__!.art().ultimate.ground)).toEqual(frozen);
  await page.evaluate(()=>window.__PIXEL__!.restartScene());await page.waitForFunction(()=>window.__PIXEL__!.world.status==='menu');expect(await page.evaluate(()=>window.__PIXEL__!.art().ultimate.ground)).toMatchObject({segments:0,alpha:0,sparks:0});expect(await page.evaluate(()=>window.__PIXEL__!.world.ultimate.ground)).toBeNull();expect(errors).toEqual([]);await context.close();
});
