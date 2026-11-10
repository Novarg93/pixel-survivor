import {expect,test,type Page} from '@playwright/test';
import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
const castPack=JSON.parse(readFileSync('src/game/art/mageCastManifestV2.json','utf8')) as typeof import('../../src/game/art/mageCastPackV2').MAGE_CAST_V2;
const runPack=JSON.parse(readFileSync('src/game/art/mageRunManifestV2.json','utf8')) as typeof import('../../src/game/art/mageRunPackV2').MAGE_RUN_V2;
const directions=[{id:'south',x:0,y:1,keys:['s']},{id:'south-east',x:1,y:1,keys:['s','d']},{id:'east',x:1,y:0,keys:['d']},{id:'north-east',x:1,y:-1,keys:['w','d']},{id:'north',x:0,y:-1,keys:['w']},{id:'north-west',x:-1,y:-1,keys:['w','a']},{id:'west',x:-1,y:0,keys:['a']},{id:'south-west',x:-1,y:1,keys:['s','a']}];
const root='screenshots/mage-cast-v2';
async function start(page:Page){
  await page.addInitScript(()=>Object.defineProperty(HTMLElement.prototype,'requestFullscreen',{value:undefined}));
  await page.goto('/?test=1');await page.getByRole('button',{name:'Начать забег'}).click();
  await page.addStyleTag({content:'.overlay{display:none!important}'});
  await page.evaluate(()=>{const w=window.__PIXEL__!.world;w.options.spawnRate=0;w.encounterDirector.nextAt=Infinity;w.enemies=[];w.mobility.protectedUntil=Infinity;w.player.invulnerableUntil=0;for(const a of Object.values(w.abilities))a.level=0;});
}
async function cast(page:Page,ability:'fireball'|'lightning',aim:typeof directions[number],keys:string[]){
  return page.evaluate(async({ability,aim,keys})=>{
    const w=window.__PIXEL__!.world;w.elapsed+=1;w.enemies=[];
    // Expire through World so its bounded pools reclaim objects between cases.
    for(const effect of w.effects)effect.expires=-1;for(const projectile of w.projectiles)projectile.expires=-1;
    w.resume();w.step(0);w.pause();w.feedbackEvents.length=0;
    const n=Math.hypot(aim.x,aim.y),enemy=w.spawn('tank',{x:w.player.x+aim.x/n*90,y:w.player.y+aim.y/n*90})!;enemy.speed=0;enemy.hp=enemy.maxHp=1e7;
    const path=ability==='fireball'?'/src/game/abilities/fireball.ts':'/src/game/abilities/chainLightning.ts',module=await import(path);
    w.resume();for(const key of keys)window.dispatchEvent(new KeyboardEvent('keydown',{key,code:'Key'+key.toUpperCase()}));
    w.abilities[ability].level=1;const ok=module[ability==='fireball'?'fireball':'chainLightning'](w);w.abilities[ability].level=0;
    if(!ok)throw Error('Real spell failed');return w.elapsed;
  },{ability,aim,keys});
}
for(const viewport of [{width:1280,height:720},{width:844,height:390}])test.describe('Authored casts '+viewport.width,()=>{
  test.use({viewport,hasTouch:viewport.width===844});
  test('authored casts cover all movement × target facings and both supplied variants',async({page})=>{
    test.setTimeout(180000);const dir=root+'/'+viewport.width;mkdirSync(dir,{recursive:true});const errors:string[]=[],records:unknown[]=[];
    page.on('pageerror',error=>errors.push(error.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
    await start(page);
    for(const move of directions){
      await page.evaluate(keys=>{window.__PIXEL__!.world.resume();for(const key of keys)window.dispatchEvent(new KeyboardEvent('keydown',{key,code:'Key'+key.toUpperCase()}));},move.keys);
      await expect.poll(()=>page.evaluate(()=>window.__PIXEL__!.art().casting.pose),{intervals:[20]}).toMatchObject({motion:'run',direction:move.id});
      const targets=directions;
      for(const aim of targets)for(const ability of ['fireball','lightning'] as const){
        const at=await cast(page,ability,aim,move.keys);
        await page.waitForFunction(({at,ability})=>{const a=window.__PIXEL__!.art().casting;if(a.active?.ability!==ability||a.active.started<at-.001||(a.pose?.progress??0)<.45||!a.authoredCast)return false;window.__PIXEL__!.world.pause();return true;},{at,ability},{polling:'raf'});
        await page.waitForTimeout(35);
        const art=await page.evaluate(()=>window.__PIXEL__!.art()),c=art.casting;
        expect(c.pose).toMatchObject({direction:aim.id,locomotion:{motion:'run',direction:move.id}});
        const id=aim.id.startsWith('north')?aim.id:(aim.id==='east'||aim.id==='west'?'east':'south')+'-v'+c.pose!.castVariant;
        expect(art.heroFrame).toContain('mage-run-v2-');expect(c.upperFrame).toContain('mage-cast-v2-'+id+'-');expect(c.authoredCast?.id).toBe(id);
        expect(c.pose?.phantom).toBeUndefined();expect(c.phantom.visible).toBe(false);expect(c.bodyCropped).toBe(true);expect(c.layered).toBe(true);expect(c.upperFrame).toContain('mage-cast-v2-');
        expect(c.pending).toBeLessThanOrEqual(1);expect(c.allocated).toBe(1);
        const body=art.actors.filter(a=>a.texture==='mage-run-v2');expect(c.upperTexture).toBe('mage-moving-cast-v2');expect(body).toHaveLength(1);expect(art.actors.filter(a=>a.texture.startsWith('mage-hero-v2-'))).toHaveLength(0);
        const flipX=aim.id==='west'||aim.id==='south-west',lowerBody=aim.id==='north'?'north':aim.id==='north-east'||aim.id==='north-west'?'north-east':'south',lowerFlip=['west','south-west','north-west'].includes(aim.id),pivot=runPack.clips[lowerBody].pivot;
        expect(c.authoredCast!.flipX).toBe(flipX);expect(c.running).toMatchObject({body:lowerBody,flipX:lowerFlip});expect(body[0]).toMatchObject({width:castPack.displaySize,height:castPack.displaySize,rotation:0,originX:(lowerFlip?96-pivot.x:pivot.x)/96,originY:pivot.y/96});expect(art.textureBytes).toBeLessThan(144*1024*1024);
        if(ability==='fireball'){
          const launch=art.spellOrigins.projectiles[0];expect(launch).toBeDefined();expect(launch!.hand.y).toBeLessThan(launch!.ground.y-5);
        }else{
          expect(art.spellOrigins.lightning).toHaveLength(1);expect(art.regularLightning.active[0]!.x).toBeCloseTo(c.hands[0]!.x);expect(art.regularLightning.active[0]!.y).toBeCloseTo(c.hands[0]!.y);
        }
        expect(art.clock).toEqual([0,0,0]);expect(art.tweens).toBe(0);
        const file=ability+'-'+move.id+'-to-'+aim.id+'.png';
        await page.screenshot({path:dir+'/'+file,clip:{x:viewport.width/2-75,y:viewport.height/2-105,width:150,height:165}});
        if(move.id==='north'&&aim.id==='south'&&ability==='fireball')await page.screenshot({path:dir+'/full-north-to-south.png'});
        records.push({ability,movement:move.id,target:aim.id,mode:'authored',body:art.heroFrame,castFrame:c.castFrame,authoredCast:c.authoredCast,hands:c.hands,origins:art.spellOrigins,textureBytes:art.textureBytes,screenshot:file});
      }
      await page.evaluate(()=>{const w=window.__PIXEL__!.world;w.elapsed+=1;w.resume();for(const key of ['w','a','s','d'])window.dispatchEvent(new KeyboardEvent('keyup',{key,code:'Key'+key.toUpperCase()}));});
      await page.waitForFunction(()=>window.__PIXEL__!.art().casting.pose?.motion==='idle');
    }
    expect(errors).toEqual([]);writeFileSync(dir+'/matrix.json',JSON.stringify({viewport,records,errors},null,2));
  });
});

test('real shots share the immediate authored gesture while Meteor owns the bounded body queue',async({page})=>{
  await start(page);await page.keyboard.down('d');await page.waitForFunction(()=>window.__PIXEL__!.art().casting.pose?.motion==='run'&&(window.__PIXEL__!.art().casting.pose?.age??0)>.2);
  const at=await page.evaluate(async()=>{
    const w=window.__PIXEL__!.world;const enemy=w.spawn('tank',{x:w.player.x-90,y:w.player.y})!;enemy.speed=0;enemy.hp=enemy.maxHp=1e7;
    for(const [path,name]of [['/src/game/abilities/meteor.ts','meteor'],['/src/game/abilities/fireball.ts','fireball'],['/src/game/abilities/chainLightning.ts','chainLightning']]){
      const spell=name==='chainLightning'?'lightning':name as 'meteor'|'fireball';w.abilities[spell].level=1;const m=await import(path!);m[name!](w);w.abilities[spell].level=0;
    }
    return w.elapsed;
  });
  await page.waitForFunction(at=>{const a=window.__PIXEL__!.art().casting;if(a.active?.ability!=='meteor'||(a.directional?.started??-1)<at-.02||!a.authoredCast||(a.pose?.progress??0)<.45)return false;window.__PIXEL__!.world.pause();return true;},at,{polling:'raf'});
  const c=await page.evaluate(()=>window.__PIXEL__!.art().casting);
  expect(c.phantom).toMatchObject({visible:false,allocated:0});expect(c.authoredCast).toMatchObject({flipX:true});expect(c.pose?.direction).toBe('west');
  expect(c.lowerFrame).toContain('mage-run-v2-south-');expect(c.upperFrame).toContain('mage-cast-v2-east-');expect(c.bodyCropped).toBe(true);expect(c.pending).toBeLessThanOrEqual(1);
});

test('Authored gesture returns to North Walk, freezes on pause and cleans up on interrupts/restarts',async({page})=>{
  test.setTimeout(60000);mkdirSync(root,{recursive:true});await start(page);await page.keyboard.down('w');await page.waitForFunction(()=>window.__PIXEL__!.art().casting.pose?.motion==='run'&&(window.__PIXEL__!.art().casting.pose?.age??0)>.2);
  await cast(page,'fireball',directions[0]!,['w']);
  const sequence=await page.evaluate(async()=>{
    const rows:ReturnType<NonNullable<Window['__PIXEL__']>['art']>['casting'][]=[];
    await new Promise<void>(resolve=>{const begin=performance.now();const tick=()=>{rows.push(window.__PIXEL__!.art().casting);if(performance.now()-begin<650)requestAnimationFrame(tick);else resolve();};requestAnimationFrame(tick);});return rows;
  });
  const visible=sequence.filter(r=>!!r.authoredCast);expect(visible.length).toBeGreaterThan(8);expect(new Set(visible.map(r=>r.lowerFrame)).size).toBeGreaterThanOrEqual(3);
  expect(visible.every(r=>r.lowerFrame.startsWith('mage-run-v2-south-')&&r.bodyCropped&&r.layered&&r.upperFrame.startsWith('mage-cast-v2-south-')&&r.pose?.direction==='south')).toBe(true);
  expect(sequence.at(-1)!.authoredCast).toBeUndefined();expect(sequence.at(-1)!.lowerFrame).toContain('mage-run-v2-north-');
  await cast(page,'lightning',directions[0]!,['w']);await page.waitForFunction(()=>{if(!window.__PIXEL__!.art().casting.authoredCast)return false;window.__PIXEL__!.world.pause();return true;});
  await page.waitForTimeout(35);const paused=await page.evaluate(()=>window.__PIXEL__!.art().casting);await page.waitForTimeout(100);expect(await page.evaluate(()=>window.__PIXEL__!.art().casting)).toEqual(paused);
  await page.evaluate(()=>{const w=window.__PIXEL__!.world;w.resume();w.mobility.protectedUntil=0;w.mobility.activate(w,{x:1,y:0});});
  await expect.poll(()=>page.evaluate(()=>window.__PIXEL__!.art().casting.active?.ability),{intervals:[10]}).toBe('blink');
  const blink=await page.evaluate(()=>window.__PIXEL__!.art().casting);expect(blink).toMatchObject({mode:'cast',visible:true,pose:{castAbility:'blink'}});expect(blink.authoredCast).toBeDefined();
  await page.waitForTimeout(250);await cast(page,'fireball',directions[0]!,['w']);await page.waitForFunction(()=>!!window.__PIXEL__!.art().casting.authoredCast);
  await page.evaluate(()=>{const w=window.__PIXEL__!.world;w.mobility.protectedUntil=w.player.invulnerableUntil=0;w.damagePlayer(20);});
  await expect.poll(()=>page.evaluate(()=>window.__PIXEL__!.art().casting.mode),{intervals:[10]}).toBe('hurt');expect(await page.evaluate(()=>window.__PIXEL__!.art().casting.authoredCast)).toBeUndefined();
  await page.evaluate(()=>{const w=window.__PIXEL__!.world;w.player.invulnerableUntil=0;w.damagePlayer(99999);});await expect.poll(()=>page.evaluate(()=>window.__PIXEL__!.art().casting.mode)).toBe('death');
  expect(await page.evaluate(()=>window.__PIXEL__!.art().casting.authoredCast)).toBeUndefined();
  const restarts=[];for(let i=0;i<10;i++){
    await page.evaluate(()=>window.__PIXEL__!.restartScene());await page.waitForFunction(()=>window.__PIXEL__?.world.status==='menu');await page.waitForTimeout(50);
    const state=await page.evaluate(()=>{const a=window.__PIXEL__!.art();return {objects:a.objects,textures:a.textures,bytes:a.textureBytes,clock:a.clock,tweens:a.tweens,listeners:window.__PIXEL__!.listeners(),phantom:a.casting.phantom,allocated:a.casting.allocated,origins:a.spellOrigins};});restarts.push(state);expect(state).toEqual(restarts[0]);expect(state.allocated).toBe(0);expect(state.origins).toEqual({projectiles:[],lightning:[]});
  }
  writeFileSync(root+'/lifecycle.json',JSON.stringify({sequence,restarts},null,2));
});
