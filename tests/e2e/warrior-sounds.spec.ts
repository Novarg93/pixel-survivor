import {expect,test,type Page} from '@playwright/test';
import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import type {WarriorSampleId} from '../../src/game/audio/samples';
const root='screenshots/warrior-sounds-v1';
async function setup(page:Page){
 await page.addInitScript(()=>{Object.defineProperty(HTMLElement.prototype,'requestFullscreen',{value:undefined});localStorage.setItem('pixel-survivor-v1',JSON.stringify({version:2,settings:{volume:.5,sfxVolume:.8,musicVolume:0,muted:false,pixelScale:2},records:[]}));});
 await page.goto('/?test=1');await page.waitForFunction(()=>window.__PIXEL__?.audio().samplesPending===0);
 await page.getByRole('button',{name:/^Warrior/}).click();await page.getByRole('button',{name:/^Начать забег/}).click();
 await page.evaluate(()=>{const w=window.__PIXEL__!.world;w.options.spawnRate=0;w.encounterDirector.nextAt=Infinity;w.player.invulnerableUntil=Infinity;for(const a of Object.values(w.abilities))a.level=0;w.enemies=[];const e=w.spawn('tank',{x:w.player.x+65,y:w.player.y})!;e.speed=e.damage=0;e.hp=e.maxHp=1e6;});
}
test('all nine Warrior uploads play from real actions; pause, mute, restart and local delivery',async({page})=>{
 test.setTimeout(60000);mkdirSync(root,{recursive:true});const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await setup(page);
 expect(await page.evaluate(()=>window.__PIXEL__!.audio().samplesLoaded)).toBe(36);
 async function heard(id:WarriorSampleId,action:()=>Promise<unknown>){const before=await page.evaluate(id=>window.__PIXEL__!.audio().samplePlays?.[id]??0,id);await action();await expect.poll(()=>page.evaluate(id=>window.__PIXEL__!.audio().samplePlays?.[id]??0,id)).toBe(before+1);}
 for(const [ability,id] of [['cleave','warrior-cleave'],['whirlwind','warrior-whirlwind'],['slam','warrior-stomp'],['blades','warrior-spear_throw'],['iron','warrior-shield_block']] as const){
  await heard(id,()=>page.evaluate(ability=>{const w=window.__PIXEL__!.world;w.abilities[ability].level=1;w.abilities[ability].readyAt=0;},ability));
  await page.evaluate(ability=>{window.__PIXEL__!.world.abilities[ability].level=0;},ability);await page.waitForTimeout(700);
 }
 await heard('warrior-charge',()=>page.keyboard.press('Space'));await page.waitForTimeout(1100);
 for(const [kind,id] of [['banner','warrior-banner'],['earthbreaker','warrior-ultimate_stomp'],['ruin','warrior-spear_ultimate']] as const){
  await page.evaluate(kind=>{const w=window.__PIXEL__!.world;w.ultimate.clear();w.elapsed=300;w.experience.level=30;w.ultimate.choose(w,kind);},kind);
  await heard(id,()=>page.locator('.ultimate-control').click());await page.waitForTimeout(600);
  await page.locator('canvas').screenshot({path:`${root}/${kind}.png`});await page.keyboard.press('Escape');await expect.poll(()=>page.evaluate(()=>window.__PIXEL__!.audio().sources)).toBe(0);
  await page.evaluate(()=>{const w=window.__PIXEL__!.world;w.ultimate.clear();w.warrior.gestureUntil=0;w.resume();});
 }
 const audio=await page.evaluate(()=>window.__PIXEL__!.audio());expect(audio.failedAssets).toBe(0);expect(audio.sampleFallbacks).toBe(0);expect(audio.peakVoices).toBeLessThanOrEqual(12);expect(audio.decodedBytes).toBeLessThan(26e6);expect(audio.played['arcaneShield.trigger']??0).toBe(0);
 await page.evaluate(async()=>{const path='/src/game/events/bridge.ts';const {commands}=await import(path);commands.emit({type:'settings',value:{volume:.5,sfxVolume:.8,musicVolume:0,muted:true,pixelScale:2}});});await expect.poll(()=>page.evaluate(()=>window.__PIXEL__!.audio().sources)).toBe(0);
 await page.evaluate(()=>window.__PIXEL__!.restartScene());await page.waitForFunction(()=>window.__PIXEL__?.world.status==='menu'&&window.__PIXEL__?.audio().samplesPending===0);expect(await page.evaluate(()=>window.__PIXEL__!.audio().sources)).toBe(0);expect(await page.evaluate(()=>window.__PIXEL__!.audio().samplesLoaded)).toBe(36);
 const manifest=JSON.parse(readFileSync('docs/verification/warrior-sounds-v1/manifest.json','utf8')) as {entries:{file:string;sha256:string}[]};for(const e of manifest.entries){const r=await page.request.get(e.file.replace('public/','/'));expect(r.ok()).toBe(true);expect(createHash('sha256').update(await r.body()).digest('hex')).toBe(e.sha256);}
 expect(errors).toEqual([]);writeFileSync(`${root}/evidence.json`,JSON.stringify({audio,errors},null,2));
});
test('missing Warrior WAVs use bounded procedural fallback',async({page})=>{
 await page.route('**/assets/audio/warrior-uploaded-v1/*.wav',r=>r.abort());await setup(page);expect(await page.evaluate(()=>window.__PIXEL__!.audio().samplesLoaded)).toBe(27);expect(await page.evaluate(()=>window.__PIXEL__!.audio().failedAssets)).toBe(9);
 await page.keyboard.press('Space');await expect.poll(()=>page.evaluate(()=>window.__PIXEL__!.audio().played['player.dash']??0)).toBe(1);expect(await page.evaluate(()=>window.__PIXEL__!.audio().sampleFallbacks)).toBeGreaterThan(0);
 await page.keyboard.press('Escape');await expect.poll(()=>page.evaluate(()=>window.__PIXEL__!.audio().sources)).toBe(0);
});
