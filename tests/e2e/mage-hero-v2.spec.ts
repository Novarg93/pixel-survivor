import {expect,test,type Page} from '@playwright/test';
import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import type {MageSpell} from '../../src/game/art/MageCastingController';
import type {UltimateId} from '../../src/game/config/ultimates';
const directions=[{id:'south',x:0,y:1,keys:['s']},{id:'south-east',x:1,y:1,keys:['s','d']},{id:'east',x:1,y:0,keys:['d']},{id:'north-east',x:1,y:-1,keys:['w','d']},{id:'north',x:0,y:-1,keys:['w']},{id:'north-west',x:-1,y:-1,keys:['w','a']},{id:'west',x:-1,y:0,keys:['a']},{id:'south-west',x:-1,y:1,keys:['s','a']}];
const root='screenshots/mage-hero-v2';
const run=JSON.parse(readFileSync('src/game/art/mageRunManifestV2.json','utf8')) as typeof import('../../src/game/art/mageRunPackV2').MAGE_RUN_V2;
async function start(page:Page){
  await page.goto('/?test=1');await page.getByRole('button',{name:'Начать забег'}).click();
  await page.addStyleTag({content:'.overlay{display:none!important}'});
  await page.evaluate(()=>{const w=window.__PIXEL__!.world;w.options.spawnRate=0;w.encounterDirector.nextAt=Infinity;w.enemies=[];for(const a of Object.values(w.abilities))a.level=0;});
}
async function advance(page:Page,seconds:number){
  await page.evaluate(seconds=>{const w=window.__PIXEL__!.world;w.resume();for(let t=0;t<seconds-1e-8;t+=.01)w.step(Math.min(.01,seconds-t));w.pause();},seconds);
  await page.waitForTimeout(60);
}
for(const viewport of [{width:1280,height:720},{width:390,height:844}]){
  test(`native Mage eight-direction running, fixed pivot, settled idle, pause and death ${viewport.width}`,async({page})=>{
    test.setTimeout(60000);const directory=`${root}/${viewport.width}`;mkdirSync(directory,{recursive:true});const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
    await page.setViewportSize(viewport);await start(page);
    const records=[];
    for(const d of directions){
      for(const key of d.keys)await page.keyboard.down(key);
      await expect.poll(()=>page.evaluate(()=>{const p=window.__PIXEL__!.art().casting.pose;return [p?.direction,p?.motion];}),{intervals:[15]}).toEqual([d.id,'run']);
      const art=await page.evaluate(()=>window.__PIXEL__!.art()),body=d.id==='north'?'north':d.id==='north-east'||d.id==='north-west'?'north-east':'south',flipX=['west','south-west','north-west'].includes(d.id),pivot=run.clips[body].pivot;
      const hero=art.actors.find(a=>a.texture==='mage-run-v2')!;
      expect(hero).toMatchObject({width:run.displaySize,height:run.displaySize,originX:(flipX?96-pivot.x:pivot.x)/96,originY:pivot.y/96,rotation:0,visible:true});
      expect(art.casting.running).toMatchObject({body,flipX});expect(art.heroFrame).toContain(`mage-run-v2-${body}-`);
      await page.locator('canvas').screenshot({path:`${directory}/walk-${d.id}.png`});records.push({direction:d.id,hero:art.heroFrame,pose:art.casting.pose});
      for(const key of d.keys)await page.keyboard.up(key);
      await expect.poll(()=>page.evaluate(()=>window.__PIXEL__!.art().casting.pose?.motion)).toBe('idle');
    }
    await page.evaluate(()=>window.__PIXEL__!.world.pause());await page.waitForTimeout(60);
    const frozen=await page.evaluate(()=>window.__PIXEL__!.art().casting);await page.waitForTimeout(130);
    expect(await page.evaluate(()=>window.__PIXEL__!.art().casting)).toEqual(frozen);
    await page.evaluate(()=>{const w=window.__PIXEL__!.world;w.resume();w.player.invulnerableUntil=0;w.damagePlayer(20);});
    await expect.poll(()=>page.evaluate(()=>window.__PIXEL__!.art().casting.mode),{intervals:[10]}).toBe('hurt');
    expect(await page.evaluate(()=>window.__PIXEL__!.art().heroFrame)).toMatch(/^mage-idle-v2-front-/);
    await page.evaluate(()=>{const w=window.__PIXEL__!.world;w.player.invulnerableUntil=0;w.damagePlayer(99999);});
    await expect.poll(()=>page.evaluate(()=>window.__PIXEL__!.art().heroFrame)).toContain('-death-');
    await page.waitForTimeout(950);expect(await page.evaluate(()=>window.__PIXEL__!.art().heroFrame)).toContain('-12');
    await page.locator('canvas').screenshot({path:`${directory}/death.png`});
    expect(errors).toEqual([]);writeFileSync(`${directory}/movement.json`,JSON.stringify({records,errors},null,2));
  });

  test(`native Mage five spells and exact three ultimate bindings in all eight directions ${viewport.width}`,async({page})=>{
    test.setTimeout(120000);const directory=`${root}/${viewport.width}/casting`;mkdirSync(directory,{recursive:true});const errors:string[]=[],records:unknown[]=[];page.on('pageerror',e=>errors.push(e.message));
    page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
    await page.setViewportSize(viewport);await start(page);let iteration=0;
    for(const ability of ['fireball','lightning','meteor','shield','frost','ultimate-lightning','ultimate-frost','ultimate-fire'] as const)for(const d of directions){
      const castAt=await page.evaluate(async({ability,d,iteration})=>{
        const w=window.__PIXEL__!.world;w.pause();w.clearTemporaryState();w.enemies=[];w.effects=[];w.impacts=[];w.zones=[];
        w.elapsed=610+iteration*3;w.experience.level=40;w.player.x=w.player.y=0;w.player.invulnerableUntil=0;w.facing={x:d.x,y:d.y};
        for(const a of Object.values(w.abilities)){a.level=0;a.readyAt=Infinity;}
        const length=Math.hypot(d.x,d.y);
        for(let i=0;i<3;i++){const e=w.spawn('tank',{x:d.x/length*90+(i-1)*3,y:d.y/length*90+(i-1)*3})!;e.speed=0;e.hp=e.maxHp=1e7;}
        if(ability.startsWith('ultimate-')){
          const id=ability.slice(9) as UltimateId;w.ultimate.choose(w,id);w.resume();if(!w.ultimate.activate(w))throw Error('Ultimate not activated '+id);
        }else{
          const spell=ability as MageSpell;w.abilities[spell].level=1;
          const paths={fireball:'/src/game/abilities/fireball.ts',lightning:'/src/game/abilities/chainLightning.ts',meteor:'/src/game/abilities/meteor.ts',shield:'/src/game/abilities/arcaneShield.ts',frost:'/src/game/abilities/frostNova.ts'};
          const module=await import(paths[spell]);const cast=module[{fireball:'fireball',lightning:'chainLightning',meteor:'meteor',shield:'arcaneShield',frost:'frostNova'}[spell]];
          w.resume();if(cast(w)===false)throw Error('Cast not activated '+spell);
        }
        return w.elapsed;
      },{ability,d,iteration:iteration++});
      if(ability==='shield'){
        await page.waitForFunction(()=>{const w=window.__PIXEL__!.world,a=window.__PIXEL__!.art().casting;if(w.shield.absorbValue(w.elapsed)<=0||a.active)return false;w.pause();return true;});
        const a=await page.evaluate(()=>window.__PIXEL__!.art().casting);expect(a.visible).toBe(false);expect(a.pending).toBe(0);
        records.push({ability,direction:d.id,gesture:false});continue;
      }
      await page.waitForFunction(({ability,castAt})=>{const a=window.__PIXEL__!.art().casting;if(a.active?.ability!==ability||a.active.started<castAt-.001||!a.visible)return false;window.__PIXEL__!.world.pause();return true;},{ability,castAt},{polling:'raf'});
      const duration=await page.evaluate(()=>window.__PIXEL__!.art().casting.active!.duration);await advance(page,duration*.35);
      const art=await page.evaluate(()=>window.__PIXEL__!.art()),motion=ability==='frost'||ability==='ultimate-fire'||ability==='ultimate-frost'?'defensive':ability==='ultimate-lightning'?'lightning':ability;
      expect(art.casting.pose).toMatchObject({motion,direction:d.id,casting:true});
      const id=d.id.startsWith('north')?d.id:(d.id==='east'||d.id==='west'?'east':'south')+'-v'+art.casting.pose!.castVariant;
      expect(art.heroFrame).toContain(`mage-cast-v2-${id}-`);expect(art.casting.phantom.visible).toBe(false);expect(art.casting.bodyCropped).toBe(false);
      expect(art.casting.nativeBody).toBe(true);expect(art.casting.allocated).toBe(0);
      expect(art.actors.filter(a=>a.texture==='mage-cast-v2')).toHaveLength(1);expect(art.actors.filter(a=>a.texture.startsWith('mage-hero-v2-'))).toHaveLength(0);
      expect(art.textures.some(t=>t==='hd-mage'||t==='hd-mage-casting')).toBe(false);
      if(ability==='ultimate-lightning'){
        await advance(page,.53-(await page.evaluate(()=>{const w=window.__PIXEL__!.world;return w.elapsed-w.ultimate.started;})));
        const a=await page.evaluate(()=>window.__PIXEL__!.art()),primary=a.ultimate.lightning.active.find(v=>v.kind==='primary')!;
        expect(a.casting.hands.some(h=>Math.hypot(h.x-primary.x,h.y-primary.y)<.001)).toBe(true);
      }
      await page.screenshot({path:`${directory}/${ability}-${d.id}.png`,clip:{x:viewport.width/2-85,y:viewport.height/2-115,width:170,height:165}});
      records.push({ability,direction:d.id,body:art.heroFrame,pose:art.casting.pose,hands:art.casting.hands});
    }
    expect(errors).toEqual([]);writeFileSync(`${directory}/evidence.json`,JSON.stringify({records,errors},null,2));
  });
}

