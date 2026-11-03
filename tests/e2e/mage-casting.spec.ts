import { expect, test, type Page } from '@playwright/test';
import { mkdirSync, writeFileSync, readdirSync, unlinkSync } from 'node:fs';
import type { MageSpell } from '../../src/game/art/MageCastingController';
const directory='screenshots/mage-casting';
async function reset(page: Page) {
  await page.evaluate(async()=>{
    const path='/src/game/events/bridge.ts',{commands}=await import(path);commands.emit({type:'restart',character:'mage',biome:'grove'});
    const w=window.__PIXEL__!.world;w.options.spawnRate=0;w.encounterDirector.nextAt=1e6;w.mobility.protectedUntil=1e6;for(const a of Object.values(w.abilities))a.level=0;
  });
  await page.waitForTimeout(35);
}
async function record(page: Page, spell: MageSpell | null, duration: number, late=false) {
  return page.evaluate(async({spell,duration,late})=>{
    const w=window.__PIXEL__!.world,canvas=document.querySelector('canvas')!,crop=document.createElement('canvas');crop.width=160;crop.height=180;const g=crop.getContext('2d')!;
    const before={...window.__PIXEL__!.art().casting.requested};
    if(spell){for(let i=0;i<3;i++){const e=w.spawn('tank',{x:w.player.x+80+i*12,y:w.player.y-20+i*18})!;e.speed=0;e.hp=e.maxHp=1e6;}w.abilities[spell].level=5;w.abilities[spell].readyAt=0;}
    if(late){w.elapsed=600;w.experience.level=45;w.stats.cooldown=.01;for(const d of w.abilityDefinitions){w.abilities[d.id].level=5;w.abilities[d.id].readyAt=0;}for(let i=0;i<150;i++)w.spawn((['tank','grunt','caster','runner','rusher','splitter'] as const)[i%6],{x:(i%15-7)*18,y:(Math.floor(i/15)-4)*22});for(const kind of ['charger','sorcerer','eclipse'] as const)w.spawn(kind,{x:80,y:-70});for(let i=0;i<3;i++){const e=w.spawn('guardian',{x:(i-1)*80,y:-80})!;e.discovered=true;}for(const e of w.guardians)w.damageEnemy(e,1);for(const e of w.enemies)e.hp=e.maxHp=1e6;}
    type Casting=ReturnType<NonNullable<Window['__PIXEL__']>['art']>['casting'];
    const frames:{at:number;elapsed:number;player:{x:number;y:number};status:string;body:string;casting:Casting;png:string}[]=[];let full='',previous=-Infinity,blocked=false;const begin=performance.now(),worldStart=w.elapsed;
    await new Promise<void>(resolve=>{const capture=()=>{
      const age=performance.now()-begin;
      if(spell==='shield'&&!blocked&&w.elapsed-worldStart>.43){blocked=true;w.mobility.protectedUntil=w.player.invulnerableUntil=0;w.damagePlayer(10);}
      if(age-previous>=28){previous=age;g.clearRect(0,0,160,180);g.drawImage(canvas,Math.floor(canvas.width/2)-80,Math.floor(canvas.height/2)-90,160,180,0,0,160,180);const c=window.__PIXEL__!.art().casting;frames.push({at:age,elapsed:w.elapsed,player:{x:w.player.x,y:w.player.y},status:w.status,body:window.__PIXEL__!.art().heroFrame,casting:c,png:crop.toDataURL('image/png')});if(!full&&age>(late?1500:spell==='meteor'?450:110))full=canvas.toDataURL('image/png');}
      if(age<duration)requestAnimationFrame(capture);else resolve();
    };requestAnimationFrame(capture);});
    return{before,frames,full,damage:w.snapshot().damageByAbility,metrics:window.__PIXEL__!.metrics()};
  },{spell,duration,late});
}

