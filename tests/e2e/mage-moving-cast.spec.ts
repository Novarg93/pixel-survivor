import {expect,test} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';
const directions=[{id:'south',x:0,y:1,keys:['s']},{id:'south-east',x:1,y:1,keys:['s','d']},{id:'east',x:1,y:0,keys:['d']},{id:'north-east',x:1,y:-1,keys:['w','d']},{id:'north',x:0,y:-1,keys:['w']},{id:'north-west',x:-1,y:-1,keys:['w','a']},{id:'west',x:-1,y:0,keys:['a']},{id:'south-west',x:-1,y:1,keys:['s','a']}];
for(const width of [1280,390])test(`moving Mage keeps eight facings against targets behind and joins existing atlas clips ${width}`,async({page})=>{
  test.setTimeout(120000);const root=`screenshots/mage-moving-cast/${width}`;mkdirSync(root,{recursive:true});const errors:string[]=[],records:unknown[]=[];
  page.on('pageerror',e=>errors.push(e.message));await page.setViewportSize({width,height:width===390?844:720});
  await page.goto('/?test=1');await page.getByRole('button',{name:'Начать забег'}).click();await page.addStyleTag({content:'.overlay{display:none!important}'});
  await page.evaluate(()=>{const w=window.__PIXEL__!.world;w.options.spawnRate=0;w.encounterDirector.nextAt=Infinity;w.enemies=[];w.mobility.protectedUntil=Infinity;w.player.invulnerableUntil=0;for(const a of Object.values(w.abilities))a.level=0;});
  const baseline=await page.evaluate(()=>{const a=window.__PIXEL__!.art();return{bytes:a.textureBytes,textures:a.textures.filter(t=>!t.startsWith('chunk-'))};});
  for(const d of directions){
    for(const key of d.keys)await page.keyboard.down(key);
    await expect.poll(()=>page.evaluate(()=>window.__PIXEL__!.art().casting.pose),{intervals:[25]}).toMatchObject({motion:'run',direction:d.id});
    for(const ability of (width===390?['lightning'] as const:['fireball','lightning','meteor','frost'] as const)){
      const started=await page.evaluate(async({ability,d})=>{
        const w=window.__PIXEL__!.world;w.elapsed+=3;w.enemies=[];w.effects=[];w.impacts=[];w.zones=[];
        const length=Math.hypot(d.x,d.y),e=w.spawn('tank',{x:w.player.x-d.x/length*100,y:w.player.y-d.y/length*100})!;e.speed=0;e.hp=e.maxHp=1e7;
        const paths={fireball:'/src/game/abilities/fireball.ts',lightning:'/src/game/abilities/chainLightning.ts',meteor:'/src/game/abilities/meteor.ts',frost:'/src/game/abilities/frostNova.ts'},names={fireball:'fireball',lightning:'chainLightning',meteor:'meteor',frost:'frostNova'};
        const module=await import(paths[ability]);w.abilities[ability].level=1;module[names[ability]](w);w.abilities[ability].level=0;return w.elapsed;
      },{ability,d});
      await page.waitForFunction(({ability,started})=>{const a=window.__PIXEL__!.art().casting;if(a.active?.ability!==ability||a.active.started<started-.01||!a.authoredCast||(a.pose?.progress??0)<.22)return false;window.__PIXEL__!.world.pause();return true;},{ability,started},{polling:'raf'});
      await page.waitForTimeout(40);const first=await page.evaluate(()=>window.__PIXEL__!.art());
      const target=directions[(directions.indexOf(d)+4)%8]!.id;
      expect(first.casting.pose).toMatchObject({direction:target,locomotion:{direction:d.id,motion:'run'}});expect(first.heroFrame).toContain('mage-run-v2-');
      expect(first.casting.authoredCast).toBeDefined();expect(first.casting.phantom.visible).toBe(false);expect(first.casting.layered).toBe(true);expect(first.casting.bodyCropped).toBe(true);expect(first.casting.upperFrame).toContain('mage-cast-v2-');
      expect(first.actors.filter(a=>a.texture==='mage-run-v2')).toHaveLength(1);expect(first.casting.upperTexture).toBe('mage-moving-cast-v2');expect(first.actors.filter(a=>a.texture.startsWith('mage-hero-v2-'))).toHaveLength(0);
      // Terrain recycles different-sized chunk textures as the camera moves.
      // The caster must add no texture and remain within the whole-scene budget.
      expect(first.casting.allocated).toBe(1);expect(first.textureBytes).toBeLessThan(144*1024*1024);expect(first.textures.filter(t=>!t.startsWith('chunk-'))).toEqual(baseline.textures);
      await page.locator('canvas').screenshot({path:`${root}/${ability}-${d.id}.png`});
      await page.waitForTimeout(90);expect(await page.evaluate(()=>window.__PIXEL__!.art().casting)).toEqual(first.casting);
      // Resume and re-press in one browser task, without an idle simulation frame.
      // The pause boundary deliberately clears HeldInputTracker.
      await page.evaluate(keys=>{window.__PIXEL__!.world.resume();for(const key of keys)window.dispatchEvent(new KeyboardEvent('keydown',{key,code:'Key'+key.toUpperCase()}));},d.keys);
      await page.waitForFunction(progress=>{const a=window.__PIXEL__!.art().casting;if(!a.authoredCast||(a.pose?.progress??0)<=progress+.2)return false;window.__PIXEL__!.world.pause();return true;},first.casting.pose!.progress!,{polling:'raf'});
      await page.waitForTimeout(35);const next=await page.evaluate(()=>window.__PIXEL__!.art().casting);
      expect(next.armsFrame).not.toBe(first.casting.armsFrame);expect(next.pose!.locomotion!.age).toBeGreaterThan(first.casting.pose!.locomotion!.age);
      records.push({ability,direction:d.id,first:first.casting,next});
      await page.evaluate(keys=>{const w=window.__PIXEL__!.world;w.elapsed+=3;w.resume();for(const key of keys)window.dispatchEvent(new KeyboardEvent('keydown',{key,code:'Key'+key.toUpperCase()}));},d.keys);await page.waitForTimeout(45);
    }
    for(const key of d.keys)await page.keyboard.up(key);await expect.poll(()=>page.evaluate(()=>window.__PIXEL__!.art().casting.pose?.motion)).toBe('idle');
    expect(await page.evaluate(()=>window.__PIXEL__!.art().casting.upperFrame)).toBe('');
  }
  expect(errors).toEqual([]);writeFileSync(`${root}/evidence.json`,JSON.stringify({baseline,records,errors},null,2));
});

