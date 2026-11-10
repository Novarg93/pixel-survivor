import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
process.env.PLAYWRIGHT_BROWSERS_PATH??=resolve('.browsers');
const {chromium}=await import('@playwright/test'),browser=await chromium.launch({channel:'chromium',headless:true});
const root='art/generated/mage-phantom-cast-pixellab-v1';mkdirSync(root+'/comparisons/gif-frames',{recursive:true});
try{const page=await browser.newPage({viewport:{width:1280,height:850}});await page.goto('http://127.0.0.1:5173/'+root+'/viewer.html');await page.waitForFunction(()=>document.documentElement.dataset.ready==='true');
  await page.evaluate(()=>{document.querySelector('#zoom').value='4';document.querySelector('#mode').value='combined';document.querySelector('#direction').checked=false;document.querySelector('#fireball').checked=false;});
  for(let i=0;i<12;i++){const data=await page.evaluate(i=>{window.phantomReview.seekFrame(i);const src=document.querySelector('#canvas'),out=document.createElement('canvas');out.width=out.height=512;out.getContext('2d').drawImage(src,src.width/2-256,Math.round(src.height*.62-370),512,512,0,0,512,512);return out.toDataURL();},i);writeFileSync(root+'/comparisons/gif-frames/'+String(i).padStart(2,'0')+'.png',Buffer.from(data.split(',')[1],'base64'));}
  console.log('Captured 12 full-size opaque-background combined preview frames from the actual Viewer; source phantom remains RGBA.');
}finally{await browser.close();}
