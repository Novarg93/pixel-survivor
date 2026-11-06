import { expect,test,type Page } from '@playwright/test';
import { mkdirSync,readFileSync,writeFileSync } from 'node:fs';
import { mockGamepads,connectPad,pressPad } from '../helpers/gamepad';
const images='screenshots/fire-inferno/after',report='docs/fire-inferno';
async function start(page:Page){
  await page.addInitScript(()=>Object.defineProperty(HTMLElement.prototype,'requestFullscreen',{value:undefined}));
  await page.goto('/?test=1');await page.getByRole('button',{name:'Роща осколков',exact:true}).click();await page.getByRole('button',{name:/^Начать забег/}).click();
  await page.evaluate(()=>{
    const w=window.__PIXEL__!.world;w.elapsed=601;w.experience.level=40;w.options.spawnRate=0;w.encounterDirector.nextAt=1e9;w.enemies=[];
    for(const a of Object.values(w.abilities))a.level=0;w.ultimate.choose(w,'fire');
  });mkdirSync(images,{recursive:true});mkdirSync(report,{recursive:true});
}
for(const [width,height]of [[1280,720],[844,390]])test(`Living Inferno real Canvas ignition, protection, burn and fade ${width}`,async({browser,baseURL})=>{
  test.setTimeout(35000);const context=await browser.newContext({baseURL,viewport:{width,height},hasTouch:width===844}),page=await context.newPage(),errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await start(page);
  await page.evaluate(()=>{const w=window.__PIXEL__!.world;for(let i=0;i<8;i++){const a=i*Math.PI/4,e=w.spawn('tank',{x:Math.cos(a)*65,y:Math.sin(a)*55})!;e.speed=0;e.hp=e.maxHp=1e6;}});
  await page.screenshot({path:`${images}/00-before-${width}.png`});
  if(width===1280)await page.keyboard.press('q');else await page.locator('.ultimate-control').dispatchEvent('pointerdown',{pointerId:91,pointerType:'touch'});
  const result=await page.evaluate(async()=>{
    const w=window.__PIXEL__!.world;await new Promise<void>(resolve=>{const frame=()=>w.ultimate.sequence?resolve():requestAnimationFrame(frame);frame();});
    const rows:{age:number;art:ReturnType<NonNullable<Window['__PIXEL__']>['art']>['ultimate']['fire'];hp:number;absorb:number;shots:number;absorbed:number;charge:number;png:string}[]=[];
    const times=[.08,.8,1.62,2.5,9.9,10.18,10.55];let next=0,shot=false;
    await new Promise<void>(resolve=>{const frame=()=>{
      const age=w.elapsed-w.ultimate.started;
      if(!shot&&age>=1.45){shot=true;w.shoot({x:w.player.x+176,y:w.player.y,vx:-120,vy:0,damage:30,hostile:true});}
      if(age>=times[next]){const art=window.__PIXEL__!.art();rows.push({age,art:art.ultimate.fire,hp:w.player.hp,absorb:w.absorb,shots:w.projectiles.filter(p=>p.hostile).length,absorbed:w.ultimate.fire.absorbed,charge:w.ultimate.charge,png:document.querySelector('canvas')!.toDataURL('image/png')});next++;}
      if(next<times.length)requestAnimationFrame(frame);else resolve();};requestAnimationFrame(frame);});
    return{rows,audio:window.__PIXEL__!.audio(),metrics:window.__PIXEL__!.metrics(),actors:window.__PIXEL__!.art().actors};
  });
  expect(result.rows.map(r=>r.art.phase)).toEqual(['ignition','form','form','form','form','fade','idle']);
  expect(result.rows[1].art).toMatchObject({bodyFlames:18,heatColumns:7,burning:8,ring:false});expect(result.rows[2].art.bursts).toBe(1);expect(result.rows[2].absorbed).toBe(1);expect(result.rows[2].shots).toBe(0);
  expect(new Set(result.rows.map(r=>r.hp)).size).toBe(1);expect(result.rows.every(r=>r.absorb===0&&r.charge===0)).toBe(true);
  expect(result.rows[5].art.glowAlpha).toBeGreaterThan(0);expect(result.rows[5].art.glowAlpha).toBeLessThan(result.rows[4].art.glowAlpha);
  expect(result.rows[6].art).toMatchObject({glowAlpha:0,bodyFlames:0,heatColumns:0,burning:0,bursts:0});
  expect(result.audio.played['ultimate.fire']).toBe(1);expect(result.audio.played['ultimate.singe']).toBe(1);expect(result.audio.peakLoops).toBeLessThanOrEqual(3);expect(result.audio.tracks).toBe(2);
  for(const [i,r]of result.rows.entries())writeFileSync(`${images}/${['01-ignition','02-form-ground-burn','03-projectile-singe','04-heat','07-end','08-fade','09-clear'][i]}-${width}.png`,Buffer.from(r.png.split(',')[1],'base64'));
  writeFileSync(`${report}/timeline-${width}.json`,JSON.stringify({...result,rows:result.rows.map(({png,...r})=>({...r,bytes:png.length})),errors},null,2));
  await page.keyboard.down('d');const x=await page.evaluate(()=>window.__PIXEL__!.world.player.x);await page.waitForTimeout(180);await page.keyboard.up('d');expect(await page.evaluate(()=>window.__PIXEL__!.world.player.x)).toBeGreaterThan(x);
  expect(errors).toEqual([]);await context.close();
});

