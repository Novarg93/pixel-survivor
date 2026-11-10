import {test,expect} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';
for(const width of [1280,390])test(`one last-hit miniboss bar and hidden Mage shield/legacy Blink graphics ${width}`,async({page})=>{
 const dir=`screenshots/player-presentation-focus/${width}`;mkdirSync(dir,{recursive:true});const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width,height:width===390?844:720});await page.goto('/?test=1');await page.getByRole('button',{name:'Начать забег'}).click();
 await page.addStyleTag({content:'.overlay{display:none!important}'});
 const ids=await page.evaluate(()=>{const w=window.__PIXEL__!.world;w.options.spawnRate=0;w.encounterDirector.nextAt=Infinity;w.enemies=[];w.player.invulnerableUntil=Infinity;for(const a of Object.values(w.abilities))a.level=0;return(['charger','sorcerer','eclipse'] as const).map((kind,i)=>{const e=w.spawn(kind,{x:(i-1)*100,y:-100})!;e.hp=e.maxHp=10000;e.speed=0;e.boss!.until=Infinity;return e.id;});});
 const bar=page.locator('.boss-bar');await expect(bar).toHaveCount(1);await expect(bar).toHaveAttribute('data-boss-id',String(ids[0]));
 await page.evaluate(id=>{const w=window.__PIXEL__!.world;w.damageEnemy(w.bosses.find(e=>e.id===id)!,25);},ids[2]!);
 await expect(bar).toHaveAttribute('data-boss-id',String(ids[2]));
 const sameTick=await page.evaluate(ids=>{const w=window.__PIXEL__!.world;w.damageEnemy(w.bosses.find(e=>e.id===ids[0])!,0);w.damageEnemy(w.bosses.find(e=>e.id===ids[1])!,10);return{elapsed:w.elapsed,bosses:w.snapshot().bosses};},ids);
 await expect(bar).toHaveCount(1);await expect(bar).toHaveAttribute('data-boss-id',String(ids[1]));
 await expect(bar.locator('progress')).toHaveAttribute('value','9990');await page.screenshot({path:dir+'/three-bosses-one-bar.png'});
 await page.evaluate(()=>window.__PIXEL__!.world.pause());await page.waitForTimeout(40);const paused=await bar.textContent();await page.waitForTimeout(100);expect(await bar.textContent()).toBe(paused);
 await page.evaluate(()=>window.__PIXEL__!.world.resume());
 for(const [victim,next]of [[ids[1],ids[2]],[ids[2],ids[0]],[ids[0],null]]){
  await page.evaluate(id=>{const w=window.__PIXEL__!.world;w.damageEnemy(w.bosses.find(e=>e.id===id)!,1e9);},victim!);
  if(next===null)await expect(bar).toHaveCount(0);else{await expect(bar).toHaveCount(1);await expect(bar).toHaveAttribute('data-boss-id',String(next));}
 }
 const magic=await page.evaluate(async()=>{
  const w=window.__PIXEL__!.world;w.enemies=[];w.effects=[];w.orbs=[];w.abilities.shield.level=5;w.abilities.shield.readyAt=Infinity;
  const path='/src/game/abilities/arcaneShield.ts',{arcaneShield}=await import(path);arcaneShield(w);
  w.mobility.variant='absorb-shield';w.mobility.rank=3;const before={x:w.player.x,y:w.player.y};w.mobility.activate(w,{x:1,y:0});
  w.mobility.protectedUntil=w.player.invulnerableUntil=0;const absorb=w.absorb;w.damagePlayer(10);w.pause();
  return{before,after:{x:w.player.x,y:w.player.y},hp:w.player.hp,absorbBefore:absorb,absorbAfter:w.absorb,shieldEffects:w.effects.filter(e=>e.kind==='shield').length,cooldown:w.mobility.readyAt-w.elapsed};
 });
 expect(magic.after.x).toBeGreaterThan(magic.before.x);expect(magic.cooldown).toBeGreaterThan(0);expect(magic.hp).toBe(100);expect(magic.absorbBefore-magic.absorbAfter).toBe(10);expect(magic.shieldEffects).toBeGreaterThan(0);
 await page.waitForTimeout(50);await page.screenshot({path:dir+'/hidden-shield-and-blink.png'});
 expect(errors).toEqual([]);writeFileSync(dir+'/evidence.json',JSON.stringify({ids,sameTick,magic,errors},null,2));
 await page.evaluate(()=>window.__PIXEL__!.restartScene());await expect(page.getByRole('button',{name:'Начать забег'})).toBeVisible();await expect(bar).toHaveCount(0);
});
