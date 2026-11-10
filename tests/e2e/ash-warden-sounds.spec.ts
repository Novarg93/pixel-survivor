import {test,expect,type Page} from '@playwright/test';
import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import type {WardenSampleId} from '../../src/game/audio/samples';
const root='screenshots/ash-warden-uploaded-sounds-v1';
async function setup(page:Page){
  await page.addInitScript(()=>{
    Object.defineProperty(HTMLElement.prototype,'requestFullscreen',{value:undefined});
    localStorage.setItem('pixel-survivor-v1',JSON.stringify({version:2,settings:{volume:.5,musicVolume:0,sfxVolume:.8,muted:false,pixelScale:2},records:[]}));
    const starts:{offset:number;duration:number|null;elapsed:number}[]=[],start=AudioBufferSourceNode.prototype.start;Reflect.set(window,'__WARDEN_STARTS__',starts);
    AudioBufferSourceNode.prototype.start=function(...args){starts.push({offset:args[1]??0,duration:args[2]??null,elapsed:window.__PIXEL__?.world.elapsed??0});return Reflect.apply(start,this,args);};
  });
  await page.goto('/?test=1');await page.waitForFunction(()=>window.__PIXEL__?.audio().samplesPending===0);
  await page.getByRole('button',{name:/Бой со Стражем/}).click();await page.waitForFunction(()=>window.__PIXEL__!.world.finalEncounter.phase==='phase1');
  await page.evaluate(()=>{const w=window.__PIXEL__!.world,f=w.finalEncounter;w.player.invulnerableUntil=Infinity;for(const a of Object.values(w.abilities))a.level=0;f.nextCombo=f.nextMelee=f.nextMeteor=Infinity;});
}
test('real boss uses directional swing/slam, Charge, Flame Strike and phased Meteor with local original WAVs',async({page})=>{
  test.setTimeout(40000);mkdirSync(root,{recursive:true});const errors:string[]=[],files=new Set<string>();page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.url().includes('/assets/audio/ash-warden-uploaded-v1/')){files.add(new URL(r.url()).pathname);if(r.status()!==200)errors.push(`HTTP ${r.status()}`);}});
  await setup(page);expect(await page.evaluate(()=>window.__PIXEL__!.audio().samplesLoaded)).toBe(16);expect(files.size).toBe(5);
  async function heard(id:WardenSampleId,trigger:()=>Promise<unknown>,increment=1){const before=await page.evaluate(id=>window.__PIXEL__!.audio().samplePlays?.[id]??0,id);await trigger();await expect.poll(()=>page.evaluate(id=>window.__PIXEL__!.audio().samplePlays?.[id]??0,id)).toBe(before+increment);}
  async function melee(x:number,y:number){await page.evaluate(({x,y})=>{const w=window.__PIXEL__!.world,f=w.finalEncounter,e=f.boss!;f.nextMelee=0;f.attack={...f.attack,kind:'approach',age:0};w.player.x=e.x+x*45;w.player.y=e.y+y*45;},{x,y});}
  await heard('warden-swing',()=>melee(1,0),2);await heard('warden-swing',()=>melee(-1,0),2);
  await heard('warden-slam',()=>melee(0,1));await page.locator('canvas').screenshot({path:root+'/south-slam.png'});
  await heard('warden-slam',()=>melee(0,-1));
  const flamesBefore=await page.evaluate(()=>window.__PIXEL__!.audio().samplePlays?.['warden-flamestrike']??0);
  await heard('warden-charge',()=>page.evaluate(()=>{const w=window.__PIXEL__!.world,f=w.finalEncounter,e=f.boss!;f.nextMelee=Infinity;f.nextCombo=f.bossClock;f.attack={...f.attack,kind:'approach',age:0};w.player.x=e.x+200;w.player.y=e.y;}));
  await expect.poll(()=>page.evaluate(()=>window.__PIXEL__!.audio().samplePlays?.['warden-flamestrike']??0)).toBe(flamesBefore+1);await page.locator('canvas').screenshot({path:root+'/flame-strike.png'});
  await heard('warden-meteor',()=>page.evaluate(()=>{const w=window.__PIXEL__!.world,f=w.finalEncounter;f.nextCombo=Infinity;f.attack={...f.attack,kind:'approach',age:0};f.meteors=[0,1,2].map(i=>({id:900+i,group:900,owner:'boss' as const,x:w.player.x+150,y:w.player.y,age:1.05-i*.15,warning:1.3,landed:false}));}),6);
  const audio=await page.evaluate(()=>window.__PIXEL__!.audio());expect(audio.failedAssets).toBe(0);expect(audio.sampleFallbacks).toBe(0);expect(audio.peakVoices).toBeLessThanOrEqual(12);expect(audio.decodedBytes).toBeLessThan(6e6);
  const starts=await page.evaluate(()=>Reflect.get(window,'__WARDEN_STARTS__')as{offset:number;duration:number|null}[]);
  expect(starts.some(s=>s.duration===.3&&s.offset===0)).toBe(true);expect(starts.some(s=>s.offset===.3&&s.duration===null)).toBe(true);expect(starts.some(s=>s.duration===.2&&s.offset===0)).toBe(true);expect(starts.some(s=>s.offset===.2&&s.duration===null)).toBe(true);
  const manifest=JSON.parse(readFileSync('art/generated/ash-warden-uploaded-sounds-v1/manifest.json','utf8'))as{entries:{file:string;sha256:string}[]};for(const e of manifest.entries){const r=await page.request.get(e.file.replace('public/','/'));expect(r.ok()).toBe(true);expect(createHash('sha256').update(await r.body()).digest('hex')).toBe(e.sha256);}
  await page.keyboard.press('Escape');await expect.poll(()=>page.evaluate(()=>window.__PIXEL__!.audio().sources)).toBe(0);
  await page.evaluate(()=>window.__PIXEL__!.restartScene());await page.waitForFunction(()=>window.__PIXEL__?.world.status==='menu'&&window.__PIXEL__?.audio().samplesLoaded===16);expect(await page.evaluate(()=>window.__PIXEL__!.audio().sources)).toBe(0);
  expect(errors).toEqual([]);writeFileSync(root+'/evidence.json',JSON.stringify({audio,files:[...files],starts,errors},null,2));
});
test('missing boss files use procedural fallback without interrupting Mage audio or lifecycle',async({page})=>{
  await page.route('**/assets/audio/ash-warden-uploaded-v1/*.wav',r=>r.abort());await setup(page);
  expect(await page.evaluate(()=>window.__PIXEL__!.audio().samplesLoaded)).toBe(11);expect(await page.evaluate(()=>window.__PIXEL__!.audio().failedAssets)).toBe(5);
  await page.evaluate(()=>window.__PIXEL__!.world.sound('final-slam'));await expect.poll(()=>page.evaluate(()=>window.__PIXEL__!.audio().played['final.slam']??0)).toBe(1);
  expect(await page.evaluate(()=>window.__PIXEL__!.audio().samplePlays?.['warden-slam']??0)).toBe(0);expect(await page.evaluate(()=>window.__PIXEL__!.audio().sampleFallbacks)).toBeGreaterThan(0);
  await page.keyboard.press('Escape');await expect.poll(()=>page.evaluate(()=>window.__PIXEL__!.audio().sources)).toBe(0);
});
