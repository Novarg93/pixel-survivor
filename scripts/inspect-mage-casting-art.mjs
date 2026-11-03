/* global createImageBitmap, fetch, document */
import process from 'node:process';
import { resolve } from 'node:path';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { Buffer } from 'node:buffer';
import { drawMageAtlas } from './mage-art-source.mjs';
process.env.PLAYWRIGHT_BROWSERS_PATH ??= resolve('.browsers');
const { chromium }=await import('@playwright/test');
const browser=await chromium.launch({channel:'chromium',headless:true});
try{
  const page=await browser.newPage();
  const frames=await page.evaluate(async({data,manifest})=>{
    const image=await createImageBitmap(await(await fetch(data)).blob()),c=document.createElement('canvas'),g=c.getContext('2d',{willReadFrequently:true});
    return Object.entries(manifest.frames).map(([name,{frame:f}])=>{
      c.width=f.w;c.height=f.h;g.drawImage(image,f.x,f.y,f.w,f.h,0,0,f.w,f.h);const data=g.getImageData(0,0,f.w,f.h).data;let border=0,soft=0,pixels=0,hash=2166136261;
      for(let i=0;i<data.length;i++){hash=Math.imul(hash^data[i],16777619);if(i%4===3&&data[i]){pixels++;if(data[i]!==255)soft++;const n=(i-3)/4,x=n%f.w,y=Math.floor(n/f.w);if(!x||!y||x===f.w-1||y===f.h-1)border++;}}
      return{name,pixels,border,soft,hash:hash>>>0};
    });
  },{data:'data:image/png;base64,'+readFileSync('public/assets/hd/mage-casting.png').toString('base64'),manifest:JSON.parse(readFileSync('public/assets/hd/mage-casting.json','utf8'))});
  const bad=frames.filter(f=>f.border||f.soft||f.pixels<(f.name.startsWith('body-')?500:100));
  mkdirSync('docs/mage-casting',{recursive:true});writeFileSync('docs/mage-casting/PIXEL_QA.json',JSON.stringify({frames,bad},null,2));
  const old=JSON.parse(readFileSync('public/assets/hd/mage.json','utf8'));
  const originalLayout={width:old.meta.size.w,height:old.meta.size.h,frames:Object.entries(old.frames).map(([name,{frame}])=>{const match=/^mage-(down|up|side)-(idle|walk|hurt|death)-(\d)$/.exec(name);return{name,frame,facing:match?.[1]??'',pose:match?.[2]??'fireball',index:Number(match?.[3]??name.split('-').at(-1))};})};
  const original=await page.evaluate(drawMageAtlas,originalLayout), originalUnchanged=Buffer.from(original.split(',')[1],'base64').equals(readFileSync('public/assets/hd/mage.png'));
  writeFileSync('docs/mage-casting/ORIGINAL_REPRODUCIBILITY.json',JSON.stringify({originalMagePngReproducedByteForByte:originalUnchanged},null,2));
  if(!originalUnchanged)throw new Error('Original Mage source must still reproduce its accepted PNG');
  globalThis.console.log(JSON.stringify({frames:frames.length,bad},null,2));if(bad.length)process.exitCode=1;
}finally{await browser.close();}