test('Fire gamepad, pause guards, reduced effects, death and ten scene restarts release visuals/audio/listeners',async({page})=>{
  test.setTimeout(40000);await mockGamepads(page);await start(page);await connectPad(page);
  for(const status of ['paused','upgrade']as const){await page.evaluate(s=>{window.__PIXEL__!.world.status=s;},status);await pressPad(page,'ultimate');expect(await page.evaluate(()=>window.__PIXEL__!.world.ultimate.sequence)).toBe(0);}
  await page.evaluate(()=>{window.__PIXEL__!.world.status='playing';});await page.waitForTimeout(80);await pressPad(page,'ultimate');await page.waitForFunction(()=>window.__PIXEL__!.art().ultimate.fire.phase==='form');
  await page.evaluate(()=>window.__PIXEL__!.world.pause());const paused=await page.evaluate(()=>({elapsed:window.__PIXEL__!.world.elapsed,fire:window.__PIXEL__!.art().ultimate.fire}));await page.waitForTimeout(170);expect(await page.evaluate(()=>({elapsed:window.__PIXEL__!.world.elapsed,fire:window.__PIXEL__!.art().ultimate.fire}))).toEqual(paused);expect(await page.evaluate(()=>window.__PIXEL__!.audio().sources)).toBe(0);
  await page.evaluate(async()=>{const path='/src/game/events/bridge.ts',{commands}=await import(path);commands.emit({type:'settings',value:{volume:.3,muted:true,pixelScale:2,reducedMotion:true,reducedFlash:true,effectsIntensity:.5}});window.__PIXEL__!.world.resume();});
  await expect.poll(()=>page.evaluate(()=>window.__PIXEL__!.art().ultimate.fire.heatColumns)).toBe(3);expect(await page.evaluate(()=>window.__PIXEL__!.audio().sources)).toBe(0);await page.screenshot({path:`${images}/reduced-effects-1280.png`});
  await page.evaluate(()=>{const w=window.__PIXEL__!.world;w.damagePlayer(1e9);});await page.waitForTimeout(50);expect(await page.evaluate(()=>window.__PIXEL__!.art().ultimate.fire.phase)).toBe('idle');
  const samples=[];
  for(let i=0;i<10;i++){
    await page.evaluate(()=>window.__PIXEL__!.restartScene());await page.waitForFunction(()=>window.__PIXEL__!.world.status==='menu');samples.push(await page.evaluate(()=>{const a=window.__PIXEL__!.art();return{objects:a.objects,textures:a.textures.length,clock:a.clock,tweens:a.tweens,listeners:window.__PIXEL__!.listeners(),fire:a.ultimate.fire};}));
    if(i<9){await page.getByRole('button',{name:/^Начать забег/}).click();await page.evaluate(()=>{const w=window.__PIXEL__!.world;w.options.spawnRate=0;w.elapsed=601;w.experience.level=40;w.ultimate.choose(w,'fire');w.ultimate.activate(w);});await page.waitForFunction(()=>window.__PIXEL__!.art().ultimate.fire.bodyFlames>0);}
  }
  for(const sample of samples){expect(sample).toEqual(samples[0]);expect(sample.fire).toMatchObject({phase:'idle',glowAlpha:0,bodyFlames:0,burning:0,bursts:0});expect(sample.clock).toEqual([0,0,0]);}
  writeFileSync(`${report}/restarts.json`,JSON.stringify(samples,null,2));
});

