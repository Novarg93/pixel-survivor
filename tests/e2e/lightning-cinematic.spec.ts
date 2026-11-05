import { expect,test,type Page } from '@playwright/test';
import { mkdirSync,writeFileSync } from 'node:fs';
import { mockGamepads } from '../helpers/gamepad';
const directory='screenshots/lightning-cinematic',report='docs/lightning-cinematic';
async function start(page:Page){
  await page.addInitScript(()=>Object.defineProperty(HTMLElement.prototype,'requestFullscreen',{value:undefined}));
  await page.goto('/?test=1');await page.getByRole('button',{name:'Dark Forest',exact:true}).click();await page.getByRole('button',{name:/^Начать забег/}).click();
  await page.evaluate(()=>{
    const w=window.__PIXEL__!.world;w.options.spawnRate=0;w.encounterDirector.nextAt=1e9;w.elapsed=601;w.experience.level=40;
    for(const a of Object.values(w.abilities))a.level=0;
    w.enemies=[];w.facing={x:1,y:0};w.ultimate.choose(w,'lightning');
    for(let i=0;i<64;i++){const e=w.spawn('tank',{x:65+i%8*20,y:(Math.floor(i/8)-4)*22})!;e.speed=0;}
  });
  mkdirSync(directory,{recursive:true});mkdirSync(report,{recursive:true});
}
for(const [width,height]of [[1280,720],[844,390]])test(`Divine Storm real eight-frame sequence and held WASD ${width}`,async({browser,baseURL})=>{
  const context=await browser.newContext({viewport:{width,height},hasTouch:width===844,baseURL}),page=await context.newPage(),errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await start(page);await page.waitForTimeout(70);await page.screenshot({path:`${directory}/full-before-${width}.png`});
  const before=await page.locator('canvas').screenshot();writeFileSync(`${directory}/01-normal-${width}.png`,before);
  await page.evaluate(()=>{
    const w=window.__PIXEL__!.world,hits:{id:number;at:number}[]=[],original=w.damageEnemy.bind(w);
    Object.assign(window,{lightningHits:hits});w.damageEnemy=(e,n,source,cap,execute)=>{if(source==='ultimate-lightning')hits.push({id:e.id,at:w.elapsed});return original(e,n,source,cap,execute);};
  });
  await page.keyboard.down('d');
  if(width===1280)await page.keyboard.press('q');else await page.locator('.ultimate-control').dispatchEvent('pointerdown',{pointerId:30,pointerType:'touch'});
  const capture=await page.evaluate(async()=>{
    const w=window.__PIXEL__!.world;
    await new Promise<void>(resolve=>{const wait=()=>{if(w.ultimate.sequence)resolve();else requestAnimationFrame(wait);};wait();});
    const frames: {name:string;age:number;x:number;kills:number;protected:boolean;state:ReturnType<NonNullable<Window['__PIXEL__']>['art']>['ultimate'];casting:ReturnType<NonNullable<Window['__PIXEL__']>['art']>['casting'];pixels:string}[]=[];
    const thresholds=[.25,.345,.44,.535,.58,.66,1.02],names=['02-invocation','03-sky-strike','04-overload','05-release','06-flash','07-ash-recoil','08-restored'];let next=0,webCompletedAt=-1;
    await new Promise<void>(resolve=>{const frame=()=>{
      const age=w.elapsed-w.ultimate.started;
      if(webCompletedAt<0&&window.__PIXEL__!.art().ultimate.web===1)webCompletedAt=w.elapsed-w.ultimate.released;
      if(next<thresholds.length&&age>=thresholds[next]){
        const a=window.__PIXEL__!.art();frames.push({name:names[next++],age,x:w.player.x,kills:w.kills,protected:w.ultimate.protected(w.elapsed),state:a.ultimate,casting:a.casting,pixels:document.querySelector('canvas')!.toDataURL('image/png')});
      }
      if(next<thresholds.length)requestAnimationFrame(frame);else resolve();
    };requestAnimationFrame(frame);});
    return{frames,webCompletedAt,hits:Reflect.get(window,'lightningHits') as {id:number;at:number}[],audio:window.__PIXEL__!.audio()};
  });
  await page.keyboard.up('d');await page.screenshot({path:`${directory}/full-restored-${width}.png`});
  for(const f of capture.frames)writeFileSync(`${directory}/${f.name}-${width}.png`,Buffer.from(f.pixels.split(',')[1],'base64'));
  writeFileSync(`${report}/sequence-${width}.json`,JSON.stringify({...capture,frames:capture.frames.map(({pixels,...f})=>({...f,pngBytes:pixels.length}))},null,2));
  const [invocation,sky,overload,release,flash,recoil,restored]=capture.frames;
  expect(capture.frames.map(f=>f.state.phase)).toEqual(['invocation','sky-strike','overload','release','release','recoil','idle']);
  expect(invocation.state.dim).toBeGreaterThan(.1);expect(invocation.casting.hands.some(h=>h.y<invocation.casting.y-12)).toBe(true);
  expect(sky.state.sky).toBe(true);expect(sky.state.activeAura).toBe(2);expect(overload.state.activeAura).toBe(2);
  for(const f of [invocation,sky,overload]){expect(f.protected).toBe(true);expect(f.kills).toBe(0);expect(f.x).toBeCloseTo(invocation.x,3);}
  expect(release.protected).toBe(false);expect(release.state.activeAura).toBe(0);expect(release.kills).toBe(64);
  expect(flash.state.flash).toBeGreaterThan(.1);expect(flash.state.flash).toBeGreaterThan(flash.state.dim);expect(capture.webCompletedAt).toBeGreaterThanOrEqual(.075);expect(capture.webCompletedAt).toBeLessThanOrEqual(.1);
  expect(recoil.casting.bodyFrame).toContain('lean');expect(Math.abs(recoil.casting.rotation)).toBeGreaterThan(.1);expect(recoil.state.activeAsh).toBeGreaterThan(0);
  expect(restored.state).toMatchObject({dim:0,flash:0,activeAura:0});expect(restored.x).toBeGreaterThan(invocation.x);
  expect(capture.hits).toHaveLength(64);expect(new Set(capture.hits.map(h=>h.id)).size).toBe(64);expect(new Set(capture.hits.map(h=>h.at)).size).toBe(1);
  for(const event of ['ultimate.charge','ultimate.sky','ultimate.overload','ultimate.lightning'] as const)expect(capture.audio.played[event]).toBe(1);
  expect(errors).toEqual([]);await context.close();
});

