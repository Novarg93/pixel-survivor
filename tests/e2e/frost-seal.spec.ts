import { expect,test,type Page } from '@playwright/test';
import { mkdirSync,writeFileSync } from 'node:fs';
import { mockGamepads,connectPad,pressPad } from '../helpers/gamepad';
const directory='screenshots/frost-seal',report='docs/frost-seal';
async function start(page:Page){
  await page.addInitScript(()=>Object.defineProperty(HTMLElement.prototype,'requestFullscreen',{value:undefined}));await page.goto('/?test=1');await page.getByRole('button',{name:'Роща осколков',exact:true}).click();await page.getByRole('button',{name:/^Начать забег/}).click();
  await page.evaluate(()=>{
    const w=window.__PIXEL__!.world;w.options.spawnRate=0;w.elapsed=601;w.experience.level=40;w.encounterDirector.nextAt=1e9;w.player.invulnerableUntil=1e9;w.enemies=[];for(const a of Object.values(w.abilities))a.level=0;w.ultimate.choose(w,'frost');
    for(let i=0;i<18;i++){const a=i*Math.PI*2/18;const e=w.spawn((['tank','runner','caster','rusher','splitter','grunt'] as const)[i%6],{x:Math.cos(a)*(90+i%3*25),y:Math.sin(a)*(65+i%3*15)})!;e.hp=e.maxHp=1e6;}
    for(const [i,kind]of (['charger','sorcerer','eclipse'] as const).entries()){const e=w.spawn(kind,{x:(i-1)*145,y:-90})!;e.hp=e.maxHp=1e6;e.boss!.until=w.elapsed+2;e.boss!.magic=undefined;}
    for(let i=0;i<3;i++){const e=w.spawn('guardian',{x:(i-1)*145,y:105})!;e.hp=e.maxHp=1e6;}w.guardianSystem.finalizePlacement(w,w.guardians.map(e=>e.id));
  });mkdirSync(directory,{recursive:true});mkdirSync(report,{recursive:true});
}
for(const [width,height]of [[1280,720],[844,390],[1024,768]])test(`Eternal Winter real eight-frame ritual and shared thaw ${width}`,async({browser,baseURL})=>{
  test.setTimeout(30000);const context=await browser.newContext({baseURL,viewport:{width,height},hasTouch:width!==1280}),page=await context.newPage(),errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await start(page);await page.waitForTimeout(120);await page.screenshot({path:`${directory}/before-${width}.png`});
  if(width===1280)await page.keyboard.press('q');else await page.locator('.ultimate-control').dispatchEvent('pointerdown',{pointerId:48,pointerType:'touch'});
  const recording=page.evaluate(async()=>{
    const w=window.__PIXEL__!.world;await new Promise<void>(resolve=>{const frame=()=>w.ultimate.sequence?resolve():requestAnimationFrame(frame);frame();});
    const f=w.ultimate.frost,origin={...f.origin},rows:{age:number;phase:string;nova:string|null;frozen:number;states:{id:number;x:number;y:number;until:number;phase:string;frame:string}[];png:string}[]=[];let next=0;
    const thresholds=[.2,.38,.56,.8,1.3,2,4.95,8.95];
    await new Promise<void>(resolve=>{const frame=()=>{const age=w.elapsed-f.started;if(next<8&&age>=thresholds[next]){next++;const art=window.__PIXEL__!.art(),actors=art.actors;rows.push({age,phase:art.ultimate.frost.phase,nova:art.ultimate.frost.nova?.frame??null,frozen:art.ultimate.frost.frozen,states:w.enemies.map(e=>({id:e.id,x:e.x,y:e.y,until:e.ultimateFreeze?.until??0,phase:e.boss?.phase??w.guardianSystem.encounters.get(e.id)?.phase??'',frame:String(actors.find(a=>Math.abs(a.x-e.x)<1&&Math.abs(a.y-e.y)<1)?.frame??'')})),png:document.querySelector('canvas')!.toDataURL('image/png')});}if(next<8)requestAnimationFrame(frame);else resolve();};requestAnimationFrame(frame);});
    return{origin,radius:f.radius,viewport:{...w.ultimate.viewport},activeAt:f.activeAt,endsAt:f.endsAt,thawsAt:f.thawsAt,started:f.started,rows,charge:w.ultimate.charge,audio:window.__PIXEL__!.audio(),metrics:window.__PIXEL__!.metrics()};
  });
  await page.waitForTimeout(1150);await page.keyboard.down('d');await page.waitForTimeout(160);await page.keyboard.up('d');const result=await recording;
  expect(result.rows.map(r=>r.phase)).toEqual(['invocation','invocation','creation','activation','field','field','idle','idle']);expect(result.rows[2].nova).toMatch(/^frost-nova-ultimate-/);expect(result.rows[4].frozen).toBe(24);expect(result.rows[6].frozen).toBe(24);expect(result.rows[6].nova).toBeNull();expect(result.rows[7].frozen).toBe(0);
  expect(result.radius).toBeCloseTo(Math.hypot(result.viewport.width,result.viewport.height)/4);
  expect(result.endsAt-result.activeAt).toBe(4);expect(result.thawsAt-result.endsAt).toBe(4);expect(result.charge).toBe(0);
  expect(result.rows[5].states).toEqual(result.rows[4].states);expect(result.rows[6].states).toEqual(result.rows[4].states);expect(result.rows[7].states.some((e,i)=>e.x!==result.rows[6].states[i].x||e.y!==result.rows[6].states[i].y)).toBe(true);
  for(const event of ['ultimate.frost','ultimate.frostImpact','ultimate.frostSeal']as const)expect(result.audio.played[event]).toBe(1);expect(result.audio.tracks).toBe(0);expect(result.audio.music).toMatchObject({current:'boss',playing:1,players:2});expect(result.audio.peakLoops).toBeLessThanOrEqual(3);
  for(const [i,r] of result.rows.entries())writeFileSync(`${directory}/${['01-staff','02-cold','03-dark-rune','04-cyan-wave','05-frozen','06-boss-frozen','07-residual','08-thawed'][i]}-${width}.png`,Buffer.from(r.png.split(',')[1],'base64'));
  writeFileSync(`${report}/timeline-${width}.json`,JSON.stringify({...result,rows:result.rows.map(({png,...r})=>({...r,bytes:png.length})),errors},null,2));expect(errors).toEqual([]);await context.close();
});

