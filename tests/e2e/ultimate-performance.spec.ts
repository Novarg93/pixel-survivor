import { expect,test } from '@playwright/test';
import { mkdirSync,writeFileSync } from 'node:fs';
for(const [width,height]of [[1280,720],[844,390],[1024,768]])for(const id of ['lightning','frost','fire'] as const)test(`${id} 150+3+3 live frame budget ${width}`,async({browser,baseURL})=>{
  test.setTimeout(30000);
  const context=await browser.newContext({viewport:{width,height},hasTouch:width!==1280,baseURL}),page=await context.newPage(),errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>Object.defineProperty(HTMLElement.prototype,'requestFullscreen',{value:undefined}));
  await page.goto('/?test=1');await page.getByRole('button',{name:/^Начать забег/}).click();
  await page.evaluate(id=>{
    const w=window.__PIXEL__!.world;w.elapsed=1170;w.experience.level=60;w.encounterDirector.nextAt=1e9;w.options.spawnRate=0;w.player.invulnerableUntil=1e9;w.stats.cooldown=.01;w.stats.damage=2.25;
    for(const a of w.abilityDefinitions){w.abilities[a.id].level=5;w.abilities[a.id].readyAt=w.elapsed+1.3;}
    w.ultimate.choose(w,id);w.ultimate.charge=10;w.facing={x:1,y:0};
    for(let i=0;i<150;i++){const e=w.spawn((['tank','grunt','runner','caster','rusher','splitter'] as const)[i%6],{x:30+i%15*15,y:(Math.floor(i/15)-5)*18})!;if(id!=='lightning')e.hp=e.maxHp=1e6;}
    for(const [i,kind]of (['charger','sorcerer','eclipse'] as const).entries()){const e=w.spawn(kind,{x:140,y:(i-1)*70})!;e.hp=e.maxHp=1e6;}
    for(let i=0;i<3;i++){const e=w.spawn('guardian',{x:220,y:(i-1)*100})!;e.hp=e.maxHp=1e6;}
    w.guardianSystem.finalizePlacement(w,w.guardians.map(e=>e.id));
  },id);
  const samples=await page.evaluate(async()=>{
    const w=window.__PIXEL__!.world,t0=performance.now();const success=w.ultimate.activate(w),activationMs=performance.now()-t0;
    const rows:{delta:number;at:number;hits:number;ash:number;trails:number;objects:number;timers:(number|null)[]}[]=[],begin=performance.now();let previous=begin;
    await new Promise<void>(resolve=>{const frame=(now:number)=>{const a=window.__PIXEL__!.art();rows.push({delta:now-previous,at:now-begin,hits:w.ultimate.nodes.length,ash:a.ultimate.allocatedAsh,trails:w.ultimate.trails.length,objects:a.objects,timers:a.clock});previous=now;if(now-begin<2400)requestAnimationFrame(frame);else resolve();};requestAnimationFrame(frame);});
    return{success,activationMs,rows,metrics:window.__PIXEL__!.metrics(),art:window.__PIXEL__!.art().ultimate,sequence:w.ultimate.sequence};
  });
  expect(samples.success).toBe(true);expect(samples.art.allocatedAsh).toBeLessThanOrEqual(16);expect(samples.rows.every(r=>r.trails<=12&&r.timers.every(t=>t===0))).toBe(true);
  const frames=samples.rows.map(r=>r.delta).filter(d=>d>0).sort((a,b)=>a-b),p95=frames[Math.floor(frames.length*.95)],median=frames[Math.floor(frames.length*.5)];
  mkdirSync('screenshots/ultimates',{recursive:true});mkdirSync('docs/ultimates/performance',{recursive:true});await page.screenshot({path:`screenshots/ultimates/${id}-stress-${width}.png`});
  const restarts=[];
  for(let i=0;i<3;i++){await page.evaluate(()=>window.__PIXEL__!.restartScene());await page.waitForFunction(()=>window.__PIXEL__!.world.status==='menu');restarts.push(await page.evaluate(()=>{const a=window.__PIXEL__!.art();return{objects:a.objects,textures:a.textures.length,clock:a.clock,tweens:a.tweens,listeners:window.__PIXEL__!.listeners(),ultimate:a.ultimate,selected:window.__PIXEL__!.world.ultimate.selected};}));}
  for(const row of restarts)expect(row).toEqual(restarts[0]);expect(errors).toEqual([]);
  writeFileSync(`docs/ultimates/performance/${id}-${width}.json`,JSON.stringify({fixture:'20:00,150mixed+3bosses+3Guardians,5rankV,highCDR,invulnerable player; Lightning normal HP for mass kill, others immortal regulars for constant load; 2.4s RAF',medianFps:1000/median,p95FrameMs:p95,...samples,restarts,errors},null,2));
  await context.close();
});
