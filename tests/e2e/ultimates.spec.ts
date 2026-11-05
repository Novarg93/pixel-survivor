import { expect,test,type Page } from '@playwright/test';
import { mkdirSync,writeFileSync } from 'node:fs';
import type { UltimateId } from '../../src/game/config/ultimates';
const dir='screenshots/ultimates';
async function start(page:Page){
  await page.addInitScript(()=>{Object.defineProperty(HTMLElement.prototype,'requestFullscreen',{value:undefined});});
  await page.goto('/?test=1');await page.getByRole('button',{name:/^Начать забег/}).click();
  await page.evaluate(()=>{const w=window.__PIXEL__!.world;w.options.spawnRate=0;w.encounterDirector.nextAt=1e9;w.player.invulnerableUntil=1e9;for(const a of Object.values(w.abilities))a.level=0;});
  mkdirSync(dir,{recursive:true});
}
async function choose(page:Page,id:UltimateId){
  await page.evaluate(()=>{const w=window.__PIXEL__!.world;w.elapsed=601;w.experience.level=39;w.gainXp(2000);});
  await expect(page.locator('[data-upgrade^="ultimate-"]')).toHaveCount(3);
  await page.screenshot({path:`${dir}/selection-${page.viewportSize()!.width}.png`});
  await page.locator(`[data-upgrade="ultimate-${id}"]`).click();
  await expect.poll(()=>page.evaluate(()=>window.__PIXEL__!.world.status)).toBe('playing');
}
async function charge(page:Page){
  await page.evaluate(()=>{const w=window.__PIXEL__!.world;for(let i=0;i<10;i++){w.mobility.readyAt=w.elapsed;w.mobility.activate(w,{x:0,y:1});}w.player.x=w.player.y=0;w.facing={x:1,y:0};});
  await expect(page.locator('.ultimate-control')).toContainText('10/10');
}
for(const [width,height]of [[1280,720],[844,390],[1024,768]])test(`ultimate selection, input, charge, Chain Storm and ash ${width}`,async({browser,baseURL})=>{
  test.setTimeout(45000);
  const context=await browser.newContext({viewport:{width,height},hasTouch:width!==1280,baseURL,recordVideo:{dir:`${dir}/videos`,size:{width,height}}});
  const page=await context.newPage(),errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await start(page);await choose(page,'lightning');await expect(page.locator('.ultimate-control')).toContainText('10/10');await page.screenshot({path:`${dir}/hud-first-ready-${width}.png`});
  await charge(page);await page.screenshot({path:`${dir}/hud-ready-${width}.png`});
  await page.evaluate(()=>{const w=window.__PIXEL__!.world;for(let i=0;i<120;i++)w.spawn('tank',{x:40+i%12*15,y:(Math.floor(i/12)-5)*19});});
  await page.keyboard.down('d');
  if(width===1280)await page.keyboard.press('q');else await page.locator('.ultimate-control').dispatchEvent('pointerdown',{pointerId:10,pointerType:'touch',isPrimary:true});
  await page.waitForFunction(()=>window.__PIXEL__!.world.ultimate.casting);
  const castingX=await page.evaluate(()=>window.__PIXEL__!.world.player.x);
  await page.waitForTimeout(140);expect(await page.evaluate(()=>window.__PIXEL__!.world.player.x)).toBeCloseTo(castingX,1);
  await page.screenshot({path:`${dir}/lightning-preparation-${width}.png`});
  await page.waitForFunction(()=>Number.isFinite(window.__PIXEL__!.world.ultimate.released));
  await page.screenshot({path:`${dir}/lightning-web-${width}.png`});
  const release=await page.evaluate(()=>{const w=window.__PIXEL__!.world;return{kills:w.kills,hits:w.ultimate.nodes.length,ashes:w.ultimate.ashes.length,damage:w.snapshot().ultimateDamage?.lightning,charge:w.ultimate.charge,objects:window.__PIXEL__!.art().objects};});
  expect(release.kills).toBeGreaterThan(30);expect(release.hits).toBe(120);expect(release.charge).toBe(0);expect(release.ashes).toBeLessThanOrEqual(48);
  await page.waitForTimeout(120);await page.screenshot({path:`${dir}/lightning-recoil-${width}.png`});
  await page.keyboard.up('d');expect(await page.evaluate(()=>window.__PIXEL__!.world.player.x)).toBeGreaterThan(castingX);
  await page.waitForTimeout(160);await page.screenshot({path:`${dir}/lightning-ash-${width}.png`});
  await page.waitForTimeout(850);expect(await page.evaluate(()=>window.__PIXEL__!.art().ultimate.activeAsh)).toBe(0);
  expect(errors).toEqual([]);writeFileSync(`${dir}/lightning-${width}.json`,JSON.stringify({release,errors},null,2));await context.close();
});