for(const [width,height]of [[1280,720],[844,390]])test(`Fire 150+3+3 stable density render budget ${width}`,async({browser,baseURL})=>{
  test.setTimeout(35000);const context=await browser.newContext({baseURL,viewport:{width,height},hasTouch:width===844}),page=await context.newPage();await start(page);
  await page.evaluate(()=>{
    const w=window.__PIXEL__!.world;w.elapsed=1170;w.player.invulnerableUntil=1e9;w.stats.cooldown=.01;
    for(const a of Object.values(w.abilities)){a.level=5;a.readyAt=w.elapsed+.2;}
    for(let i=0;i<150;i++){const e=w.spawn((['grunt','runner','tank','caster','rusher','splitter']as const)[i%6],{x:(i%15-7)*14,y:(Math.floor(i/15)-5)*13})!;e.hp=e.maxHp=1e9;}
    for(const [i,kind]of (['charger','sorcerer','eclipse']as const).entries()){const e=w.spawn(kind,{x:85,y:(i-1)*55})!;e.hp=e.maxHp=1e9;}
    for(let i=0;i<3;i++){const e=w.spawn('guardian',{x:-85,y:(i-1)*55})!;e.hp=e.maxHp=1e9;}w.guardianSystem.finalizePlacement(w,w.guardians.map(e=>e.id));
    // Keep real AI/abilities/FX at a constant156 actors in both measurement windows.
    w.damageEnemy=()=>false;
  });
  const result=await page.evaluate(async()=>{
    const w=window.__PIXEL__!.world,start=w.elapsed,rows:{delta:number;active:boolean;burning:number;objects:number;bursts:number;clock:(number|null)[]}[]=[];let previous=performance.now(),activated=false,png='';
    await new Promise<void>(resolve=>{const frame=(now:number)=>{
      if(!activated&&w.elapsed-start>=1.8){w.ultimate.activate(w);activated=true;}
      const a=window.__PIXEL__!.art();rows.push({delta:now-previous,active:activated,burning:a.ultimate.fire.burning,objects:a.objects,bursts:a.ultimate.fire.bursts,clock:a.clock});previous=now;
      if(activated&&w.elapsed-w.ultimate.started>=1.2&&!png)png=document.querySelector('canvas')!.toDataURL('image/png');
      if(w.elapsed-start<4.8)requestAnimationFrame(frame);else resolve();};requestAnimationFrame(frame);});
    return{rows,png,metrics:window.__PIXEL__!.metrics(),audio:window.__PIXEL__!.audio(),fire:window.__PIXEL__!.art().ultimate.fire};
  });
  const summary=(active:boolean)=>{const values=result.rows.filter(r=>r.active===active).slice(15).map(r=>r.delta).sort((a,b)=>a-b);return{frames:values.length,median:values[Math.floor(values.length*.5)],p95:values[Math.floor(values.length*.95)],fps:1000/(values.reduce((a,b)=>a+b,0)/values.length)};};
  const baseline=summary(false),fire=summary(true);expect(result.metrics).toMatchObject({enemies:150,bosses:3,guardians:3});expect(result.rows.some(r=>r.burning>=100)).toBe(true);expect(result.rows.every(r=>r.clock.every(t=>t===0)&&r.bursts<=24)).toBe(true);
  expect(fire.median).toBeLessThan(Math.max(40,baseline.median*1.6+6));expect(fire.p95).toBeLessThan(Math.max(100,baseline.p95*2+12));expect(result.audio.peakLoops).toBeLessThanOrEqual(3);
  writeFileSync(`${images}/stress-${width}.png`,Buffer.from(result.png.split(',')[1],'base64'));writeFileSync(`${report}/stress-${width}.json`,JSON.stringify({...result,png:undefined,baseline,fire},null,2));await context.close();
});

test('Fire synthesis leaves all accepted non-Fire PCM bit-identical',async({page})=>{
  await page.goto('/?test=1');const pcm=await page.evaluate(async()=>{const s='/src/game/audio/synthesis.ts',c='/src/game/audio/catalog.ts',{synthesize}=await import(s),{PATCHES}=await import(c),rows:{id:string;hash:string}[]=[];for(const id of Object.keys(PATCHES)){if(id==='inferno'||id==='embers')continue;const data=synthesize(id),hash=await crypto.subtle.digest('SHA-256',data.buffer);rows.push({id,hash:Array.from(new Uint8Array(hash),b=>b.toString(16).padStart(2,'0')).join('')});}return rows;});
  const baseline=JSON.parse(readFileSync('tests/fixtures/non-fire-pcm.json','utf8')) as typeof pcm;expect(pcm).toEqual(baseline);
});
