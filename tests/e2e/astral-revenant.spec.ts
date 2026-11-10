import {expect,test,type Page} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';
import {ASTRAL_VFX as C,NECROTIC_FLAME as F,ASTRAL_VOLLEY} from '../../src/game/config/astralRevenant';
import {bossBirth} from '../../src/game/config/bossEnrage';
import {GROVE_ART_BUDGET} from '../../src/game/art/groveArtPack';
async function advance(page:Page,seconds:number){
  await page.evaluate(seconds=>{const w=window.__PIXEL__!.world;w.resume();for(let t=0;t<seconds-1e-8;t+=.025)w.step(Math.min(.025,seconds-t));w.pause();},seconds);await page.waitForTimeout(65);
}
for(const burning of [false,true])for(const viewport of [{width:1280,height:720},{width:844,height:390}])test(`Astral Revenant casts, both phases, missiles, necrotic flame wall, Rune teleport and teardown ${burning?'burning':'grove'} ${viewport.width}`,async({page})=>{
  const directory=`screenshots/astral-flame-runtime-v1/legacy/${burning?'burning':'grove'}-${viewport.width}`;mkdirSync(directory,{recursive:true});
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'||m.type()==='warning'&&/Texture|Frame/.test(m.text()))errors.push(m.text());});page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
  await page.setViewportSize(viewport);await page.goto('/?test=1');await page.getByRole('button',{name:'Начать забег'}).click();await page.addStyleTag({content:'.overlay{display:none!important}'});
  await page.evaluate(burning=>{const w=window.__PIXEL__!.world;w.pause();w.elapsed=burning?915:20;w.experience.level=30;w.enemies=[];w.clearHostileThreats();w.options.spawnRate=0;w.encounterDirector.nextAt=Infinity;w.player.invulnerableUntil=Infinity;for(const a of Object.values(w.abilities))a.level=0;const e=w.spawn('eclipse',{x:240,y:0})!;e.boss!.magic=undefined;e.boss!.until=1e6;},burning);
  const art=()=>page.evaluate(()=>window.__PIXEL__!.art()),body=()=>page.evaluate(()=>window.__PIXEL__!.art().actors.find(a=>String(a.frame).startsWith('eclipse-1-'))!);
  const shot=async(name:string)=>page.locator('canvas').screenshot({path:`${directory}/${name}.png`});
  await advance(page,.025);await advance(page,.18);const actor=await body();expect(String(actor.frame)).toMatch(/^eclipse-1-left-walk-\d+$/);expect(actor.width).toBeCloseTo(66.24);expect(actor.height).toBeCloseTo(66.24);expect(actor.rotation).toBe(0);await shot('walk-left');
  await page.evaluate(()=>{const e=window.__PIXEL__!.world.bosses[0]!;e.x=-240;e.y=0;});await advance(page,.025);await advance(page,.18);expect(String((await body()).frame)).toMatch(/^eclipse-1-right-walk-\d+$/);await shot('walk-right');
  await page.evaluate(()=>{const w=window.__PIXEL__!.world,e=w.bosses[0]!;e.x=100;e.y=-40;e.boss!.until=w.elapsed;});await advance(page,.025);expect(String((await body()).frame)).toMatch(/-cast-0$/);await shot('primary-cast');
  await advance(page,.3);const castFrame=(await body()).frame;await page.evaluate(()=>{const w=window.__PIXEL__!.world;w.damageEnemy(w.bosses[0]!,1);});await page.waitForTimeout(65);expect((await body()).frame).toBe(castFrame);
  const paused=JSON.stringify((await art()).actors);await page.waitForTimeout(120);expect(JSON.stringify((await art()).actors)).toBe(paused);await shot('cast-hit-pause');
  await advance(page,await page.evaluate(()=>{const w=window.__PIXEL__!.world;return w.bosses[0]!.boss!.until-w.elapsed+.001;}));
  let visuals=await art();expect(String((await body()).frame)).toMatch(/-cast-15$/);const launches=visuals.actors.filter(a=>a.frame==='eclipse-ai-flight-0');expect(launches.every(a=>a.width===56&&a.height===56)).toBe(true);
  const missiles=await page.evaluate(()=>{const w=window.__PIXEL__!.world,e=w.bosses[0]!,b=e.boss!;return {enrageIndex:b.enrageIndex??0,lateVolley:b.late?.volley,late:b.late?.projectile??1,shots:w.projectiles.map(p=>({x:p.x,y:p.y,vx:p.vx,vy:p.vy,damage:p.damage,ttl:p.expires-p.started!,appearance:p.appearance}))};});
  expect(launches).toHaveLength(missiles.enrageIndex?(missiles.lateVolley??bossBirth(missiles.enrageIndex).projectiles):10);
  for(const p of missiles.shots){expect(Math.hypot(p.vx,p.vy)).toBeCloseTo((missiles.enrageIndex?95*missiles.late:85)*ASTRAL_VOLLEY.speedScale,8);expect(p.appearance).toBe('astral-volley');expect(p.ttl).toBeCloseTo(2.5);}
  const rotations=launches.map(a=>a.rotation).sort((a,b)=>a-b),angles=missiles.shots.map(p=>Math.atan2(p.vy,p.vx)).sort((a,b)=>a-b);for(let i=0;i<angles.length;i++)expect(rotations[i]).toBeCloseTo(angles[i]!,7);
  await shot('ring-launch');await advance(page,.55);expect((await art()).actors.some(a=>String(a.frame).startsWith('eclipse-ai-flight-'))).toBe(true);await shot('ring-flight');
  await page.evaluate(()=>{const w=window.__PIXEL__!.world,p=w.projectiles[0]!;p.x=w.player.x;p.y=w.player.y;});await advance(page,.025);expect((await art()).astralRevenant.active.some(v=>v.frame==='eclipse-ai-impact-0')).toBe(true);await shot('projectile-impact');
  await advance(page,.25);expect((await art()).astralRevenant.active.some(v=>v.frame==='eclipse-ai-impact-6')).toBe(true);await shot('projectile-dissolve');
  // The real phase2 cast queues four persistent segments at a fixed ground row.
  await page.evaluate(()=>{const w=window.__PIXEL__!.world,e=w.bosses[0]!;w.clearHostileThreats();w.player.hp=w.player.maxHp=1000;w.player.invulnerableUntil=0;w.damageEnemy(e,e.maxHp*.51);e.x=100;e.y=-40;e.boss!.phase='approach';e.boss!.until=w.elapsed;});await advance(page,.025);
  expect(await page.evaluate(()=>window.__PIXEL__!.world.bosses[0]!.boss!.stage)).toBe(2);
  visuals=await art();expect(visuals.astralRevenant.active).toEqual([]);expect(visuals.astralRevenant.ground).toHaveLength(4);
  expect(visuals.astralRevenant.ground.every(v=>v.phase==='warning'&&v.color===F.glowColor&&v.alpha<=F.glowAlpha)).toBe(true);await shot('ground-warning');
  await advance(page,await page.evaluate(()=>{const w=window.__PIXEL__!.world;return w.zones[0]!.necrotic!.spawnAt-w.elapsed-.2;}));
  visuals=await art();expect((await body()).tint).toBe(C.stage2Tint);const frozen={frame:(await body()).frame,ground:visuals.astralRevenant.ground};
  await page.evaluate(()=>{const w=window.__PIXEL__!.world,e=w.bosses[0]!;e.ultimateFreeze={until:w.elapsed+.3,updated:w.elapsed,visualAt:w.elapsed};});await advance(page,.2);
  expect((await body()).frame).toBe(frozen.frame);expect((await art()).astralRevenant.ground).toEqual(frozen.ground);await shot('warning-freeze');await advance(page,.101);
  const hp=await page.evaluate(()=>window.__PIXEL__!.world.player.hp);
  await advance(page,await page.evaluate(()=>{const w=window.__PIXEL__!.world;return w.zones[0]!.necrotic!.spawnAt-w.elapsed+.001;}));
  expect(await page.evaluate(()=>window.__PIXEL__!.world.player.hp)).toBe(hp);
  expect((await art()).astralRevenant.ground).toEqual([]);expect((await art()).astralRevenant.active.filter(v=>v.frame==='eclipse-flame-ai-spawn-0')).toHaveLength(4);expect(String((await body()).frame)).toMatch(/-cast-0$/);await shot('spawn-b-ember');
  const firstCount=await page.evaluate(()=>{const w=window.__PIXEL__!.world;w.player.y=45;return w.projectiles.length;});await advance(page,.25);
  expect((await art()).astralRevenant.active.filter(v=>v.frame==='eclipse-flame-ai-spawn-4')).toHaveLength(4);expect(await page.evaluate(()=>window.__PIXEL__!.world.player.hp)).toBe(hp);await shot('spawn-b-flare');
  await advance(page,.15);expect((await art()).astralRevenant.active.filter(v=>v.frame==='eclipse-flame-ai-spawn-6')).toHaveLength(4);await shot('spawn-b-rise');
  const followupAt=await page.evaluate(()=>window.__PIXEL__!.world.bosses[0]!.shootingAt);
  await advance(page,await page.evaluate(()=>{const w=window.__PIXEL__!.world;return w.bosses[0]!.shootingAt-w.elapsed+.001;}));
  expect(await page.evaluate(()=>window.__PIXEL__!.world.bosses[0]!.shootingAt)).toBe(0);expect(String((await body()).frame)).toMatch(/-cast-15$/);
  expect(await page.evaluate(at=>window.__PIXEL__!.world.projectiles.filter(p=>(p.started??0)>=at-1e-7).length,followupAt)).toBe(firstCount);await shot('phase2-double-volley');
  // Move missiles out of the arena after testing their normal second release,
  // so subsequent HP measurements isolate the real flame tick.
  await page.evaluate(()=>{const w=window.__PIXEL__!.world,e=w.bosses[0]!;w.player.y=0;e.boss!.until=Infinity;for(const p of w.projectiles){p.x=1000;p.y=1000;}});
  const toIdle=await page.evaluate(()=>{const w=window.__PIXEL__!.world;return Math.max(.001,w.zones[0]!.necrotic!.activeAt-w.elapsed+.001);});await advance(page,toIdle);
  const firstHp=await page.evaluate(()=>window.__PIXEL__!.world.player.hp);expect(firstHp).toBeLessThan(hp);
  expect((await art()).astralRevenant.ground).toEqual([]);expect((await art()).astralRevenant.active.filter(v=>v.frame==='eclipse-flame-ai-idle-0')).toHaveLength(4);
  expect((await art()).astralRevenant.active.filter(v=>v.frame.startsWith('eclipse-flame-ai-')).every(v=>v.size===F.displaySize&&v.originY===116/128)).toBe(true);await shot('idle-first-tick');
  await page.evaluate(()=>{window.__PIXEL__!.world.player.y=60;});await advance(page,1.05);expect(await page.evaluate(()=>window.__PIXEL__!.world.player.hp)).toBe(firstHp);await shot('outside-no-damage');
  await page.evaluate(()=>{window.__PIXEL__!.world.player.y=0;});await advance(page,.025);
  const secondHp=await page.evaluate(()=>window.__PIXEL__!.world.player.hp);expect(secondHp).toBeLessThan(firstHp);
  await page.evaluate(()=>{const w=window.__PIXEL__!.world;w.player.x=w.zones[3]!.x;});await advance(page,.025);expect(await page.evaluate(()=>window.__PIXEL__!.world.player.hp)).toBe(secondHp);await shot('idle-reentry');
  await advance(page,1.025);expect(await page.evaluate(()=>window.__PIXEL__!.world.player.hp)).toBeLessThan(secondHp);await shot('idle-periodic-tick');
  await advance(page,await page.evaluate(()=>{const w=window.__PIXEL__!.world;return w.zones[0]!.necrotic!.fadeAt-w.elapsed+.001;}));
  expect((await art()).astralRevenant.ground).toEqual([]);expect((await art()).astralRevenant.active.filter(v=>v.frame==='eclipse-flame-ai-vanish-0')).toHaveLength(4);await shot('forward-vanish');
  const fadeHp=await page.evaluate(()=>window.__PIXEL__!.world.player.hp);await advance(page,.3);expect((await art()).astralRevenant.active.filter(v=>v.frame==='eclipse-flame-ai-vanish-4')).toHaveLength(4);await shot('forward-vanish-middle');
  await advance(page,.26);expect((await art()).astralRevenant.active.filter(v=>v.frame==='eclipse-flame-ai-vanish-8')).toHaveLength(4);await shot('forward-vanish-empty');
  await advance(page,.05);expect((await art()).astralRevenant.active).toEqual([]);expect((await art()).astralRevenant.ground).toEqual([]);expect(await page.evaluate(()=>window.__PIXEL__!.world.player.hp)).toBe(fadeHp);
  const flameDamage={hp,firstHp,secondHp,fadeHp};
  await page.evaluate(()=>{window.__PIXEL__!.world.player.invulnerableUntil=Infinity;});
  // Reuse the actual Rune atlas at both real teleport points, without copying its texture.
  await page.evaluate(()=>{const w=window.__PIXEL__!.world,e=w.bosses[0]!;w.clearHostileThreats();e.x=100;e.y=-40;e.boss!.phase='approach';e.boss!.until=1e6;e.boss!.magic={nextAt:w.elapsed,teleports:0};});await advance(page,.025);
  const anchors=await page.evaluate(()=>{const m=window.__PIXEL__!.world.bosses[0]!.boss!.magic!;return {from:m.from!,to:m.target!};});expect((await art()).runeWarden.active.filter(v=>v.frame.startsWith('rune-ai-blink-idle-')).map(v=>[v.x,v.y])).toEqual([[anchors.from.x,anchors.from.y+23],[anchors.to.x,anchors.to.y+23]]);await shot('teleport-marks');
  await advance(page,await page.evaluate(()=>{const w=window.__PIXEL__!.world;return w.bosses[0]!.boss!.until-w.elapsed+.001;}));expect(await page.evaluate(()=>{const e=window.__PIXEL__!.world.bosses[0]!;return {x:e.x,y:e.y};})).toEqual(anchors.to);expect((await art()).runeWarden.active.filter(v=>v.frame.startsWith('rune-ai-blink-fade-'))).toHaveLength(2);await shot('teleport-arrival');
  await advance(page,.12);await shot('teleport-glow');await advance(page,.25);expect((await art()).runeWarden.active.some(v=>v.frame.startsWith('rune-ai-blink-'))).toBe(false);
  const death=await page.evaluate(()=>{const w=window.__PIXEL__!.world,e=w.bosses[0]!,score=w.score;w.resume();w.damageEnemy(e,1e9);w.pause();return {score:w.score-score,chests:w.loot.chests.length,owned:w.effects.filter(v=>v.ownerId===e.id).length+w.projectiles.filter(p=>p.ownerId===e.id).length};});expect(death).toEqual({score:1500,chests:1,owned:0});
  await expect.poll(()=>page.evaluate(()=>window.__PIXEL__!.art().bosses.activeDeaths)).toBe(1);await advance(page,.2);expect((await art()).bosses.corpses[0]!.frame).toMatch(/^eclipse-1-(left|right)-walk-0$/);await shot('death-fade');await advance(page,.5);
  visuals=await art();expect(visuals.astralRevenant.active).toEqual([]);expect(visuals.astralRevenant.allocated).toBeLessThanOrEqual(128);expect(visuals.bosses.activeDeaths).toBe(0);expect(visuals.clock).toEqual([0,0,0]);expect(visuals.tweens).toBe(0);
  await page.evaluate(()=>window.__PIXEL__!.restartScene());await page.waitForFunction(()=>window.__PIXEL__?.world.status==='menu');const restarted=await art();expect(restarted.astralRevenant).toEqual({active:[],ground:[],allocated:0,atlasBytes:8921088+1393920+1951488});expect(restarted.textures.filter(t=>t==='astral-revenant-v1')).toHaveLength(1);
  // Travel can create more terrain chunks. Static atlas allocation must
  // remain identical while scene-owned chunk canvases are recreated on restart.
  expect(restarted.textures.filter(t=>!t.startsWith('chunk-')).sort()).toEqual(visuals.textures.filter(t=>!t.startsWith('chunk-')).sort());
  const chunkBytes=GROVE_ART_BUDGET.chunkPixels**2*4;
  expect(restarted.textureBytes-restarted.chunks*chunkBytes).toBe(visuals.textureBytes-visuals.chunks*chunkBytes);
  expect(await page.evaluate(()=>window.__PIXEL__!.listeners())).toEqual({commands:1,snapshots:1,metrics:1});await expect(page.locator('canvas')).toHaveCount(1);expect(errors).toEqual([]);
  writeFileSync(`${directory}/evidence.json`,JSON.stringify({missiles,flameDamage,anchors,death,art:visuals,errors},null,2));
});