for(const width of [1280,390])test(`Mage conductor real Canvas sequences, all spells, walking and Blink ${width}`,async({browser,baseURL})=>{
  test.setTimeout(90000);mkdirSync(directory,{recursive:true});
  const context=await browser.newContext({baseURL,viewport:{width,height:width===390?844:720},recordVideo:{dir:'.tmp/mage-casting/video',size:{width,height:width===390?844:720}}});
  const page=await context.newPage(),errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  const video=page.video();
  try{
    await page.goto('/?test=1');await page.getByRole('button',{name:'Начать забег'}).click();
    const cases:{name:string;spell:MageSpell|null;moving:boolean;ms:number;late?:boolean}[]=[
      {name:'idle',spell:null,moving:false,ms:600},{name:'walk',spell:null,moving:true,ms:750},
      ...(['fireball','frost','lightning','meteor','shield'] as const).map(spell=>({name:'walk-'+spell,spell,moving:true,ms:spell==='meteor'?1450:spell==='shield'?900:600})),
      {name:'blink',spell:'fireball',moving:true,ms:650},{name:'late-game-five-spells',spell:null,moving:true,ms:4000,late:true},
    ];
    const evidence=[];
    for(const scenario of cases){
      await reset(page);if(scenario.moving){await page.keyboard.down('d');await page.waitForFunction(()=>window.__PIXEL__!.world.player.x>0&&window.__PIXEL__!.art().heroFrame.includes('-walk-'));}
      const recording=record(page,scenario.spell,scenario.ms,scenario.late);
      if(scenario.name==='blink'){await page.waitForTimeout(130);await page.keyboard.press('Space');}
      // Keep a movement key held across direction changes: a key-up/key-down
      // gap legitimately renders idle and is not part of this continuous-walk case.
      if(scenario.late){let previous='d';for(const key of ['s','a','w','d']){await page.waitForTimeout(750);await page.keyboard.down(key);await page.keyboard.up(previous);previous=key;}}
      const result=await recording;if(scenario.moving)await page.keyboard.up('d');
      const active=result.frames.filter(f=>f.casting.visible),motion=result.frames.at(-1)!.player.x-result.frames[0].player.x;
      if(scenario.moving){expect(motion).toBeGreaterThan(10);expect(new Set(result.frames.map(f=>f.body)).size).toBeGreaterThan(3);for(const frame of active)expect(frame.body).toContain('-walk-');}
      if(scenario.spell){expect(result.frames.at(-1)!.casting.requested[scenario.spell]).toBeGreaterThan(result.before[scenario.spell]);expect(active.length).toBeGreaterThanOrEqual(2);}
      if(scenario.spell&&scenario.name!=='blink')expect(new Set(active.map(f=>f.casting.armsFrame)).size).toBeGreaterThanOrEqual(3);
      if(scenario.spell==='meteor')expect(Math.max(...active.map(f=>f.casting.active?.beats??0))).toBe(3);
      if(scenario.name==='blink'){const blink=result.frames.filter(f=>f.casting.mode==='blink');expect(blink.length).toBeGreaterThan(0);for(const row of blink){expect(row.casting.visible).toBe(false);expect(row.casting.x).toBeCloseTo(row.player.x);}}
      if(scenario.late){expect(result.metrics.enemies).toBe(150);expect(result.metrics.bosses).toBe(3);expect(result.metrics.guardians).toBe(3);for(const ability of ['fireball','frost','lightning','meteor','shield'] as const)expect(result.frames.at(-1)!.casting.requested[ability]).toBeGreaterThan(result.before[ability]);expect(new Set(active.map(f=>f.casting.armsFrame)).size).toBeGreaterThan(5);}
      for(const row of active){expect(row.casting.width).toBe(24);expect(row.casting.height).toBe(30);expect(row.casting.origin).toEqual({x:.5,y:.75});expect(row.casting.pending).toBeLessThanOrEqual(1);}
      const prefix=`${directory}/${scenario.name}-${width}`;mkdirSync(prefix,{recursive:true});
      for(const file of readdirSync(prefix))if(/^\d{3}\.png$/.test(file))unlinkSync(`${prefix}/${file}`);
      writeFileSync(prefix+'.png',Buffer.from(result.full.split(',')[1],'base64'));
      result.frames.forEach((f,i)=>writeFileSync(`${prefix}/${String(i).padStart(3,'0')}.png`,Buffer.from(f.png.split(',')[1],'base64')));
      const unique=active.filter((f,i,rows)=>rows.findIndex(row=>row.casting.armsFrame===f.casting.armsFrame)===i);
      const eligible=scenario.spell&&scenario.name!=='blink'&&unique.length>=4?unique:active.length>=4?active:result.frames,chosen=Array.from({length:6},(_,i)=>eligible[Math.floor(i*(eligible.length-1)/5)]);
      const sheet=await context.newPage();await sheet.setViewportSize({width:960,height:208});await sheet.setContent(`<body style="margin:0;background:#101925;color:#eee;font:11px monospace;display:flex">${chosen.map(f=>`<div style="width:160px"><div>${Math.round(f.at)}ms · ${f.casting.frame} · ${f.casting.active?.ability??scenario.name}</div><img width="160" height="180" style="image-rendering:pixelated" src="${f.png}"></div>`).join('')}</body>`);await sheet.screenshot({path:prefix+'-filmstrip.png'});await sheet.close();
      const metadata={...result,full:undefined,frames:result.frames.map(({png,...row})=>({...row,sourceBytes:png.length}))};writeFileSync(prefix+'.json',JSON.stringify(metadata,null,2));evidence.push({scenario:scenario.name,frames:result.frames.length,active:active.length,bodyFrames:new Set(result.frames.map(f=>f.body)).size,armFrames:new Set(active.map(f=>f.casting.armsFrame)).size});
    }
    expect(errors).toEqual([]);writeFileSync(`${directory}/sequences-${width}.json`,JSON.stringify({evidence,errors},null,2));
  }finally{await context.close();if(video)await video.saveAs(`${directory}/mage-conductor-${width}.webm`);}
});

