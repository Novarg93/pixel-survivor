import {test,expect} from '@playwright/test';
import {mkdirSync} from 'node:fs';
import {Buffer} from 'node:buffer';
test('final meteor remains visible with zero effects, reduced motion/flash and mute',async({page})=>{
 await page.setViewportSize({width:844,height:390});await page.addInitScript(()=>Object.defineProperty(HTMLElement.prototype,'requestFullscreen',{value:undefined}));
 await page.goto('/?test=1');await page.locator('.play-button').click();
 await page.evaluate(async()=>{
  const path='/src/game/events/bridge.ts',{commands}=await import(path);commands.emit({type:'settings',value:{volume:0,muted:true,pixelScale:2,effectsIntensity:0,reducedMotion:true,reducedFlash:true}});
  const w=window.__PIXEL__!.world;w.options.spawnRate=0;w.encounterDirector.nextAt=1e9;w.elapsed=1200;for(const a of Object.values(w.abilities))a.level=0;w.finalEncounter.begin(w);w.finalEncounter.phase='phase3';w.finalEncounter.nextCombo=Infinity;w.finalEncounter.nextVolley=.1;
 });
 await page.waitForFunction(()=>window.__PIXEL__!.world.finalEncounter.meteors.length===5);await page.evaluate(()=>window.__PIXEL__!.world.pause());
 // Keep the paused simulation fixed, and remove the overlaid Vue dialog from
 // this Canvas pixel probe. Screenshot compositing includes occluding DOM.
 await page.addStyleTag({content:'.overlay{display:none!important}'});
 const state=await page.evaluate(()=>({meteors:window.__PIXEL__!.world.finalEncounter.meteors,time:window.__PIXEL__!.world.elapsed,layers:window.__PIXEL__!.art().layers}));
 expect(state.meteors.every(m=>!m.landed)).toBe(true);
 mkdirSync('screenshots/final-boss',{recursive:true});const png=await page.locator('canvas').screenshot({path:'screenshots/final-boss/zero-effects.png'});
 const visibleBoundary=await page.evaluate(async(png)=>{
  const canvas=document.querySelector('canvas')!,image=new Image();image.src='data:image/png;base64,'+png;await image.decode();
  const sample=document.createElement('canvas');sample.width=canvas.width;sample.height=canvas.height;const ctx=sample.getContext('2d')!;ctx.drawImage(image,0,0);const pixels=ctx.getImageData(0,0,canvas.width,canvas.height).data;
  const radius=42*canvas.width/window.__PIXEL__!.world.ultimate.viewport.width;let bright=0;
  for(let i=0;i<360;i++){const a=i*Math.PI/180,x=Math.round(canvas.width/2+Math.cos(a)*radius),y=Math.round(canvas.height/2+Math.sin(a)*radius),p=(y*canvas.width+x)*4;if(pixels[p]!>210&&pixels[p+1]!>150&&pixels[p+2]!>110)bright++;}return bright;
 },Buffer.from(png).toString('base64'));expect(visibleBoundary).toBeGreaterThan(160);
 await page.waitForTimeout(150);expect(await page.evaluate(()=>window.__PIXEL__!.world.elapsed)).toBe(state.time);expect(await page.evaluate(()=>window.__PIXEL__!.audio().sources)).toBe(0);
});
