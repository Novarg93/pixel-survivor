import {expect,test,type Page} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';
const dir='screenshots/final-boss';
interface ClipFrame {attack:string;age:number;png:string;x:number;y:number;scale:number}
async function saveSequence(page:Page,frames:ClipFrame[],path:string){
 const strip=await page.evaluate(async frames=>{
  const c=document.createElement('canvas');c.width=1536;c.height=Math.ceil(frames.length/6)*280;const g=c.getContext('2d')!;g.imageSmoothingEnabled=false;g.fillStyle='#243139';g.fillRect(0,0,c.width,c.height);g.font='12px monospace';
  for(const [i,f]of frames.entries()){const image=new Image();image.src=f.png;await image.decode();const x=i%6*256,y=Math.floor(i/6)*280;g.fillStyle='#eee3c8';g.fillText(f.attack+' '+f.age.toFixed(3)+'s',x+5,y+15);g.drawImage(image,f.x-96*.6548310811*f.scale,f.y-154*.6548310811*f.scale,192*.6548310811*f.scale,192*.6548310811*f.scale,x,y+24,256,256);}return c.toDataURL();
 },frames);writeFileSync(path,Buffer.from(strip.split(',')[1]!, 'base64'));
}
async function enter(page:Page){
  await page.addInitScript(()=>Object.defineProperty(HTMLElement.prototype,'requestFullscreen',{value:undefined}));
  await page.goto('/?test=1');await page.locator('.play-button').click();
  await page.evaluate(()=>{
    const w=window.__PIXEL__!.world;w.options.spawnRate=0;w.encounterDirector.nextAt=1200;w.experience.level=70;w.player.invulnerableUntil=1e9;w.elapsed=1199.96;w.enemies=[];
    for(const a of Object.values(w.abilities))a.level=0;
  });await page.waitForFunction(()=>window.__PIXEL__!.world.finalEncounter.phase==='intro');
}
for(const [width,height]of [[1280,720],[1920,1080],[844,390],[740,360],[1024,768]])test(`Warden real animations, ritual, frozen arena, death and cleanup ${width}`,async({browser,baseURL})=>{
  test.setTimeout(45000);mkdirSync(dir,{recursive:true});
  const context=await browser.newContext({baseURL,viewport:{width,height},hasTouch:width<1100,recordVideo:{dir:dir+'/videos',size:{width,height}}}),page=await context.newPage(),errors:string[]=[];
  page.on('pageerror',e=>errors.push(e.message));await enter(page);
  await page.waitForTimeout(1500);await page.screenshot({path:`${dir}/intro-${width}.png`});
  await page.waitForFunction(()=>window.__PIXEL__!.world.finalEncounter.phase==='phase1');
  await page.evaluate(()=>{const w=window.__PIXEL__!.world,e=w.finalEncounter.boss!;w.player.x=e.x+140;w.player.y=e.y;});
  const animation=await page.evaluate(async()=>{
    const w=window.__PIXEL__!.world,f=w.finalEncounter;f.nextCombo=f.bossClock;
    const frames:{attack:string;age:number;png:string;x:number;y:number;scale:number}[]=[],seen=new Set<string>();
    await new Promise<void>(resolve=>{const frame=()=>{const a=f.attack,key=a.kind+':'+Math.floor(a.age*12);if(a.kind!=='approach'&&!seen.has(key)){seen.add(key);const canvas=document.querySelector('canvas')!,scale=canvas.width/w.ultimate.viewport.width;frames.push({attack:a.kind,age:a.age,png:canvas.toDataURL('image/png'),scale,x:canvas.width/2+(f.boss!.x-w.player.x)*scale,y:canvas.height/2+(f.boss!.y-w.player.y)*scale});}if(f.diagnostics.combos&&a.kind==='approach')resolve();else requestAnimationFrame(frame);};requestAnimationFrame(frame);});return frames;
  });
  await saveSequence(page,animation,`${dir}/animation-sequence-${width}.png`);
  expect(new Set(animation.map(f=>f.attack))).toEqual(new Set(['chargeWindup','chargeTravel','chargeBrake','swordWindup','swordActive','recovery']));
  for(const name of ['chargeWindup','chargeTravel','chargeBrake','swordWindup','swordActive','recovery']){const f=animation.find(f=>f.attack===name)!;writeFileSync(`${dir}/${name}-${width}.png`,Buffer.from(f.png.split(',')[1]!, 'base64'));}
  await page.evaluate(()=>{const w=window.__PIXEL__!.world;w.damageEnemy(w.finalEncounter.boss!,1e9);});
  await page.waitForFunction(()=>window.__PIXEL__!.world.finalEncounter.supports.size===3);
  await page.evaluate(()=>{const w=window.__PIXEL__!.world;w.player.x=w.finalEncounter.center.x+100;w.player.y=w.finalEncounter.center.y+55;});await page.waitForTimeout(80);
  await page.screenshot({path:`${dir}/ritual-3-${width}.png`});
  const vertices=await page.evaluate(()=>{const w=window.__PIXEL__!.world;return w.guardians.map(e=>({id:e.id,x:e.x,y:e.y}));});
  for(let i=0;i<2;i++){
    await page.evaluate(id=>{const w=window.__PIXEL__!.world;w.damageEnemy(w.enemies.find(e=>e.id===id)!,1e9);},vertices[i]!.id);
    await page.waitForTimeout(80);await page.screenshot({path:`${dir}/ritual-${2-i}-${width}.png`});
  }
  await page.evaluate(id=>{const w=window.__PIXEL__!.world,g=w.enemies.find(e=>e.id===id)!;w.player.x=g.x-80;w.player.y=g.y;w.finalEncounter.nextMeteor=w.finalEncounter.bossClock;},vertices[2]!.id);
  await page.waitForFunction(()=>window.__PIXEL__!.world.finalEncounter.meteors.some(m=>m.owner==='boss'));
  await page.screenshot({path:`${dir}/distant-meteor-${width}.png`});
  await page.evaluate(id=>{const w=window.__PIXEL__!.world;w.damageEnemy(w.enemies.find(e=>e.id===id)!,1e9);},vertices[2]!.id);
  expect(await page.evaluate(()=>window.__PIXEL__!.world.finalEncounter.meteors.filter(m=>m.owner==='boss'))).toEqual([]);
  await page.screenshot({path:`${dir}/shield-break-${width}.png`});
  await page.evaluate(()=>{const w=window.__PIXEL__!.world;w.damageEnemy(w.finalEncounter.boss!,1e9);});await page.waitForFunction(()=>window.__PIXEL__!.world.finalEncounter.phase==='phase3');
  await page.waitForFunction(()=>window.__PIXEL__!.world.finalEncounter.attack.kind==='approach');
  await page.evaluate(()=>{const w=window.__PIXEL__!.world,e=w.finalEncounter.boss!;w.player.x=e.x+80;w.player.y=e.y;});
  await expect.poll(()=>page.evaluate(()=>!!window.__PIXEL__!.art().finalBoss.pose?.clip.endsWith('-idle'))).toBe(true);
  await page.screenshot({path:`${dir}/phase3-stance-${width}.png`});
  await page.evaluate(()=>{const w=window.__PIXEL__!.world,e=w.finalEncounter.boss!;w.player.x=e.x+220;w.player.y=e.y;});
  await expect.poll(()=>page.evaluate(()=>!!window.__PIXEL__!.art().finalBoss.pose?.clip.endsWith('-walk'))).toBe(true);
  await page.screenshot({path:`${dir}/phase3-walk-${width}.png`});
  await page.evaluate(async()=>{const w=window.__PIXEL__!.world,e=w.finalEncounter.boss!,module='/src/game/systems/UltimateFreeze.ts',{freezeForUltimate}=await import(module);w.player.x=e.x+80;w.player.y=e.y;freezeForUltimate(e,w.elapsed,w.elapsed+8);});
  await page.waitForFunction(()=>window.__PIXEL__!.world.finalEncounter.meteors.some(m=>m.owner==='arena'));
  await page.screenshot({path:`${dir}/frozen-armageddon-${width}.png`});
  const geometry=await page.evaluate(()=>{const f=window.__PIXEL__!.world.finalEncounter;return{center:f.center,vertices:f.supports.size,meteorCount:f.meteors.length};});expect(geometry.meteorCount).toBe(5);
  await page.waitForTimeout(1550);await page.screenshot({path:`${dir}/armageddon-second-${width}.png`});
  await page.evaluate(()=>{const w=window.__PIXEL__!.world;w.damageEnemy(w.finalEncounter.boss!,1e9);});
  await page.waitForFunction(()=>window.__PIXEL__!.world.finalEncounter.phase==='dying');expect(await page.evaluate(()=>window.__PIXEL__!.world.outcome)).toBe('victory');
  const death=await page.evaluate(async()=>{
    const w=window.__PIXEL__!.world,f=w.finalEncounter,rows:ClipFrame[]=[];let previous=-1;
    await new Promise<void>(resolve=>{const frame=()=>{const age=window.__PIXEL__!.art().finalBoss.deathAge,index=Math.floor(age/.16);if(index!==previous){previous=index;const canvas=document.querySelector('canvas')!,scale=canvas.width/w.ultimate.viewport.width;rows.push({attack:'death',age,png:canvas.toDataURL(),scale,x:canvas.width/2+(f.boss!.x-w.player.x)*scale,y:canvas.height/2+(f.boss!.y-w.player.y)*scale});}if(age<1.75)requestAnimationFrame(frame);else resolve();};requestAnimationFrame(frame);});return rows;
  });
  await saveSequence(page,death,`${dir}/death-sequence-${width}.png`);writeFileSync(`${dir}/death-${width}.png`,Buffer.from(death.find(f=>f.age>.6)!.png.split(',')[1]!, 'base64'));
  await expect(page.getByRole('heading',{name:'Победа!',exact:true})).toBeVisible();await page.screenshot({path:`${dir}/victory-${width}.png`});
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('pixel-survivor-v1')!).records[0].completionKind)).toBe('final-boss');
  const restarts=[];for(let i=0;i<10;i++){await page.evaluate(()=>window.__PIXEL__!.restartScene());await page.waitForFunction(()=>window.__PIXEL__!.world.status==='menu');restarts.push(await page.evaluate(()=>{const a=window.__PIXEL__!.art();return{objects:a.objects,textures:a.textures.length,listeners:window.__PIXEL__!.listeners(),clock:a.clock};}));}
  for(const r of restarts)expect(r).toEqual(restarts[0]);expect(errors).toEqual([]);
  mkdirSync('docs/final-boss',{recursive:true});writeFileSync(`docs/final-boss/visual-${width}.json`,JSON.stringify({geometry,restarts,animation:animation.map(({png,...f})=>({...f,bytes:png.length})),errors},null,2));await context.close();
});

