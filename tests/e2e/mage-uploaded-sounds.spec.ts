import {test,expect,type Page} from '@playwright/test';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import type {MageSampleId} from '../../src/game/audio/mageSamples';
const root='screenshots/mage-uploaded-sounds-v1';
async function setup(page:Page){
  await page.addInitScript(()=>{
    Object.defineProperty(HTMLElement.prototype,'requestFullscreen',{value:undefined});
    localStorage.setItem('pixel-survivor-v1',JSON.stringify({version:2,settings:{volume:.5,musicVolume:0,sfxVolume:.8,muted:false,pixelScale:2},records:[]}));
    const starts:{seconds:number;elapsed:number}[]=[],start=AudioBufferSourceNode.prototype.start;Object.defineProperty(window,'__UPLOAD_AUDIO__',{value:starts});
    AudioBufferSourceNode.prototype.start=function(...args){starts.push({seconds:this.buffer?.duration??0,elapsed:window.__PIXEL__?.world.elapsed??0});return Reflect.apply(start,this,args);};
  });
  await page.goto('/?test=1');await page.waitForFunction(()=>window.__PIXEL__?.audio().samplesPending===0);
}
test('all five uploaded WAVs play, and thunder starts once at the actual ultimate release',async({page})=>{
  test.setTimeout(30000);mkdirSync(root,{recursive:true});const errors:string[]=[],files=new Set<string>();page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.url().includes('/assets/audio/mage-sfx-uploaded-v1/')){files.add(new URL(r.url()).pathname);if(r.status()!==200)errors.push(`HTTP ${r.status()}`);}});
  await setup(page);expect(await page.evaluate(()=>window.__PIXEL__!.audio().samplesLoaded)).toBe(16);expect(files.size).toBe(7);
  await page.getByRole('button',{name:/Бой со Стражем/}).click();await page.waitForFunction(()=>window.__PIXEL__!.world.finalEncounter.phase==='phase1');
  await page.evaluate(()=>{const w=window.__PIXEL__!.world;w.player.invulnerableUntil=Infinity;for(const a of Object.values(w.abilities))a.level=0;});await page.waitForTimeout(1100);
  async function heard(id:MageSampleId,trigger:()=>Promise<unknown>){
    const before=await page.evaluate(id=>window.__PIXEL__!.audio().samplePlays?.[id]??0,id);await trigger();await expect.poll(()=>page.evaluate(id=>window.__PIXEL__!.audio().samplePlays?.[id]??0,id)).toBe(before+1);
  }
  await heard('mage-fireball-cast',()=>page.evaluate(()=>window.__PIXEL__!.world.feedback({type:'ability',ability:'fireball'})));
  await heard('mage-lightning',()=>page.evaluate(()=>window.__PIXEL__!.world.feedback({type:'ability',ability:'lightning'})));
  await heard('mage-meteor',()=>page.evaluate(()=>window.__PIXEL__!.world.feedback({type:'impact',source:'meteor'})));
  await heard('mage-blink',()=>page.keyboard.press('Space'));
  await heard('mage-ultimate-release',()=>page.keyboard.press('q'));
  const result=await page.evaluate(()=>{
    const starts=Reflect.get(window,'__UPLOAD_AUDIO__')as{seconds:number;elapsed:number}[],w=window.__PIXEL__!.world;
    return{starts,release:w.ultimate.released,started:w.ultimate.started,audio:window.__PIXEL__!.audio()};
  });
  const thunder=result.starts.filter(s=>Math.abs(s.seconds-2)<.001);expect(thunder).toHaveLength(1);expect(Math.abs(thunder[0]!.elapsed-result.release)).toBeLessThan(.05);expect(result.release-result.started).toBeGreaterThanOrEqual(.52);
  expect(result.audio.failedAssets).toBe(0);expect(result.audio.sampleFallbacks).toBe(0);expect(result.audio.decodedBytes).toBeLessThan(6e6);expect(result.audio.peakVoices).toBeLessThanOrEqual(12);
  await page.locator('canvas').screenshot({path:root+'/ultimate-release.png'});await page.keyboard.press('Escape');await expect.poll(()=>page.evaluate(()=>window.__PIXEL__!.audio().sources)).toBe(0);
  const manifest=JSON.parse(readFileSync('art/generated/mage-uploaded-sounds-v1/manifest.json','utf8'))as{entries:{file:string;sha256:string}[]};for(const e of manifest.entries){const response=await page.request.get(e.file.replace('public/','/'));expect(response.ok()).toBe(true);expect(createHash('sha256').update(await response.body()).digest('hex')).toBe(e.sha256);}
  expect(errors).toEqual([]);writeFileSync(root+'/evidence.json',JSON.stringify({...result,files:[...files],errors},null,2));
});
test('missing uploaded files retain four other cues and use immediate procedural fallback',async({page})=>{
  await page.route('**/assets/audio/mage-sfx-uploaded-v1/*.wav',r=>r.abort());await setup(page);
  expect(await page.evaluate(()=>window.__PIXEL__!.audio().samplesLoaded)).toBe(9);expect(await page.evaluate(()=>window.__PIXEL__!.audio().failedAssets)).toBe(7);
  await page.getByRole('button',{name:'Начать забег'}).click();await page.keyboard.press('Space');await expect.poll(()=>page.evaluate(()=>window.__PIXEL__!.audio().played['player.blink']??0)).toBe(1);
  expect(await page.evaluate(()=>window.__PIXEL__!.audio().samplePlays?.['mage-blink']??0)).toBe(0);expect(await page.evaluate(()=>window.__PIXEL__!.audio().sampleFallbacks)).toBeGreaterThan(0);
  await page.evaluate(()=>{const w=window.__PIXEL__!.world;w.options.spawnRate=0;w.encounterDirector.nextAt=Infinity;for(const a of Object.values(w.abilities))a.level=0;w.player.invulnerableUntil=Infinity;const e=w.spawn('tank',{x:w.player.x+70,y:w.player.y})!;e.hp=e.maxHp=1e6;w.abilities.frost.level=1;w.abilities.frost.readyAt=0;});
  await expect.poll(()=>page.evaluate(()=>window.__PIXEL__!.audio().played['frostNova.cast']??0)).toBe(1);expect(await page.evaluate(()=>window.__PIXEL__!.audio().samplePlays?.['mage-frost-nova']??0)).toBe(0);
  await page.keyboard.press('Escape');await expect.poll(()=>page.evaluate(()=>window.__PIXEL__!.audio().sources)).toBe(0);
});