test('pause, reduced effects, held left stick, interruption and ten lit restarts clean objects/listeners',async({page})=>{
  test.setTimeout(45000);await mockGamepads(page);await start(page);
  await page.evaluate(()=>{window.__GAMEPAD_MOCK__.connect();window.__GAMEPAD_MOCK__.stick(.8,0);});
  await page.keyboard.press('q');await page.waitForFunction(()=>window.__PIXEL__!.art().ultimate.aura);
  await page.evaluate(()=>window.__PIXEL__!.world.pause());
  const frozen=await page.evaluate(()=>({time:window.__PIXEL__!.world.elapsed,state:window.__PIXEL__!.art().ultimate}));
  await page.waitForTimeout(160);expect(await page.evaluate(()=>window.__PIXEL__!.world.elapsed)).toBe(frozen.time);
  expect(await page.evaluate(()=>window.__PIXEL__!.art().ultimate)).toEqual(frozen.state);
  await page.evaluate(()=>window.__PIXEL__!.world.resume());await page.waitForFunction(()=>!window.__PIXEL__!.world.ultimate.casting);
  // Existing pause policy requires neutral. Then hold the same stick through a new cast.
  await page.evaluate(()=>window.__GAMEPAD_MOCK__.stick(0,0));await page.waitForTimeout(70);
  await page.waitForFunction(()=>{const w=window.__PIXEL__!.world;return w.elapsed>=w.ultimate.activeUntil&&w.ultimate.regularSpawnFactor(w.elapsed)===1;});
  await page.evaluate(()=>{const w=window.__PIXEL__!.world;w.ultimate.charge=10;w.spawn('tank',{x:w.player.x+70,y:w.player.y});window.__GAMEPAD_MOCK__.stick(.8,0);w.ultimate.activate(w);});
  await page.waitForFunction(()=>!window.__PIXEL__!.world.ultimate.casting);
  const releaseX=await page.evaluate(()=>window.__PIXEL__!.world.player.x);await page.waitForTimeout(150);expect(await page.evaluate(()=>window.__PIXEL__!.world.player.x)).toBeGreaterThan(releaseX);
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.waitForFunction(()=>window.__PIXEL__!.art().ultimate.dim===0);
  await page.waitForFunction(()=>{const w=window.__PIXEL__!.world;return w.elapsed>=w.ultimate.activeUntil&&w.ultimate.regularSpawnFactor(w.elapsed)===1;});
  await page.evaluate(async()=>{
    window.__GAMEPAD_MOCK__.stick(0,0);const path='/src/game/events/bridge.ts',{commands}=await import(path);commands.emit({type:'settings',value:{volume:.3,muted:true,pixelScale:2,effectsIntensity:.3,reducedMotion:true,reducedFlash:true}});
    const w=window.__PIXEL__!.world;w.ultimate.charge=10;w.spawn('tank',{x:w.player.x+70,y:w.player.y});w.ultimate.activate(w);
  });
  await page.waitForFunction(()=>window.__PIXEL__!.art().ultimate.flash>0);
  expect(await page.evaluate(()=>window.__PIXEL__!.art().ultimate.flash)).toBeLessThanOrEqual(.011);
  await page.screenshot({path:`${directory}/reduced-flash.png`});
  const restarts=[];
  for(let i=0;i<10;i++){
    await page.evaluate(()=>window.__PIXEL__!.restartScene());await page.waitForFunction(()=>window.__PIXEL__!.world.status==='menu');
    restarts.push(await page.evaluate(()=>{const a=window.__PIXEL__!.art();return{objects:a.objects,textures:a.textures.length,clock:a.clock,tweens:a.tweens,listeners:window.__PIXEL__!.listeners(),native:window.__GAMEPAD_MOCK__.listeners(),ultimate:a.ultimate};}));
    if(i<9){await page.getByRole('button',{name:/^Начать забег/}).click();await page.evaluate(()=>{const w=window.__PIXEL__!.world;w.options.spawnRate=0;w.elapsed=601;w.experience.level=40;w.spawn('tank',{x:70,y:0});w.ultimate.choose(w,'lightning');w.ultimate.activate(w);});await page.waitForFunction(()=>window.__PIXEL__!.art().ultimate.aura);}
  }
  for(const row of restarts){expect(row).toEqual(restarts[0]);expect(row.ultimate).toMatchObject({dim:0,flash:0,activeAura:0,allocatedAura:0});expect(row.clock).toEqual([0,0,0]);}
  writeFileSync(`${report}/lifecycle.json`,JSON.stringify(restarts,null,2));
});