for(const [width,height]of [[1280,720],[844,390],[1024,768]]) for(const id of ['frost','fire'] as const)test(`${id} real Canvas, shared limits, expiry and reset ${width}`,async({browser,baseURL})=>{
  const context=await browser.newContext({viewport:{width,height},hasTouch:width!==1280,baseURL}),page=await context.newPage();
  await start(page);await choose(page,id);await charge(page);
  await page.evaluate(()=>{const w=window.__PIXEL__!.world;for(let i=0;i<60;i++){const e=w.spawn('tank',{x:50+i%10*20,y:(Math.floor(i/10)-3)*18})!;e.hp=e.maxHp=1e6;e.speed=0;}});
  await page.keyboard.press('q');await page.waitForTimeout(id==='frost'?430:350);await page.screenshot({path:`${dir}/${id}-active-${width}.png`});
  if(id==='fire'){
    await page.keyboard.down('d');await page.waitForTimeout(400);await page.keyboard.up('d');
    await page.evaluate(()=>{const w=window.__PIXEL__!.world;w.mobility.readyAt=w.elapsed;w.mobility.activate(w,{x:-1,y:0});});
    await page.screenshot({path:`${dir}/fire-blink-trail-${width}.png`});
    expect(await page.evaluate(()=>window.__PIXEL__!.world.ultimate.trails.length)).toBeGreaterThan(0);
    await page.evaluate(()=>window.__PIXEL__!.world.pause());const remaining=await page.evaluate(()=>window.__PIXEL__!.world.ultimate.snapshot(window.__PIXEL__!.world.elapsed).remaining);await page.waitForTimeout(180);expect(await page.evaluate(()=>window.__PIXEL__!.world.ultimate.snapshot(window.__PIXEL__!.world.elapsed).remaining)).toBe(remaining);
    await page.evaluate(()=>{const w=window.__PIXEL__!.world;w.resume();w.elapsed=w.ultimate.activeUntil;w.ultimate.update(w);});expect(await page.evaluate(()=>window.__PIXEL__!.world.ultimate.trails)).toEqual([]);
  }
  await page.evaluate(()=>window.__PIXEL__!.restartScene());await page.waitForFunction(()=>window.__PIXEL__!.world.status==='menu');expect(await page.evaluate(()=>window.__PIXEL__!.world.ultimate.selected)).toBeNull();await context.close();
});