test('native Mage mixed150+3boss+3Guardian render budget and clean scene restarts',async({page})=>{
  test.setTimeout(60000);mkdirSync(root,{recursive:true});const errors:string[]=[],measurements:unknown[]=[],cycles:unknown[]=[];page.on('pageerror',e=>errors.push(e.message));
  for(const viewport of [{width:1280,height:720},{width:390,height:844}]){
    await page.setViewportSize(viewport);await start(page);
    await page.evaluate(()=>{
      const w=window.__PIXEL__!.world;w.elapsed=900;w.experience.level=40;w.player.invulnerableUntil=Infinity;
      const kinds=['grunt','runner','tank','caster','rusher','splitter'] as const;
      for(let i=0;i<150;i++){const e=w.spawn(kinds[i%6],{x:(i%15-7)*27,y:(Math.floor(i/15)-4.5)*27},i%13===0)!;e.hp=e.maxHp=1e7;}
      for(const [i,kind]of (['charger','sorcerer','eclipse'] as const).entries()){const e=w.spawn(kind,{x:(i-1)*150,y:130})!;e.hp=e.maxHp=1e7;}
      for(let i=0;i<3;i++){const e=w.spawn('guardian',{x:(i-1)*170,y:-145})!;e.hp=e.maxHp=1e7;}
      for(const a of Object.values(w.abilities))a.level=5;
    });
    await page.waitForTimeout(500);
    const metrics=await page.evaluate(async()=>{
      const frames:number[]=[],updates:number[]=[],start=performance.now();let last=start;
      await new Promise<void>(resolve=>{const tick=(now:number)=>{frames.push(now-last);last=now;updates.push(window.__PIXEL__!.metrics().updateMs);if(now-start<3000)requestAnimationFrame(tick);else resolve();};requestAnimationFrame(tick);});
      frames.shift();frames.sort((a,b)=>a-b);updates.sort((a,b)=>a-b);const art=window.__PIXEL__!.art();
      const terrain=window.__PIXEL__!.atmosphere().environment;
      return {fps:1000/frames[Math.floor(frames.length/2)]!,frameP95:frames[Math.floor(frames.length*.95)],updateP95:updates[Math.floor(updates.length*.95)],regular:window.__PIXEL__!.world.regularCount,bytes:art.textureBytes,extraTerrainBytes:Math.max(0,terrain.surfaces-terrain.chunks)*256*256*4,chunks:terrain.chunks,surfaces:terrain.surfaces,objects:art.objects,clock:art.clock,tweens:art.tweens};
    });
    // The elapsed900 fixture is a terrain crossfade. Keep the144MiB baseline
    // cap and separately bound the one additional surface per visible chunk.
    expect(metrics.regular).toBe(150);expect(metrics.surfaces).toBeLessThanOrEqual(metrics.chunks*2);expect(metrics.bytes-metrics.extraTerrainBytes).toBeLessThan(144*1024*1024);expect(metrics.clock).toEqual([0,0,0]);expect(metrics.tweens).toBe(0);
    await page.locator('canvas').screenshot({path:`${root}/stress-${viewport.width}.png`});measurements.push({viewport,...metrics});
  }
  for(let i=0;i<10;i++){
    await page.evaluate(()=>window.__PIXEL__!.restartScene());await page.waitForFunction(()=>window.__PIXEL__?.world.status==='menu');await page.waitForTimeout(50);
    const a=await page.evaluate(()=>{const a=window.__PIXEL__!.art();return {objects:a.objects,textures:a.textures,bytes:a.textureBytes,clock:a.clock,tweens:a.tweens,listeners:window.__PIXEL__!.listeners(),casting:a.casting.visible,allocated:a.casting.allocated};});cycles.push(a);
    expect(a).toEqual(cycles[0]);expect(a.casting).toBe(false);expect(a.allocated).toBe(0);await expect(page.locator('canvas')).toHaveCount(1);
  }
  expect(errors).toEqual([]);writeFileSync(`${root}/performance.json`,JSON.stringify({measurements,cycles,errors},null,2));
});

