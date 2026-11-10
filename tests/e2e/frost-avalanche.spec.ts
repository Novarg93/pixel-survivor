import { expect,test } from '@playwright/test';
import { mkdirSync,writeFileSync } from 'node:fs';
const dir='screenshots/frost-avalanche';
for(const [width,height] of [[1280,720],[844,390]])test(`Frost avalanche real sweep, kills, pause and teardown ${width}`,async({page})=>{
  mkdirSync(dir,{recursive:true});const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize({width,height});
  await page.addInitScript(()=>Object.defineProperty(HTMLElement.prototype,'requestFullscreen',{value:undefined}));
  await page.goto('/?test=1');await page.getByRole('button',{name:/^Начать забег/}).click();
  const result=await page.evaluate(async()=>{
    const w=window.__PIXEL__!.world;w.options.spawnRate=0;w.elapsed=900;w.experience.level=70;w.encounterDirector.nextAt=1e9;w.player.invulnerableUntil=1e9;w.enemies=[];
    for(const a of Object.values(w.abilities))a.level=0;
    w.ultimate.choose(w,'frost');w.ultimate.activate(w);const f=w.ultimate.frost;
    const ids=[.24,.62,.96,1.3].map((p,i)=>{const e=w.spawn(i%2?'runner':'grunt',{x:f.radius*p,y:0})!;e.speed=0;return e.id;});
    const survivor=w.spawn('tank',{x:-f.radius*.6,y:0},true)!;survivor.hp=survivor.maxHp=1e6;survivor.speed=0;
    const boss=w.spawn('charger',{x:0,y:-f.radius*.5})!;boss.speed=0;boss.boss!.until=1e9;
    const hits:{id:number;at:number;frozen:boolean}[]=[],damage=w.damageEnemy.bind(w);
    w.damageEnemy=(e,n,source,cap,execute)=>{if(source==='ultimate-frost')hits.push({id:e.id,at:w.elapsed,frozen:!!e.ultimateFreeze});return damage(e,n,source,cap,execute);};
    const frames:{age:number;radius:number;visible:boolean;alive:number[];png:string}[]=[],thresholds=[.98,1.2,1.5,1.82,2.05];let index=0;
    await new Promise<void>(resolve=>{const frame=()=>{const age=w.elapsed-f.started;
      if(index<thresholds.length&&age>=thresholds[index]!){index++;const view=f.view(w.elapsed);frames.push({age,radius:f.radius*view.avalanche,visible:view.avalancheVisible,alive:w.enemies.map(e=>e.id),png:document.querySelector('canvas')!.toDataURL('image/png')});}
      if(index<thresholds.length)requestAnimationFrame(frame);else resolve();};requestAnimationFrame(frame);});
    return{ids,hits,frames,radius:f.radius,kills:w.kills,bossDamage:boss.maxHp-boss.hp,bossMax:boss.maxHp,damage:w.snapshot().ultimateDamage?.frost,clock:window.__PIXEL__!.art().clock};
  });
  expect(result.frames[0]!.visible).toBe(false);expect(result.frames[0]!.alive).toEqual(expect.arrayContaining(result.ids));
  const sweep=result.frames.slice(1,4);expect(sweep.every(f=>f.visible)).toBe(true);expect(sweep[0]!.radius).toBeLessThan(sweep[1]!.radius);expect(sweep[1]!.radius).toBeLessThan(sweep[2]!.radius);expect(sweep[2]!.radius).toBeLessThanOrEqual(result.radius);
  expect(result.frames.at(-1)!.visible).toBe(false);expect(result.frames.at(-1)!.alive).toContain(result.ids[3]);
  expect(result.kills).toBe(3);expect(new Set(result.hits.map(h=>h.id)).size).toBe(result.hits.length);expect(result.hits.every(h=>h.frozen)).toBe(true);expect(result.hits.find(h=>h.id===result.ids[0])!.at).toBeLessThan(result.hits.find(h=>h.id===result.ids[2])!.at);
  expect(result.bossDamage).toBeLessThanOrEqual(result.bossMax*.08+1e-6);expect(result.damage).toBeGreaterThan(0);expect(result.clock).toEqual([0,0,0]);
  for(const [i,f] of result.frames.entries())writeFileSync(`${dir}/wave-${i}-${width}.png`,Buffer.from(f.png.split(',')[1]!, 'base64'));
  // Pause a second live wave midway; its radius and damage stay fixed on actual RAF frames.
  await page.evaluate(()=>{const w=window.__PIXEL__!.world;w.elapsed=w.ultimate.activeUntil;w.ultimate.update(w);w.ultimate.charge=10;w.ultimate.activate(w);});
  await page.waitForFunction(()=>{const w=window.__PIXEL__!.world;return w.ultimate.frost.view(w.elapsed).avalanche>.4;});
  await page.evaluate(()=>window.__PIXEL__!.world.pause());await page.waitForTimeout(60);
  const paused=await page.evaluate(()=>({time:window.__PIXEL__!.world.elapsed,art:window.__PIXEL__!.art().ultimate.frost}));
  await page.waitForTimeout(150);expect(await page.evaluate(()=>({time:window.__PIXEL__!.world.elapsed,art:window.__PIXEL__!.art().ultimate.frost}))).toEqual(paused);
  await page.evaluate(()=>window.__PIXEL__!.restartScene());await page.waitForFunction(()=>window.__PIXEL__!.world.status==='menu');
  expect(await page.evaluate(()=>window.__PIXEL__!.art().ultimate.frost)).toMatchObject({phase:'idle',nova:null});
  expect(errors).toEqual([]);writeFileSync(`${dir}/review-${width}.json`,JSON.stringify({...result,frames:result.frames.map(({png,...f})=>({...f,bytes:png.length})),errors},null,2));
});