test('Frost Y input, pause/upgrade guards, late entrant, mute and ten scene restarts',async({page})=>{
  test.setTimeout(40000);await mockGamepads(page);await start(page);await connectPad(page);await page.evaluate(()=>window.__PIXEL__!.world.pause());await pressPad(page,'ultimate');expect(await page.evaluate(()=>window.__PIXEL__!.world.ultimate.sequence)).toBe(0);
  await page.evaluate(()=>{const w=window.__PIXEL__!.world;w.resume();w.status='upgrade';});await page.keyboard.press('q');expect(await page.evaluate(()=>window.__PIXEL__!.world.ultimate.sequence)).toBe(0);
  await page.evaluate(()=>{window.__PIXEL__!.world.status='playing';});await page.waitForTimeout(80);await pressPad(page,'ultimate');await page.waitForFunction(()=>window.__PIXEL__!.art().ultimate.frost.phase==='field');
  await page.evaluate(()=>window.__PIXEL__!.world.pause());const frozen=await page.evaluate(()=>({elapsed:window.__PIXEL__!.world.elapsed,field:window.__PIXEL__!.art().ultimate.frost}));await page.waitForTimeout(160);expect(await page.evaluate(()=>({elapsed:window.__PIXEL__!.world.elapsed,field:window.__PIXEL__!.art().ultimate.frost}))).toEqual(frozen);
  await page.evaluate(()=>window.__PIXEL__!.world.resume());
  const entrant=await page.evaluate(()=>{const w=window.__PIXEL__!.world,e=w.spawn('tank',{x:w.ultimate.frost.origin.x+100,y:w.ultimate.frost.origin.y})!;return e.id;});await page.waitForFunction(id=>!!window.__PIXEL__!.world.enemies.find(e=>e.id===id)?.ultimateFreeze,entrant);
  expect(await page.evaluate(id=>{const w=window.__PIXEL__!.world;return w.enemies.find(e=>e.id===id)!.ultimateFreeze!.until===w.ultimate.frost.thawsAt;},entrant)).toBe(true);
  await page.evaluate(async()=>{const path='/src/game/events/bridge.ts',{commands}=await import(path);commands.emit({type:'settings',value:{volume:.3,muted:true,pixelScale:2,reducedMotion:true,reducedFlash:true}});});await expect.poll(()=>page.evaluate(()=>window.__PIXEL__!.audio().sources)).toBe(0);
  const samples=[];
  for(let i=0;i<10;i++){
    await page.evaluate(()=>window.__PIXEL__!.restartScene());await page.waitForFunction(()=>window.__PIXEL__!.world.status==='menu');samples.push(await page.evaluate(()=>{const a=window.__PIXEL__!.art();return{objects:a.objects,textures:a.textures.length,clock:a.clock,tweens:a.tweens,listeners:window.__PIXEL__!.listeners(),frost:a.ultimate.frost};}));
    if(i<9){await page.getByRole('button',{name:/^Начать забег/}).click();await page.evaluate(()=>{const w=window.__PIXEL__!.world;w.options.spawnRate=0;w.elapsed=601;w.experience.level=40;w.ultimate.choose(w,'frost');w.spawn('tank',{x:70,y:0});w.ultimate.activate(w);});await page.waitForFunction(()=>window.__PIXEL__!.art().ultimate.frost.frozen>0);}
  }
  for(const s of samples){expect(s).toEqual(samples[0]);expect(s.frost).toMatchObject({phase:'idle',nova:null,frozen:0});expect(s.clock).toEqual([0,0,0]);}writeFileSync(`${report}/restarts.json`,JSON.stringify(samples,null,2));
});

