import {resolve} from 'node:path';
import {writeFileSync,mkdirSync} from 'node:fs';
import {Buffer} from 'node:buffer';
import process from 'node:process';
import {ashLayout,ASH_CLIPS} from '../src/game/art/ashGuardPack.ts';
import {drawAshGuardAtlas} from './ash-guard-art-source.mjs';
process.env.PLAYWRIGHT_BROWSERS_PATH??=resolve('.browsers');
const {chromium}=await import('@playwright/test'),browser=await chromium.launch({channel:'chromium',headless:true});
try{
  const page=await browser.newPage(),layout=ashLayout(),png=await page.evaluate(drawAshGuardAtlas,layout);
  mkdirSync('screenshots/final-boss',{recursive:true});
  writeFileSync('public/assets/hd/ash-guard.png',Buffer.from(png.split(',')[1],'base64'));
  writeFileSync('public/assets/hd/ash-guard.json',JSON.stringify({frames:Object.fromEntries(layout.frames.map(({name,frame})=>[name,{frame,rotated:false,trimmed:false}])),meta:{image:'ash-guard.png',size:{w:layout.width,h:layout.height},clips:ASH_CLIPS,authoring:'scripts/ash-guard-art-source.mjs'}},null,2)+'\n');
  globalThis.console.log(`${layout.frames.length} original frames; ${layout.width}x${layout.height}; ${(layout.width*layout.height*4/1048576).toFixed(2)} MiB RGBA`);
}finally{await browser.close();}