test('restores actual Canvas background pixels and leaves HUD filters unchanged',async({page})=>{
  await start(page);
  // Compare the cinematic's own dim/recovery on a settled atmosphere, outside 10:00–10:02.5.
  await page.evaluate(()=>{window.__PIXEL__!.world.elapsed=615;});await page.waitForTimeout(100);
  const result=await page.evaluate(async()=>{
    const w=window.__PIXEL__!.world,canvas=document.querySelector('canvas')!,copy=document.createElement('canvas');copy.width=80;copy.height=80;const g=copy.getContext('2d')!;
    const pixels=()=>{g.clearRect(0,0,80,80);g.drawImage(canvas,10,10,80,80,0,0,80,80);const p=g.getImageData(0,0,80,80).data;let sum=0;for(let i=0;i<p.length;i+=4)sum+=p[i]+p[i+1]+p[i+2];return sum/(p.length/4*3);};
    const filters=()=>{const values:string[]=[];for(let e=document.querySelector('.hud');e;e=e.parentElement)values.push(getComputedStyle(e).filter);return values;};
    let before=0,after=0,dark=0;const hudBefore=filters();let hudDuring:string[]=[];
    // Match the environment clock for control/recovered pixels: even settled fog drifts.
    // The cinematic itself still plays normally, with the default motion/flash settings.
    const baselineAt=w.elapsed+2;w.pause();w.elapsed=baselineAt;
    // WebGL's drawing buffer is valid inside the rendered RAF, not an arbitrary evaluate.
    await new Promise<void>(resolve=>requestAnimationFrame(()=>{before=pixels();w.elapsed=baselineAt-2;w.resume();w.ultimate.activate(w);resolve();}));
    await new Promise<void>(resolve=>{const frame=()=>{const age=w.elapsed-w.ultimate.started;if(!dark&&age>=.26){dark=pixels();hudDuring=filters();}if(w.elapsed<baselineAt)requestAnimationFrame(frame);else resolve();};requestAnimationFrame(frame);});
    w.pause();w.elapsed=baselineAt;
    await new Promise<void>(resolve=>requestAnimationFrame(()=>{after=pixels();resolve();}));
    return{before,dark,after,baselineAt,recoveredAt:w.elapsed,hudBefore,hudDuring,state:window.__PIXEL__!.art().ultimate};
  });
  writeFileSync(`${report}/pixel-recovery.json`,JSON.stringify(result,null,2));
  expect(result.dark).toBeLessThan(result.before-1);expect(Math.abs(result.after-result.before)).toBeLessThan(.05);expect(result.hudDuring).toEqual(result.hudBefore);expect(result.hudDuring.every(f=>f==='none')).toBe(true);
  expect(result.state).toMatchObject({dim:0,flash:0,activeAura:0});
  expect(result.recoveredAt).toBe(result.baselineAt);
});