test('lightning palm anchors touch the authored hand or its native energy pixels in all eight directions',async({page})=>{
  await start(page);
  const pack=JSON.parse(readFileSync('src/game/art/mageHeroManifest.json','utf8')) as {canvas:number;clips:Record<string,{sourceFiles:string[]}>};
  const result=await page.evaluate(async({directions,pack})=>{
    const modulePath='/src/game/art/MageHeroArt.ts',{mageHeroPalm}=await import(modulePath);
    const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=512;const g=canvas.getContext('2d')!,rows=[];
    for(const [i,d]of directions.entries()){
      const image=new Image();image.src='/'+pack.clips['lightning-'+d.id]!.sourceFiles[6];await image.decode();
      const c=document.createElement('canvas');c.width=c.height=256;const p=c.getContext('2d')!;p.drawImage(image,0,0);const data=p.getImageData(0,0,256,256).data;
      const palm=mageHeroPalm({motion:'lightning',direction:d.id,progress:.5,age:.5,casting:true});const x=Math.round(palm.x/pack.canvas*256),y=Math.round(palm.y/pack.canvas*256);let gold=0,cyan=0;
      for(let yy=y-5;yy<=y+5;yy++)for(let xx=x-5;xx<=x+5;xx++){
        const k=(yy*256+xx)*4,r=data[k]!,green=data[k+1]!,b=data[k+2]!;if(!data[k+3])continue;
        if(r>120&&green>60&&r>b*1.3)gold++;if(green>130&&b>130&&r<160)cyan++;
      }
      const dx=i%4*256,dy=Math.floor(i/4)*256;g.fillStyle='#182027';g.fillRect(dx,dy,256,256);g.drawImage(image,dx,dy);g.strokeStyle='#ff40e8';g.beginPath();g.moveTo(dx+x-4,dy+y);g.lineTo(dx+x+4,dy+y);g.moveTo(dx+x,dy+y-4);g.lineTo(dx+x,dy+y+4);g.stroke();rows.push({direction:d.id,x,y,gold,cyan});
    }
    return {rows,png:canvas.toDataURL()};
  },{directions,pack});
  for(const row of result.rows)expect(row.gold+row.cyan,row.direction).toBeGreaterThan(0);
  mkdirSync(root,{recursive:true});writeFileSync(`${root}/palm-source-audit.png`,Buffer.from(result.png.split(',')[1]!,'base64'));writeFileSync(`${root}/palm-source-audit.json`,JSON.stringify(result.rows,null,2));
});