test('complete lawful encounter on real RAF without HP editing, invulnerability or manual support kills',async({page})=>{
  test.setTimeout(240000);mkdirSync(dir,{recursive:true});
  await page.addInitScript(()=>Object.defineProperty(HTMLElement.prototype,'requestFullscreen',{value:undefined}));await page.goto('/?test=1');await page.locator('.play-button').click();
  const result=await page.evaluate(async()=>{
    const module='/tests/helpers/finalBossTrial.ts',{finalBuild,finalPilot}=await import(module);
    const bridge='/src/game/events/bridge.ts',{commands}=await import(bridge),w=window.__PIXEL__!.world;w.options.spawnRate=0;w.encounterDirector.nextAt=1e9;w.enemies=[];const build=finalBuild(w,'typical','frost');
    const phases:{phase:string;at:number;hp:number}[]=[],frames:{phase:string;png:string}[]=[];let previous='';
    await new Promise<void>(resolve=>{const pilot=()=>{
      if(w.status==='over'){commands.emit({type:'move',input:{x:0,y:0}});resolve();return;}
      if(w.finalEncounter.active){const v=finalPilot(w);commands.emit({type:'move',input:v});if(w.ultimate.charge===10)w.ultimate.activate(w);else w.mobility.activate(w,v.x||v.y?v:{x:0,y:1});}
      if(w.finalEncounter.phase!==previous){previous=w.finalEncounter.phase;phases.push({phase:previous,at:w.elapsed,hp:w.player.hp});frames.push({phase:previous,png:document.querySelector('canvas')!.toDataURL('image/png')});}
      requestAnimationFrame(pilot);
    };requestAnimationFrame(pilot);});
    return{build,phases,frames,outcome:w.outcome,duration:w.finalEncounter.clock,hp:w.player.hp,stats:w.finalEncounter.diagnostics,blinks:w.mobility.sequence};
  });
  writeFileSync('docs/final-boss/real-raf-fight.json',JSON.stringify({...result,frames:result.frames.map(({png,...f})=>({...f,bytes:png.length}))},null,2));
  for(const f of result.frames)writeFileSync(`${dir}/real-fight-${f.phase}.png`,Buffer.from(f.png.split(',')[1]!, 'base64'));
  expect(result.outcome).toBe('victory');expect(result.hp).toBeGreaterThan(0);expect(result.stats.gates).toBe(2);expect(result.phases.some(p=>p.phase==='ritual1')).toBe(true);
});
