import {expect,test,type Page} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';
const directory='screenshots/lightning-residual-density',report='docs/lightning-residual-density';
async function start(page:Page){
  await page.addInitScript(()=>Object.defineProperty(HTMLElement.prototype,'requestFullscreen',{value:undefined}));await page.goto('/?test=1');await page.getByRole('button',{name:'Dark Forest',exact:true}).click();await page.getByRole('button',{name:/^Начать забег/}).click();
  await page.evaluate(()=>{
    const w=window.__PIXEL__!.world;w.elapsed=601;w.experience.level=40;w.options.spawnRate=0;w.encounterDirector.nextAt=1e9;w.player.invulnerableUntil=1e9;w.enemies=[];w.facing={x:1,y:0};for(const a of Object.values(w.abilities))a.level=0;
    const view=w.ultimate.viewport;
    for(const [x,y]of [[25,0],[-view.width*.45,0],[0,view.height*.44],[0,-view.height*.44],...[-1,1].flatMap(x=>[-1,1].map(y=>[x*view.width*.46,y*view.height*.44]))]){const e=w.spawn('tank',{x,y},true)!;e.hp=e.maxHp=1e6;e.speed=0;e.modifier='shielded';}
    w.ultimate.choose(w,'lightning');
  });mkdirSync(directory,{recursive:true});mkdirSync(report,{recursive:true});
}
for(const [width,height]of [[1280,720],[844,390]])test(`Residual crackles replay twenty-six fixed cells in five quiet passes and clear ${width}`,async({browser,baseURL})=>{
  const context=await browser.newContext({baseURL,viewport:{width,height},hasTouch:width===844}),page=await context.newPage(),errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await start(page);await page.waitForTimeout(120);
  const recording=page.evaluate(async()=>{
    const w=window.__PIXEL__!.world,targets=w.enemies.map(e=>({id:e.id,x:e.x,y:e.y})),original=w.damageEnemy.bind(w),hits:{id:number;at:number}[]=[];
    w.damageEnemy=(e,n,source,cap,execute)=>{if(source==='ultimate-lightning')hits.push({id:e.id,at:w.elapsed});return original(e,n,source,cap,execute);};
    const frames:{age:number;live:number;kills:number;art:ReturnType<NonNullable<Window['__PIXEL__']>['art']>['ultimate'];objects:number;clock:(number|null)[];png:string}[]=[],thresholds=[.075,.14,.34,.405,.5,.82,1.14,1.46,1.78,2.05],samples:{age:number;pass:number;arcs:number;alpha:number;activeCells:number[]}[]=[];let next=0,linked:number[]=[],ground:{origin:{x:number;y:number};radius:number}|undefined;
    await new Promise<void>(resolve=>{const frame=()=>{const u=w.ultimate,t=w.elapsed-u.released;if(Number.isFinite(t)){if(!ground&&u.ground)ground={origin:{...u.ground.origin},radius:u.ground.radius};const art=window.__PIXEL__!.art();samples.push({age:t,...art.ultimate.ground});if(t>=thresholds[next]){if(!linked.length)linked=u.nodes.map(n=>n.id);frames.push({age:t,live:w.regularCount,kills:w.kills,art:art.ultimate,objects:art.objects,clock:art.clock,png:document.querySelector('canvas')!.toDataURL('image/png')});next++;}}if(next<thresholds.length)requestAnimationFrame(frame);else resolve();};requestAnimationFrame(frame);});
    return{viewport:{...w.ultimate.viewport},origin:ground!.origin,radius:ground!.radius,linked,targets,hits,frames,samples};
  });
  if(width===1280)await page.keyboard.press('q');else await page.locator('.ultimate-control').dispatchEvent('pointerdown',{pointerId:60,pointerType:'touch'});
  const result=await recording;
  expect(result.radius).toBeCloseTo(Math.hypot(result.viewport.width,result.viewport.height)/2+24);expect(result.hits).toHaveLength(8);expect(new Set(result.hits.map(h=>h.id)).size).toBe(8);expect(new Set(result.hits.map(h=>h.at)).size).toBe(1);
  const rear=result.targets.filter(t=>t.x<result.origin.x);expect(rear.length).toBeGreaterThan(0);expect(rear.some(t=>!result.linked.includes(t.id))).toBe(true);for(const t of rear)expect(result.hits.some(h=>h.id===t.id)).toBe(true);
  for(const f of result.frames){expect(f.live).toBe(0);expect(f.kills).toBe(8);expect(f.art.ground.builds).toBe(1);expect(f.clock).toEqual([0,0,0]);}
  for(const f of result.frames.slice(0,3))expect(f.art.ground).toMatchObject({segments:0,alpha:0,pass:0});
  expect(result.frames[3].art.ground.pass).toBe(1);for(let pass=1;pass<=5;pass++)expect(result.frames[3+pass].art.ground.pass).toBe(pass);expect(result.frames[9].art.ground).toMatchObject({segments:0,arcs:0,alpha:0,geometry:0,sparks:0,pass:0});
  expect(result.samples.every(s=>s.arcs<=7&&s.alpha<=.44)).toBe(true);for(let pass=1;pass<=5;pass++)expect(new Set(result.samples.filter(s=>s.pass===pass).flatMap(s=>s.activeCells)).size).toBe(26);
  const live=result.samples.filter(s=>s.arcs>0);expect(live[0].age).toBeGreaterThanOrEqual(.385-1e-7);expect(live.at(-1)!.age-live[0].age).toBeGreaterThan(1.5);expect(live.at(-1)!.age).toBeLessThan(1.985);
  expect(Math.max(...result.frames.map(f=>f.objects))-Math.min(...result.frames.map(f=>f.objects))).toBeLessThanOrEqual(4);
  for(const [i,f]of result.frames.entries())writeFileSync(`${directory}/${['main-strike','rear-kills','before-residual','residual-start','pass-one','pass-two','pass-three','pass-four','pass-five','cleared'][i]}-${width}.png`,Buffer.from(f.png.split(',')[1],'base64'));
  writeFileSync(`${report}/after-${width}.json`,JSON.stringify({...result,frames:result.frames.map(f=>({...f,png:undefined})),errors},null,2));expect(errors).toEqual([]);await context.close();
});

