import {writeFileSync,readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import process from 'node:process';
import {Buffer} from 'node:buffer';
import console from 'node:console';
process.env.PLAYWRIGHT_BROWSERS_PATH??=resolve('.browsers');
const {chromium}=await import('@playwright/test'),browser=await chromium.launch({channel:'chromium',headless:true});
const root='art/generated/mage-blink-v1',sources=['src/game/art/groveArtPack.ts','src/game/art/hdForest.ts','src/game/config/biomes.ts','src/game/utils/worldTiles.ts'];
try{
 const page=await browser.newPage();await page.goto((process.env.PIXEL_BLINK_BASE??'http://127.0.0.1:5187')+'/'+root+'/background-source.html');await page.waitForFunction(()=>globalThis.BLINK_BACKGROUNDS_READY);
 for(const id of ['grove','forest']){const url=await page.locator('#'+id).evaluate(c=>c.toDataURL());writeFileSync(`${root}/prepared/${id}.png`,Buffer.from(url.split(',')[1],'base64'));}
 writeFileSync(root+'/backgrounds.json',JSON.stringify({description:'Preview backgrounds from actual runtime terrain painters, native 2 texels per world unit; no gameplay screenshot.',canvas:[2048,1024],texelsPerWorldUnit:2,grove:{tileOrigin:[-32,-16],phase:'normal'},forest:{chunkOrigin:[-4,-2],chunksWide:8,chunksHigh:4},sources:Object.fromEntries(sources.map(file=>[file,createHash('sha256').update(readFileSync(file)).digest('hex')]))},null,2)+'\n');
 console.log('Captured both runtime terrain painters: 2048×1024 each, enough for 1:1 world view.');
}finally{await browser.close();}