test('pause freezes walking and arms; damage/death win and ten scene restarts release all casting objects',async({page})=>{
  test.setTimeout(45000);await page.goto('/?test=1');await page.getByRole('button',{name:'Начать забег'}).click();await reset(page);
  await page.keyboard.down('d');await page.evaluate(()=>{const w=window.__PIXEL__!.world;w.abilities.meteor.level=5;const e=w.spawn('tank',{x:90,y:0})!;e.hp=1e6;e.speed=0;w.abilities.meteor.readyAt=0;});
  await expect.poll(()=>page.evaluate(()=>window.__PIXEL__!.art().casting.visible),{intervals:[10]}).toBe(true);
  await page.evaluate(()=>window.__PIXEL__!.world.pause());await page.waitForTimeout(40);const frozen=await page.evaluate(()=>({body:window.__PIXEL__!.art().heroFrame,casting:window.__PIXEL__!.art().casting,player:{...window.__PIXEL__!.world.player}}));
  await page.waitForTimeout(180);expect(await page.evaluate(()=>({body:window.__PIXEL__!.art().heroFrame,casting:window.__PIXEL__!.art().casting,player:{...window.__PIXEL__!.world.player}}))).toEqual(frozen);await page.keyboard.up('d');
  await page.evaluate(()=>{const w=window.__PIXEL__!.world;w.resume();w.mobility.protectedUntil=w.player.invulnerableUntil=0;w.shield.clearAbsorb();w.damagePlayer(20);});
  await expect.poll(()=>page.evaluate(()=>window.__PIXEL__!.art().casting.mode),{intervals:[10]}).toBe('hurt');expect(await page.evaluate(()=>window.__PIXEL__!.art().casting.visible)).toBe(false);
  await page.evaluate(()=>{const w=window.__PIXEL__!.world;w.player.invulnerableUntil=0;w.damagePlayer(99999);});await expect.poll(()=>page.evaluate(()=>window.__PIXEL__!.art().casting.mode)).toBe('death');expect(await page.evaluate(()=>window.__PIXEL__!.art().casting.visible)).toBe(false);
  const cycles=[];
  for(let i=0;i<10;i++){await page.evaluate(()=>window.__PIXEL__!.restartScene());await expect(page.getByRole('button',{name:'Начать забег'})).toBeVisible();await page.waitForTimeout(70);cycles.push(await page.evaluate(()=>{const a=window.__PIXEL__!.art();return{objects:a.objects,textures:a.textures,bytes:a.textureBytes,clock:a.clock,tweens:a.tweens,listeners:window.__PIXEL__!.listeners(),casting:a.casting.visible};}));}
  for(const row of cycles){expect(row).toEqual(cycles[0]);expect(row.casting).toBe(false);expect(row.clock).toEqual([0,0,0]);expect(row.tweens).toBe(0);}
  mkdirSync(directory,{recursive:true});writeFileSync(`${directory}/pause-priorities-restarts.json`,JSON.stringify({frozen,cycles},null,2));
});

