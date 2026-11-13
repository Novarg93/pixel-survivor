import {test,expect} from '@playwright/test';
import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import type {MageSampleId} from '../../src/game/audio/mageSamples';
const directory='screenshots/mage-sfx-elevenlabs-v1';
for(const[width,height]of [[1280,720],[844,390]])test(`local Mage samples and real menu lightning ultimate ${width}`,async({page})=>{
  test.setTimeout(40000);mkdirSync(directory,{recursive:true});const errors:string[]=[],requests:string[]=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.url().includes('/assets/audio/mage-sfx-v1/')||r.url().includes('/assets/audio/mage-sfx-uploaded-v1/')){requests.push(r.url());if(r.status()!==200)errors.push(`audio HTTP ${r.status()}`);}});
  await page.setViewportSize({width,height});await page.addInitScript(()=>{
    Object.defineProperty(HTMLElement.prototype,'requestFullscreen',{value:undefined});
    localStorage.setItem('pixel-survivor-v1',JSON.stringify({version:2,settings:{volume:.5,musicVolume:0,sfxVolume:.8,muted:false,pixelScale:2},records:[]}));
  });
  await page.goto('/?test=1');await page.waitForFunction(()=>window.__PIXEL__?.audio().samplesLoaded===36);
  expect(await page.evaluate(()=>window.__PIXEL__!.audio().sources)).toBe(0);
  const button=page.getByRole('button',{name:/Бой со Стражем/});await expect(button).toContainText('Гнев Небес');await page.screenshot({path:`${directory}/menu-${width}.png`});await button.click();
  await page.waitForFunction(()=>window.__PIXEL__!.world.finalEncounter.phase==='phase1');
  expect(await page.evaluate(()=>({selected:window.__PIXEL__!.world.ultimate.selected,charge:window.__PIXEL__!.world.ultimate.charge}))).toEqual({selected:'lightning',charge:10});
  // Audio/output fixture; this does not measure boss balance or survival.
  await page.evaluate(()=>{const w=window.__PIXEL__!.world;w.player.invulnerableUntil=Infinity;for(const a of Object.values(w.abilities))a.level=0;});
  await page.keyboard.press('q');
  const frame=await page.evaluate(async()=>{
    const w=window.__PIXEL__!.world;
    return await new Promise<string>(resolve=>{const capture=()=>{if(w.ultimate.sequence&&w.elapsed-w.ultimate.started>=.55)resolve(document.querySelector('canvas')!.toDataURL('image/png'));else requestAnimationFrame(capture);};capture();});
  });
  writeFileSync(`${directory}/lightning-release-${width}.png`,Buffer.from(frame.split(',')[1]!,'base64'));
  for(const id of ['mage-ultimate-charge','mage-ultimate-sky','mage-ultimate-overload','mage-ultimate-release']as const)await expect.poll(()=>page.evaluate(id=>window.__PIXEL__!.audio().samplePlays?.[id]??0,id)).toBeGreaterThan(0);
  await page.waitForTimeout(1350);
  for(const ability of ['fireball','frost','lightning','shield']as const){
    const sample=({fireball:'mage-fireball-cast',frost:'mage-frost-nova',lightning:'mage-lightning',shield:'mage-shield'}as const)[ability];
    await page.evaluate(ability=>window.__PIXEL__!.world.feedback({type:'ability',ability}),ability);
    await expect.poll(()=>page.evaluate(id=>window.__PIXEL__!.audio().samplePlays?.[id]??0,sample)).toBeGreaterThan(0);
  }
  for(const source of ['meteor','fireball']as const){
    const sample: MageSampleId=source==='meteor'?'mage-meteor':'mage-fireball-impact';await page.evaluate(source=>window.__PIXEL__!.world.feedback({type:'impact',source}),source);
    await expect.poll(()=>page.evaluate((id: MageSampleId)=>window.__PIXEL__!.audio().samplePlays?.[id]??0,sample)).toBeGreaterThan(0);
  }
  await page.keyboard.press('Space');await expect.poll(()=>page.evaluate(()=>window.__PIXEL__!.audio().samplePlays?.['mage-blink']??0)).toBeGreaterThan(0);
  expect(await page.evaluate(()=>window.__PIXEL__!.world.ultimate.charge)).toBe(1);
  const audio=await page.evaluate(()=>window.__PIXEL__!.audio());expect(audio.failedAssets).toBe(0);expect(audio.samplesPending).toBe(0);expect(audio.sampleFallbacks).toBe(0);expect(audio.decodedBytes).toBeLessThan(26e6);expect(audio.peakVoices).toBeLessThanOrEqual(12);
  await page.keyboard.press('Escape');await expect.poll(()=>page.evaluate(()=>window.__PIXEL__!.audio().sources)).toBe(0);
  for(let i=0;i<3;i++){await page.evaluate(()=>window.__PIXEL__!.restartScene());await page.waitForFunction(()=>window.__PIXEL__?.world.status==='menu'&&window.__PIXEL__?.audio().samplesLoaded===36);expect(await page.evaluate(()=>window.__PIXEL__!.audio().sources)).toBe(0);}
  expect(requests).toHaveLength(11);expect(errors).toEqual([]);writeFileSync(`${directory}/evidence-${width}.json`,JSON.stringify({audio,requests:requests.length,errors,realMenu:true,realUltimate:true,sceneRestarts:3},null,2));
});
test('missing local samples use immediate procedural fallback and never replay a deferred event',async({page})=>{
  await page.route('**/assets/audio/mage-sfx-*/*.wav',route=>route.abort());
  await page.addInitScript(()=>Object.defineProperty(HTMLElement.prototype,'requestFullscreen',{value:undefined}));
  await page.goto('/?test=1');await page.waitForFunction(()=>window.__PIXEL__?.audio().failedAssets===11&&window.__PIXEL__?.audio().samplesPending===0);
  await page.getByRole('button',{name:'Начать забег'}).click();await page.keyboard.press('Space');
  await expect.poll(()=>page.evaluate(()=>window.__PIXEL__!.audio().played['player.blink']??0)).toBe(1);
  expect(await page.evaluate(()=>window.__PIXEL__!.audio().sampleFallbacks)).toBeGreaterThan(0);expect(await page.evaluate(()=>window.__PIXEL__!.audio().samplesLoaded)).toBe(16);
  await page.keyboard.press('Escape');await expect.poll(()=>page.evaluate(()=>window.__PIXEL__!.audio().sources)).toBe(0);
  await page.waitForTimeout(150);expect(await page.evaluate(()=>window.__PIXEL__!.audio().played['player.blink'])).toBe(1);
});
test('all11 selected previews and44 originals decode locally in the listening gallery',async({page})=>{
  await page.goto('/art/generated/mage-sfx-elevenlabs-v1/viewer.html');await expect(page.locator('article')).toHaveCount(11);await expect(page.locator('audio')).toHaveCount(55);
  const first=page.locator('audio').first();await first.evaluate(async e=>{const audio=e as HTMLAudioElement;await audio.play();});await expect.poll(()=>first.evaluate(e=>(e as HTMLAudioElement).currentTime)).toBeGreaterThan(0);
  const files=JSON.parse(readFileSync('art/generated/mage-sfx-elevenlabs-v1/manifest.json','utf8')) as{entries:{file:string}[]};
  for(const e of files.entries){const response=await page.request.get(`/assets/audio/mage-sfx-v1/${e.file}`);expect(response.status()).toBe(200);expect((await response.body()).subarray(0,4).toString()).toBe('RIFF');}
  await page.screenshot({path:`${directory}/gallery-1280.png`,fullPage:true});
});
