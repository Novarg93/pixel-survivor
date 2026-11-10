import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import process from 'node:process';
import { Buffer } from 'node:buffer';
process.env.PLAYWRIGHT_BROWSERS_PATH ??= resolve('.browsers');
const { chromium } = await import('@playwright/test');
const root = 'art/generated/ash-warden-retrodiffusion-01/';
const browser = await chromium.launch({ channel: 'chromium', headless: true });
try {
  const page = await browser.newPage();
  const results = {};
  for (const file of readdirSync(root).filter(f => /^attempt-\d\d(?:-non-bg)?\.png$/.test(f))) {
    const result = await page.evaluate(async source => {
      const im = new globalThis.Image(); im.src = source; await im.decode();
      const c = globalThis.document.createElement('canvas'); c.width = im.width; c.height = im.height;
      const x = c.getContext('2d'); x.drawImage(im, 0, 0);
      const data = x.getImageData(0,0,c.width,c.height).data;
      let partial=0, transparent=0, edge=0, minX=c.width,minY=c.height,maxX=-1,maxY=-1;
      const colors = new Set();
      for(let y=0;y<c.height;y++)for(let i=0;i<c.width;i++) {
        const k=(y*c.width+i)*4, a=data[k+3]; if(!a){transparent++;continue;}
        if(a!==255)partial++; if(!i||!y||i===c.width-1||y===c.height-1)edge++;
        minX=Math.min(minX,i);minY=Math.min(minY,y);maxX=Math.max(maxX,i);maxY=Math.max(maxY,y);
        colors.add(data.slice(k,k+3).join(','));
      }
      const big=globalThis.document.createElement('canvas');big.width=c.width*4;big.height=c.height*4;
      const b=big.getContext('2d');b.imageSmoothingEnabled=false;b.fillStyle='#28353c';b.fillRect(0,0,big.width,big.height);b.drawImage(c,0,0,big.width,big.height);
      const roiBounds={};
      for(const [name,box] of Object.entries({helmet:[64,8,80,34],boots:[38,105,108,124]})) {
        const ys=[];
        for(let y=box[1];y<box[3];y++)for(let i=box[0];i<box[2];i++)if(data[(y*c.width+i)*4+3])ys.push(y);
        roiBounds[name]={box,minY:Math.min(...ys),maxY:Math.max(...ys)};
      }
      return {roiBounds,width:c.width,height:c.height,partial,transparent,edge,colors:colors.size,bounds:{minX,minY,maxX,maxY},preview:big.toDataURL()};
    }, 'data:image/png;base64,' + readFileSync(root+file).toString('base64'));
    writeFileSync(root+file.replace('.png','-x4.png'),Buffer.from(result.preview.split(',')[1],'base64'));
    delete result.preview;results[file]=result;
  }
  writeFileSync(root+'png-validation.json',JSON.stringify(results,null,2));
  globalThis.console.log(JSON.stringify(results));
} finally { await browser.close(); }