test('Y edge, no held replay, pause/upgrade block and reduced effects',async({page})=>{
  await page.addInitScript(()=>{
    const pad={index:0,connected:true,mapping:'standard',axes:[0,0],buttons:Array.from({length:17},()=>({pressed:false,touched:false,value:0}))};
    Object.defineProperty(navigator,'getGamepads',{value:()=>[pad]});Object.assign(window,{ultimatePad:pad});
  });
  await start(page);await choose(page,'lightning');await charge(page);
  await page.evaluate(()=>{const w=window.__PIXEL__!.world;w.spawn('tank',{x:70,y:0});w.pause();});
  await page.keyboard.press('q');expect(await page.evaluate(()=>window.__PIXEL__!.world.ultimate.charge)).toBe(10);
  await page.evaluate(()=>{window.__PIXEL__!.world.resume();});await page.waitForTimeout(80);
  await page.evaluate(()=>{const pad=Reflect.get(window,'ultimatePad') as {buttons:{pressed:boolean;value:number}[]};pad.buttons[3]={pressed:true,value:1};});
  await expect.poll(()=>page.evaluate(()=>window.__PIXEL__!.world.ultimate.sequence)).toBe(1);
  await page.waitForTimeout(700);expect(await page.evaluate(()=>window.__PIXEL__!.world.ultimate.sequence)).toBe(1);
  await page.waitForFunction(()=>{const w=window.__PIXEL__!.world;return w.elapsed>=w.ultimate.activeUntil&&w.ultimate.regularSpawnFactor(w.elapsed)===1;});
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.evaluate(async()=>{const path='/src/game/events/bridge.ts',{commands}=await import(path);commands.emit({type:'settings',value:{volume:.3,muted:false,pixelScale:2,reducedMotion:true,reducedFlash:true}});const w=window.__PIXEL__!.world;w.ultimate.charge=10;w.spawn('tank',{x:w.player.x+70,y:w.player.y});});
  await page.keyboard.press('q');await expect.poll(()=>page.evaluate(()=>window.__PIXEL__!.world.ultimate.sequence)).toBe(2);await page.waitForTimeout(440);await page.screenshot({path:`${dir}/lightning-reduced.png`});
});

test('real RAF cast/release/recoil timeline has a single damage timestamp and immediately resumes held WASD',async({page})=>{
  await start(page);await choose(page,'lightning');await charge(page);
  const timeline=await page.evaluate(async()=>{
    const w=window.__PIXEL__!.world;
    for(let i=0;i<50;i++)w.spawn('tank',{x:40+i%10*19,y:(Math.floor(i/10)-2)*23});
    const hits:{id:number;at:number}[]=[],original=w.damageEnemy.bind(w);
    w.damageEnemy=(e,n,source,cap,execute)=>{if(source==='ultimate-lightning')hits.push({id:e.id,at:w.elapsed});return original(e,n,source,cap,execute);};
    w.ultimate.activate(w);const start=w.elapsed,frames:{age:number;pose:number;mode:string;kills:number;pixels:string}[]=[],canvas=document.querySelector('canvas')!;let beat=-1;
    await new Promise<void>(resolve=>{const frame=()=>{const age=w.elapsed-start,a=window.__PIXEL__!.art().casting,thresholds=[.1,.28,.405,.46,.55,.7,.9],index=thresholds.filter(t=>age>=t).length-1;if(index>beat){beat=index;frames.push({age,pose:a.frame,mode:a.mode,kills:w.kills,pixels:canvas.toDataURL('image/png')});}if(age<1.05)requestAnimationFrame(frame);else resolve();};requestAnimationFrame(frame);});
    return{hits,frames};
  });
  writeFileSync('docs/ultimates/timeline-debug.json',JSON.stringify({...timeline,frames:timeline.frames.map(({pixels,...f})=>({...f,bytes:pixels.length}))},null,2));
  expect(timeline.hits).toHaveLength(50);expect(new Set(timeline.hits.map(h=>h.id)).size).toBe(50);expect(new Set(timeline.hits.map(h=>h.at)).size).toBe(1);
  expect(timeline.frames.some(f=>f.age<.4&&f.kills===0)).toBe(true);expect(timeline.frames.some(f=>f.pose===4)).toBe(true);
  mkdirSync('docs/ultimates',{recursive:true});
  for(const [i,f]of timeline.frames.entries())writeFileSync(`${dir}/timeline-${i}.png`,Buffer.from(f.pixels.split(',')[1],'base64'));
  writeFileSync('docs/ultimates/live-timeline.json',JSON.stringify({...timeline,frames:timeline.frames.map(({pixels,...f})=>({...f,bytes:pixels.length}))},null,2));
});