test('original Mage head/feet stay pixel-identical in casting bodies and all arm clips have six distinct hard-alpha poses',async({page})=>{
  await page.goto('/?test=1');await page.waitForFunction(()=>!!window.__PIXEL__);
  const rows=await page.evaluate(async()=>{
    const oldImage=await createImageBitmap(await(await fetch('/assets/hd/mage.png')).blob()),newImage=await createImageBitmap(await(await fetch('/assets/hd/mage-casting.png')).blob());
    type Manifest={frames:Record<string,{frame:{x:number;y:number;w:number;h:number}}>};
    const old:Manifest=await(await fetch('/assets/hd/mage.json')).json(),next:Manifest=await(await fetch('/assets/hd/mage-casting.json')).json();
    const c=document.createElement('canvas');c.width=64;c.height=80;const g=c.getContext('2d',{willReadFrequently:true})!;
    const pixels=(image:ImageBitmap,f:{x:number;y:number;w:number;h:number})=>{g.clearRect(0,0,64,80);g.drawImage(image,f.x,f.y,f.w,f.h,0,0,64,80);return g.getImageData(0,0,64,80).data;};
    return Object.entries(next.frames).map(([name,{frame}])=>{const data=pixels(newImage,frame);let border=0,soft=0,hash=2166136261,different=0;const differences:number[][]=[];
      for(let i=0;i<data.length;i++){hash=Math.imul(hash^data[i],16777619);if(i%4===3&&data[i]){const n=(i-3)/4,x=n%64,y=Math.floor(n/64);if(!x||!y||x===63||y===79)border++;if(data[i]!==255)soft++;}}
      if(name.startsWith('body-')){const base=pixels(oldImage,old.frames[name.replace(/^body-(?:lean-)?/,'')].frame);for(let y=0;y<80;y++)for(let x=0;x<48;x++)if(y<36||y>=72)for(let k=0;k<4;k++)if(data[(y*64+x)*4+k]!==base[(y*64+x)*4+k]){different++;differences.push([x,y,k,base[(y*64+x)*4+k],data[(y*64+x)*4+k],base[(y*64+x)*4+3],data[(y*64+x)*4+3]]);}}
      return{name,border,soft,hash:hash>>>0,different,differences};
    });
  });
  mkdirSync('docs/mage-casting',{recursive:true});writeFileSync('docs/mage-casting/HEAD_FEET_QA.json',JSON.stringify(rows,null,2));
  expect(rows).toHaveLength(222);for(const row of rows){expect(row.border,row.name).toBe(0);expect(row.soft,row.name).toBe(0);expect(row.different,row.name).toBe(0);}
  for(const row of rows.filter(r=>r.name.endsWith('-0')&&r.name.startsWith('arms-'))){const stem=row.name.slice(0,-1),clip=rows.filter(r=>r.name.startsWith(stem));expect(clip).toHaveLength(6);expect(new Set(clip.map(r=>r.hash)).size,row.name).toBe(6);}
  mkdirSync('docs/mage-casting',{recursive:true});writeFileSync('docs/mage-casting/HEAD_FEET_QA.json',JSON.stringify(rows,null,2));
});
