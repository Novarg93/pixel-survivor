import {test,expect,type Page} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';
import type {MinibossSampleId} from '../../src/game/audio/samples';
const root='screenshots/miniboss-assets-audio-v1';
async function setup(page:Page){
 await page.addInitScript(()=>{Object.defineProperty(HTMLElement.prototype,'requestFullscreen',{value:undefined});localStorage.setItem('pixel-survivor-v1',JSON.stringify({version:2,settings:{volume:.5,musicVolume:.1,sfxVolume:.8,muted:false,pixelScale:2},records:[]}));});
 await page.goto('/?test=1');await page.waitForFunction(()=>window.__PIXEL__?.audio().samplesPending===0);await page.getByRole('button',{name:/^Начать забег/}).click();await page.addStyleTag({content:'.overlay{display:none!important}'});
 await page.evaluate(()=>{const w=window.__PIXEL__!.world;w.elapsed=630;w.enemies=[];w.options.spawnRate=0;w.encounterDirector.nextAt=Infinity;w.player.invulnerableUntil=Infinity;for(const a of Object.values(w.abilities))a.level=0;});
}
async function count(page:Page,id:MinibossSampleId){return page.evaluate(id=>window.__PIXEL__!.audio().samplePlays?.[id]??0,id);}
for(const [width,height]of [[1280,720],[844,390]])test(`accepted Rune art and all four mini-boss uploaded sounds, shared blink, lifecycle ${width}`,async({page})=>{
 test.setTimeout(45000);mkdirSync(root,{recursive:true});await page.setViewportSize({width,height});const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});await setup(page);
 expect(await page.evaluate(()=>window.__PIXEL__!.audio().samplesLoaded)).toBe(36);
 await page.evaluate(()=>{const w=window.__PIXEL__!.world,e=w.spawn('sorcerer',{x:120,y:-30})!;e.boss!.magic=undefined;e.boss!.until=w.elapsed;});
 await expect.poll(()=>count(page,'mini-rune-cast')).toBe(1);await page.waitForTimeout(380);await page.evaluate(()=>window.__PIXEL__!.world.pause());await page.waitForTimeout(80);
 let art=await page.evaluate(()=>window.__PIXEL__!.art());expect(art.actors.some(a=>a.texture==='rune-warden-v2'&&/^rune-cast-left-[2-6]$/.test(String(a.frame))&&Math.abs(a.width-86.4)<.001)).toBe(true);
 await page.locator('canvas').screenshot({path:`${root}/rune-cast-${width}.png`});const pausedCount=await count(page,'mini-rune-cast');await page.waitForTimeout(150);expect(await count(page,'mini-rune-cast')).toBe(pausedCount);expect(await page.evaluate(()=>window.__PIXEL__!.audio().sources)).toBe(0);
 await page.evaluate(()=>window.__PIXEL__!.world.resume());await page.waitForFunction(()=>window.__PIXEL__!.art().actors.some(a=>String(a.frame).startsWith('rune-flight-')));await page.evaluate(()=>window.__PIXEL__!.world.pause());await page.waitForTimeout(70);
 art=await page.evaluate(()=>window.__PIXEL__!.art());const flights=art.actors.filter(a=>String(a.frame).startsWith('rune-flight-'));expect(flights.length).toBeGreaterThan(0);expect(flights.every(a=>a.texture==='rune-warden-v2'&&a.width===52&&a.height===52)).toBe(true);await page.locator('canvas').screenshot({path:`${root}/rune-projectiles-${width}.png`});
 // Force only the existing teleport cooldown due; the actual signal, relocation and volley still use game AI.
 await page.evaluate(()=>{const w=window.__PIXEL__!.world,e=w.bosses[0]!;w.clearHostileThreats();e.boss!.phase='approach';e.boss!.until=Infinity;e.boss!.magic={nextAt:w.elapsed,teleports:0};w.resume();});
 await expect.poll(()=>count(page,'mini-teleport')).toBe(1);await expect.poll(()=>count(page,'mini-rune-cast')).toBe(2);
 await page.evaluate(()=>{const w=window.__PIXEL__!.world;w.enemies=[];w.clearHostileThreats();const e=w.spawn('eclipse',{x:-130,y:-30})!;e.hp=e.maxHp*.49;e.boss!.stage=2;e.boss!.magic=undefined;e.boss!.until=w.elapsed;});
 await expect.poll(()=>count(page,'mini-astral-cast')).toBe(1);await expect.poll(()=>count(page,'mini-astral-cast')).toBe(2);await page.locator('canvas').screenshot({path:`${root}/astral-followup-${width}.png`});
 await page.evaluate(()=>{const w=window.__PIXEL__!.world,e=w.bosses[0]!;e.shootingAt=0;e.boss!.phase='approach';e.boss!.until=Infinity;e.boss!.magic={nextAt:w.elapsed,teleports:0};});
 await expect.poll(()=>count(page,'mini-teleport')).toBe(2);
 await page.evaluate(()=>{const w=window.__PIXEL__!.world;w.enemies=[];w.clearHostileThreats();const e=w.spawn('charger',{x:20,y:0})!;e.boss!.until=Infinity;});
 await expect.poll(()=>count(page,'mini-briar-melee')).toBe(1);
 await page.evaluate(()=>{const w=window.__PIXEL__!.world,e=w.bosses[0]!;e.x=150;e.boss!.until=w.elapsed;});await expect.poll(()=>count(page,'mini-briar-charge')).toBe(1);
 expect(await page.evaluate(()=>window.__PIXEL__!.audio().requested['encounter.charge']??0)).toBe(0);await page.locator('canvas').screenshot({path:`${root}/beast-charge-${width}.png`});
 await page.evaluate(()=>{const w=window.__PIXEL__!.world;w.enemies=[];w.clearHostileThreats();const e=w.spawn('guardian',{x:150,y:-20})!;w.guardianSystem.awaken(w,e);const s=w.guardianSystem.encounters.get(e.id)!;s.phase='orb-warning';s.orbIndex=0;s.until=w.elapsed+.3;s.nextOrbAt=s.until;});
 await expect.poll(()=>count(page,'mini-totem-cast')).toBe(1);await page.evaluate(()=>{const w=window.__PIXEL__!.world,s=w.guardianSystem.encounters.get(w.guardians[0]!.id)!;s.phase='orb-warning';s.until=w.elapsed+.3;s.nextOrbAt=s.until;});await expect.poll(()=>count(page,'mini-totem-cast')).toBe(2);await page.locator('canvas').screenshot({path:`${root}/totem-release-${width}.png`});
 const audio=await page.evaluate(()=>window.__PIXEL__!.audio());expect(audio.failedAssets).toBe(0);expect(audio.sampleFallbacks).toBe(0);expect(audio.peakVoices).toBeLessThanOrEqual(12);expect(audio.decodedBytes).toBeLessThan(26e6);expect(audio.music?.current).toBe('dying');
 await page.evaluate(async()=>{const path='/src/game/events/bridge.ts',{commands}=await import(path);commands.emit({type:'settings',value:{volume:.5,musicVolume:.1,sfxVolume:.8,muted:true,pixelScale:2}});});await expect.poll(()=>page.evaluate(()=>window.__PIXEL__!.audio().sources)).toBe(0);
 await page.evaluate(()=>window.__PIXEL__!.restartScene());await page.waitForFunction(()=>window.__PIXEL__?.world.status==='menu'&&window.__PIXEL__?.audio().samplesLoaded===36);expect(await page.evaluate(()=>window.__PIXEL__!.audio().sources)).toBe(0);expect(await page.evaluate(()=>window.__PIXEL__!.listeners())).toEqual({commands:1,snapshots:1,metrics:1});await expect(page.locator('canvas')).toHaveCount(1);expect(errors).toEqual([]);
 writeFileSync(`${root}/evidence-${width}.json`,JSON.stringify({audio,flights,errors},null,2));
});
test('missing mini-boss WAV uses bounded procedural fallback',async({page})=>{
 await page.route('**/assets/audio/miniboss-v1/*.wav',r=>r.abort());await setup(page);expect(await page.evaluate(()=>window.__PIXEL__!.audio().samplesLoaded)).toBe(30);expect(await page.evaluate(()=>window.__PIXEL__!.audio().failedAssets)).toBe(6);
 await page.evaluate(()=>{const w=window.__PIXEL__!.world,e=w.spawn('sorcerer',{x:150,y:0})!;e.boss!.magic=undefined;e.boss!.until=w.elapsed;});await expect.poll(()=>page.evaluate(()=>window.__PIXEL__!.audio().played['mini.runeCast']??0)).toBe(1);expect(await page.evaluate(()=>window.__PIXEL__!.audio().sampleFallbacks)).toBeGreaterThan(0);expect(await count(page,'mini-rune-cast')).toBe(0);
});