for(const [width,height]of [[1280,720],[844,390],[1024,768]])test(`Frost150+3+3 controlled render and owner clocks ${width}`,async({browser,baseURL})=>{
  const context=await browser.newContext({baseURL,viewport:{width,height},hasTouch:width!==1280}),page=await context.newPage();await start(page);
  await page.evaluate(()=>{
    const w=window.__PIXEL__!.world;w.enemies=[];w.elapsed=1170;w.stats.cooldown=.01;
    for(const a of Object.values(w.abilities)){a.level=5;a.readyAt=w.elapsed+.2;}
    for(let i=0;i<150;i++){const e=w.spawn((['grunt','runner','tank','caster','rusher','splitter']as const)[i%6],{x:(i%15-7)*18,y:(Math.floor(i/15)-5)*19})!;e.hp=e.maxHp=1e9;}
    for(const [i,kind]of (['charger','sorcerer','eclipse']as const).entries()){const e=w.spawn(kind,{x:160,y:(i-1)*70})!;e.hp=e.maxHp=1e9;e.boss!.until=w.elapsed+2;e.boss!.magic=undefined;}
    for(let i=0;i<3;i++){const e=w.spawn('guardian',{x:-160,y:(i-1)*70})!;e.hp=e.maxHp=1e9;}w.guardianSystem.finalizePlacement(w,w.guardians.map(e=>e.id));
  });
  const result=await page.evaluate(async()=>{
    const w=window.__PIXEL__!.world,rows:{delta:number;age:number;frozen:number;objects:number;timers:(number|null)[]}[]=[];let previous=performance.now(),png='';w.ultimate.activate(w);
    await new Promise<void>(resolve=>{const frame=(now:number)=>{const a=window.__PIXEL__!.art(),age=w.elapsed-w.ultimate.started;rows.push({delta:now-previous,age,frozen:a.ultimate.frost.frozen,objects:a.objects,timers:a.clock});previous=now;if(!png&&age>=1.5)png=document.querySelector('canvas')!.toDataURL('image/png');if(age<5)requestAnimationFrame(frame);else resolve();};requestAnimationFrame(frame);});
    return{rows,png,metrics:window.__PIXEL__!.metrics(),frost:window.__PIXEL__!.art().ultimate.frost,audio:window.__PIXEL__!.audio()};
  });
  expect(result.rows.some(r=>r.frozen===156)).toBe(true);expect(result.rows.every(r=>r.timers.every(t=>t===0))).toBe(true);expect(result.frost.nova).toBeNull();expect(result.metrics.enemies).toBe(150);expect(result.metrics.bosses).toBe(3);expect(result.metrics.guardians).toBe(3);
  const times=result.rows.map(r=>r.delta).filter(d=>d>0).sort((a,b)=>a-b),median=times[Math.floor(times.length*.5)],p95=times[Math.floor(times.length*.95)];expect(p95).toBeLessThan(34);expect(1000/median).toBeGreaterThan(45);expect(result.audio.peakLoops).toBeLessThanOrEqual(3);
  writeFileSync(`${directory}/stress-${width}.png`,Buffer.from(result.png.split(',')[1],'base64'));writeFileSync(`${report}/performance-${width}.json`,JSON.stringify({...result,png:undefined,medianFps:1000/median,p95FrameMs:p95},null,2));await context.close();
});