test('moving cast stops into a full target-facing body, resumes, ignores Shield, layers Blink and resets crop on hurt/death',async({page})=>{
  await page.goto('/?test=1');await page.getByRole('button',{name:'Начать забег'}).click();
  await page.evaluate(()=>{const w=window.__PIXEL__!.world;w.options.spawnRate=0;w.encounterDirector.nextAt=Infinity;w.enemies=[];for(const a of Object.values(w.abilities))a.level=0;w.mobility.protectedUntil=Infinity;w.player.invulnerableUntil=Infinity;});
  await page.keyboard.down('d');await page.waitForTimeout(750);
  const cast=async()=>{await page.evaluate(()=>{const w=window.__PIXEL__!.world;w.enemies=[];const e=w.spawn('tank',{x:w.player.x-100,y:w.player.y})!;e.speed=0;e.hp=1e7;w.abilities.meteor.level=1;w.abilities.meteor.readyAt=0;});await page.waitForFunction(()=>{const c=window.__PIXEL__!.art().casting;return c.active?.ability==='meteor'&&c.authoredCast;});await page.evaluate(()=>window.__PIXEL__!.world.abilities.meteor.level=0);};
  await cast();const first=await page.evaluate(()=>window.__PIXEL__!.art());expect(first.casting.bodyCropped).toBe(true);expect(first.casting.authoredCast).toBeDefined();
  expect(first.casting.allocated).toBe(1);
  await page.keyboard.up('d');await page.waitForFunction(()=>{const a=window.__PIXEL__!.art().casting;return a.visible&&!!a.authoredCast&&!a.pose?.walk;});
  const standing=await page.evaluate(()=>window.__PIXEL__!.art().casting);expect(standing.pose?.direction).toBe('west');expect(standing.bodyCropped).toBe(false);expect(standing.upperFrame).toBe('');
  await page.keyboard.down('d');await page.waitForFunction(()=>window.__PIXEL__!.art().casting.layered);
  const before=await page.evaluate(()=>window.__PIXEL__!.art().casting.active);
  const protection=await page.evaluate(()=>{const w=window.__PIXEL__!.world,hp=w.player.hp;w.mobility.protectedUntil=w.player.invulnerableUntil=0;w.shield.refreshAbsorb(50,w.elapsed+10);w.damagePlayer(10);return{hp,balance:w.shield.absorbValue(w.elapsed),after:w.player.hp};});
  expect(protection.balance).toBe(40);expect(protection.after).toBe(protection.hp);
  await page.waitForTimeout(35);expect((await page.evaluate(()=>window.__PIXEL__!.art().casting.active))?.started).toBe(before!.started);
  await page.evaluate(()=>{const w=window.__PIXEL__!.world;w.mobility.activate(w,{x:1,y:0});});
  await expect.poll(()=>page.evaluate(()=>window.__PIXEL__!.art().casting.active?.ability),{intervals:[10]}).toBe('blink');
  expect(await page.evaluate(()=>window.__PIXEL__!.art().casting)).toMatchObject({mode:'cast',layered:true,bodyCropped:true,upperTexture:'mage-moving-cast-v2',pose:{castAbility:'blink'}});
  await page.waitForTimeout(250);await cast();
  await page.evaluate(()=>{const w=window.__PIXEL__!.world;w.shield.clearAbsorb();w.mobility.protectedUntil=w.player.invulnerableUntil=0;w.damagePlayer(20);});
  await expect.poll(()=>page.evaluate(()=>window.__PIXEL__!.art().casting.mode),{intervals:[10]}).toBe('hurt');
  expect(await page.evaluate(()=>window.__PIXEL__!.art().casting)).toMatchObject({layered:false,bodyCropped:false,upperFrame:''});
  await page.evaluate(()=>{const w=window.__PIXEL__!.world;w.player.invulnerableUntil=0;w.damagePlayer(99999);});
  await expect.poll(()=>page.evaluate(()=>window.__PIXEL__!.art().casting.mode)).toBe('death');
  expect(await page.evaluate(()=>window.__PIXEL__!.art().casting)).toMatchObject({layered:false,bodyCropped:false,upperFrame:'',allocated:1});
});
