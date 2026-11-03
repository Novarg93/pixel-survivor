import process from 'node:process';
import { resolve } from 'node:path';
import { writeFileSync } from 'node:fs';
import { Buffer } from 'node:buffer';
import { register } from 'node:module';
import { drawMageAtlas } from './mage-art-source.mjs';
import { drawMageCastingAtlas } from './mage-casting-art-source.mjs';
process.env.PLAYWRIGHT_BROWSERS_PATH ??= resolve('.browsers');
register('./ts-art-loader.mjs', import.meta.url);
const { mageCastingLayout } = await import('../src/game/art/mageCastingPack.ts');
const { chromium } = await import('@playwright/test');
const browser=await chromium.launch({channel:'chromium',headless:true});
try{
  const page=await browser.newPage(), layout=mageCastingLayout();
  const body=await page.evaluate(drawMageAtlas,{...layout,frames:layout.frames.filter(f=>f.layer==='body')});
  const data=await page.evaluate(drawMageCastingAtlas,{layout,body});
  writeFileSync('public/assets/hd/mage-casting.png',Buffer.from(data.split(',')[1],'base64'));
  writeFileSync('public/assets/hd/mage-casting.json',JSON.stringify({frames:Object.fromEntries(layout.frames.map(({name,frame})=>[name,{frame,rotated:false,trimmed:false}])),meta:{image:'mage-casting.png',size:{w:layout.width,h:layout.height},authoring:['scripts/mage-art-source.mjs','scripts/mage-casting-art-source.mjs'],origin:{x:.5,y:.75},worldSize:{width:24,height:30}}},null,2)+'\n');
  globalThis.console.log(`Mage casting: ${layout.frames.length} original frames, ${layout.width}x${layout.height}`);
}finally{await browser.close();}