test('Aftershock reduced intensity, World pause, zero effects and ten clean restarts',async({page})=>{
  test.setTimeout(45000);await start(page);await page.evaluate(async()=>{const path='/src/game/events/bridge.ts',{commands}=await import(path);commands.emit({type:'settings',value:{volume:0,muted:true,pixelScale:2,reducedMotion:true,reducedFlash:true,effectsIntensity:.4}});});
  // Freeze inside the real visual interval rather than advancing independent timers.
  const frozen=await page.evaluate(async()=>{const w=window.__PIXEL__!.world;w.ultimate.activate(w);await new Promise<void>(resolve=>{const frame=()=>{const g=window.__PIXEL__!.art().ultimate.ground;if(g.pass===1&&g.arcs>=2){w.pause();resolve();}else requestAnimationFrame(frame);};requestAnimationFrame(frame);});return window.__PIXEL__!.art().ultimate.ground;});
  expect(frozen.alpha).toBeGreaterThan(0);expect(frozen.alpha).toBeLessThanOrEqual(.44*.4*.55+1e-9);await page.waitForTimeout(180);expect(await page.evaluate(()=>window.__PIXEL__!.art().ultimate.ground)).toEqual(frozen);
  await page.screenshot({path:`${directory}/reduced-paused-1280.png`});
  await page.evaluate(async()=>{const path='/src/game/events/bridge.ts',{commands}=await import(path);commands.emit({type:'settings',value:{volume:0,muted:true,pixelScale:2,reducedMotion:true,reducedFlash:true,effectsIntensity:0}});});await page.waitForFunction(()=>window.__PIXEL__!.art().ultimate.ground.alpha===0);
  await page.evaluate(async()=>{const path='/src/game/events/bridge.ts',{commands}=await import(path);commands.emit({type:'settings',value:{volume:0,muted:true,pixelScale:2,reducedMotion:true,reducedFlash:true,effectsIntensity:.4}});window.__PIXEL__!.world.resume();});await page.waitForFunction(()=>window.__PIXEL__!.art().ultimate.ground.geometry===0);
  const cycles=[];
  for(let i=0;i<10;i++){await page.evaluate(()=>window.__PIXEL__!.restartScene());await page.waitForFunction(()=>window.__PIXEL__!.world.status==='menu');cycles.push(await page.evaluate(()=>{const art=window.__PIXEL__!.art();return{objects:art.objects,listeners:window.__PIXEL__!.listeners(),clock:art.clock,tweens:art.tweens,ground:art.ultimate.ground};}));if(i<9){await page.getByRole('button',{name:/^Начать забег/}).click();await page.evaluate(()=>{const w=window.__PIXEL__!.world;w.elapsed=601;w.experience.level=40;w.options.spawnRate=0;w.encounterDirector.nextAt=1e9;w.player.invulnerableUntil=1e9;for(const a of Object.values(w.abilities))a.level=0;w.spawn('tank',{x:30,y:0});w.ultimate.choose(w,'lightning');w.ultimate.activate(w);});await page.waitForFunction(()=>window.__PIXEL__!.art().ultimate.ground.alpha>0);}}
  for(const c of cycles){expect(c).toEqual(cycles[0]);expect(c.ground).toMatchObject({segments:0,alpha:0,geometry:0,arcs:0});expect(c.clock).toEqual([0,0,0]);expect(c.tweens).toBe(0);}writeFileSync(`${report}/reduced-restarts.json`,JSON.stringify({frozen,cycles},null,2));
});