test('user Frost Nova WAV plays on the actual automatic cast and freezes its target',async({page})=>{
  const requests:string[]=[],errors:string[]=[];page.on('response',r=>{if(r.url().includes('/assets/audio/'))requests.push(new URL(r.url()).pathname);});page.on('pageerror',e=>errors.push(e.message));await setup(page);
  expect(requests.filter(p=>p.endsWith('/frost-nova.wav'))).toHaveLength(1);expect(requests.some(p=>p.endsWith('/mage-frost-nova.wav'))).toBe(false);
  await page.getByRole('button',{name:'Начать забег'}).click();
  const target=await page.evaluate(()=>{const w=window.__PIXEL__!.world;w.options.spawnRate=0;w.encounterDirector.nextAt=Infinity;for(const a of Object.values(w.abilities))a.level=0;w.player.invulnerableUntil=Infinity;w.enemies=[];const e=w.spawn('tank',{x:w.player.x+70,y:w.player.y})!;e.speed=0;e.hp=e.maxHp=1e6;w.abilities.frost.level=1;w.abilities.frost.readyAt=0;return e.id;});
  await expect.poll(()=>page.evaluate(()=>window.__PIXEL__!.audio().samplePlays?.['mage-frost-nova']??0)).toBe(1);
  const result=await page.evaluate(id=>{const w=window.__PIXEL__!.world,e=w.enemies.find(e=>e.id===id)!;w.abilities.frost.level=0;return{frozen:(e.freezeUntil??0)>w.elapsed,damaged:e.hp<e.maxHp,audio:window.__PIXEL__!.audio()};},target);
  expect(result.frozen).toBe(true);expect(result.damaged).toBe(true);expect(result.audio.sampleFallbacks).toBe(0);expect(result.audio.failedAssets).toBe(0);expect(result.audio.samplesLoaded).toBe(16);
  const m=JSON.parse(readFileSync('art/generated/frost-nova-sound-v1/manifest.json','utf8'))as{file:string;sha256:string};const response=await page.request.get(m.file.replace('public/','/'));expect(response.ok()).toBe(true);expect(createHash('sha256').update(await response.body()).digest('hex')).toBe(m.sha256);
  mkdirSync('docs/screenshots',{recursive:true});await page.locator('canvas').screenshot({path:'docs/screenshots/19-frost-nova-upload.png'});
  await page.keyboard.press('Escape');await expect.poll(()=>page.evaluate(()=>window.__PIXEL__!.audio().sources)).toBe(0);expect(errors).toEqual([]);writeFileSync('.tmp/frost-nova-upload-evidence.json',JSON.stringify({...result,requests,errors},null,2));
});
test('quiet Arcane Shield upload replaces the old sound for activation and absorbed boss damage',async({page})=>{
  const requests:string[]=[],errors:string[]=[];page.on('response',r=>{if(r.url().includes('/assets/audio/'))requests.push(new URL(r.url()).pathname);});page.on('pageerror',e=>errors.push(e.message));await setup(page);
  expect(requests.filter(p=>p.endsWith('/arcaneshield.wav'))).toHaveLength(1);expect(requests.some(p=>p.endsWith('/mage-shield.wav'))).toBe(false);
  await page.getByRole('button',{name:/Бой со Стражем/}).click();await page.waitForFunction(()=>window.__PIXEL__!.world.finalEncounter.phase==='phase1');
  const before=await page.evaluate(()=>{
    const w=window.__PIXEL__!.world,f=w.finalEncounter;for(const a of Object.values(w.abilities))a.level=0;f.attack={...f.attack,kind:'approach',age:0};f.nextCombo=f.nextMelee=f.nextMeteor=Infinity;
    w.shield.clearAbsorb();w.player.invulnerableUntil=w.mobility.protectedUntil=0;w.abilities.shield.level=1;w.abilities.shield.readyAt=w.elapsed;return window.__PIXEL__!.audio().samplePlays?.['mage-shield']??0;
  });
  await expect.poll(()=>page.evaluate(()=>window.__PIXEL__!.audio().samplePlays?.['mage-shield']??0)).toBe(before+1);
  await page.waitForTimeout(250); // Keep absorption outside the existing200ms cue rate limit.
  const hp=await page.evaluate(()=>{const w=window.__PIXEL__!.world;w.abilities.shield.level=0;const hp=w.player.hp;w.damagePlayer(1);return hp;});
  await expect.poll(()=>page.evaluate(()=>window.__PIXEL__!.audio().samplePlays?.['mage-shield']??0)).toBe(before+2);expect(await page.evaluate(()=>window.__PIXEL__!.world.player.hp)).toBe(hp);
  expect(await page.evaluate(()=>window.__PIXEL__!.audio().sampleFallbacks)).toBe(0);expect(errors).toEqual([]);
});
