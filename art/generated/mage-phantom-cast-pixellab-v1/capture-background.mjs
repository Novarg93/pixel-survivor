import {writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
process.env.PLAYWRIGHT_BROWSERS_PATH??=resolve('.browsers');
const {chromium}=await import('@playwright/test'),browser=await chromium.launch({channel:'chromium',headless:true});
try{const page=await browser.newPage();await page.goto('http://127.0.0.1:5173/art/generated/mage-phantom-cast-pixellab-v1/background-source.html');await page.waitForFunction(()=>window.groveReady===true);
  const data=await page.locator('canvas').evaluate(c=>c.toDataURL());writeFileSync('art/generated/mage-phantom-cast-pixellab-v1/reference/shard-grove.png',Buffer.from(data.split(',')[1],'base64'));
  console.log('Saved actual Shard Grove painter: 1024x2048, native terrain texels; 2 texture pixels per world unit.');
}finally{await browser.close();}
