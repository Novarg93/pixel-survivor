import { expect,test } from '@playwright/test';
import { mkdirSync,writeFileSync } from 'node:fs';
const directory='screenshots/encounter-director-2';
for(const width of [1280,390])for(const moving of [false,true])test(`real HP Mage39 in scheduled10-12min encounters ${width}/${moving?'positioning':'stationary'}`,async({page})=>{
  test.setTimeout(155000);mkdirSync(directory,{recursive:true});const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize({width,height:width===390?844:720});await page.goto('/?test=1');await page.getByRole('button',{name:'Начать забег'}).click();
  const handle=await page.evaluateHandle(async moving=>{const module='/tests/helpers/encounterTrial.ts',{setupEncounterTrial}=await import(module),w=window.__PIXEL__!.world;return setupEncounterTrial(w,w.width,w.height,moving);},moving);
  const samples=[];let captured=false,capturedWave=false;
  for(let i=0;i<140;i++){
    await page.waitForTimeout(1000);const s=await handle.evaluate(s=>({...s}));samples.push(s);
    if(!captured&&(s.seconds>=20||s.status==='over')){await page.screenshot({path:`${directory}/survival-${width}-${moving?'moving':'stationary'}.png`});await page.locator('canvas').screenshot({path:`${directory}/survival-canvas-${width}-${moving?'moving':'stationary'}.png`});captured=true;}
    if(!capturedWave&&moving&&s.seconds>=61){await page.screenshot({path:`${directory}/survival-endgame-${width}.png`});capturedWave=true;}
    if(s.status==='over'||s.seconds>=120)break;
  }
  const result=await handle.evaluate(s=>({...s})),events=await page.evaluate(()=>window.__PIXEL__!.world.encounterDirector.history);
  expect(result.invalidInvulnerability).toBe(false);expect(result.seconds>=119.9||result.status==='over').toBe(true);expect(result.peakBosses).toBeLessThanOrEqual(3);expect(result.peakGuardians).toBeLessThanOrEqual(3);expect(result.peakRegular).toBeLessThanOrEqual(150);expect(errors).toEqual([]);
  writeFileSync(`${directory}/survival-${width}-${moving?'moving':'stationary'}.json`,JSON.stringify({fixture:'Actual Phaser RAF, scheduled10-12min encounters, seed12345, legal Mage39+3damage artifacts, no test invulnerability, fixed loadout; positioning pilot reads hazards and uses normal Blink',result,events,samples,errors},null,2));
});