for(const [width,height]of [[1280,720],[844,390]])test(`Lightning constant 150+3+3 frame comparison ${width}`,async({browser,baseURL})=>{
  const context=await browser.newContext({baseURL,viewport:{width,height},hasTouch:width===844}),page=await context.newPage();await start(page);
  await page.evaluate(()=>{
    const w=window.__PIXEL__!.world;w.enemies=[];w.elapsed=1170;w.player.invulnerableUntil=1e9;w.stats.cooldown=.01;
    for(const a of Object.values(w.abilities)){a.level=5;a.readyAt=w.elapsed;}
    for(let i=0;i<150;i++)w.spawn((['tank','grunt','runner','caster','rusher','splitter'] as const)[i%6],{x:40+i%15*14,y:(Math.floor(i/15)-5)*17});
    for(const kind of ['charger','sorcerer','eclipse'] as const)w.spawn(kind,{x:140,y:70});for(let i=0;i<3;i++)w.spawn('guardian',{x:220,y:(i-1)*100});
    for(const e of w.enemies)e.hp=e.maxHp=1e9;w.guardianSystem.finalizePlacement(w,w.guardians.map(e=>e.id));
    // Preserve full density and real attack/render work for the whole comparison.
    w.damageEnemy=()=>false;
  });
  const result=await page.evaluate(async()=>{
    const w=window.__PIXEL__!.world;
    const sample=async(ms:number)=>{const rows:{delta:number;update:number}[]=[];let before=performance.now();const start=before;await new Promise<void>(resolve=>{const frame=(now:number)=>{rows.push({delta:now-before,update:window.__PIXEL__!.metrics().updateMs});before=now;if(now-start<ms)requestAnimationFrame(frame);else resolve();};requestAnimationFrame(frame);});return rows.filter(r=>r.delta>0);};
    // Include all five residual passes and their cleanup under constant enemy density.
    await sample(300);const baseline=await sample(1000),start=performance.now();w.ultimate.activate(w);const activation=performance.now()-start,cast=await sample(2650);
    return{baseline,cast,activation,metrics:window.__PIXEL__!.metrics(),art:window.__PIXEL__!.art().ultimate,clock:window.__PIXEL__!.art().clock};
  });
  const percentile=(rows:{delta:number}[],p:number)=>rows.map(r=>r.delta).sort((a,b)=>a-b)[Math.floor(rows.length*p)];
  const before=percentile(result.baseline,.5),after=percentile(result.cast,.5),p95=percentile(result.cast,.95);
  expect(after).toBeLessThanOrEqual(before*1.2+1);expect(p95).toBeLessThanOrEqual(Math.max(34,percentile(result.baseline,.95)*1.5));expect(result.activation).toBeLessThan(20);
  expect(result.art).toMatchObject({allocatedAura:2,activeAura:0,dim:0,flash:0});expect(result.clock).toEqual([0,0,0]);expect(result.metrics.enemies).toBe(150);expect(result.metrics.bosses).toBe(3);expect(result.metrics.guardians).toBe(3);
  expect(result.art.ground).toMatchObject({geometry:0,arcs:0,alpha:0});
  await page.screenshot({path:`${directory}/constant-stress-${width}.png`});writeFileSync(`${report}/constant-performance-${width}.json`,JSON.stringify({medianBeforeFps:1000/before,medianCastFps:1000/after,p95FrameMs:p95,...result},null,2));await context.close();
});
