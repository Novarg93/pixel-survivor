import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {runInNewContext} from 'node:vm';

const root='art/generated/mage-phantom-cast-pixellab-v1';
const http='http://127.0.0.1:5173/'+root+'/viewer.html';
const local=pathToFileURL(resolve(root+'/viewer.html')).href;
const bundled={window:{}};
runInNewContext(readFileSync(root+'/viewer-data.js','utf8'),bundled);
const data=JSON.parse(JSON.stringify(bundled.window.phantomViewerData));
assert.deepEqual(data.animation,JSON.parse(readFileSync(root+'/animation.json','utf8')));
assert.deepEqual(data.runtime,JSON.parse(readFileSync(root+'/reference/runtime-clips.json','utf8')));

process.env.PLAYWRIGHT_BROWSERS_PATH??=resolve('.browsers');
const {chromium}=await import('@playwright/test');
const browser=await chromium.launch({channel:'chromium',headless:true});
const result={metadataMatches:true,successful:[],failures:[]};
try{
  for(const viewport of [{width:1280,height:720},{width:844,height:390}]){
    for(const [protocol,url] of [['file',local],['http',http]]){
      const page=await browser.newPage({viewport}),errors=[];
      page.on('pageerror',error=>errors.push(error.message));
      page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
      await page.goto(url);
      await page.waitForFunction(()=>document.documentElement.dataset.ready==='true',null,{timeout:15000});
      assert(await page.locator('#loading').isHidden());
      const before=await page.evaluate(()=>window.phantomReview.snapshot());
      await page.waitForFunction(start=>window.phantomReview.snapshot().runClock>start+80,before.runClock);
      await page.evaluate(()=>window.phantomReview.seekFrame(6));
      assert.equal((await page.evaluate(()=>window.phantomReview.snapshot())).frame,6);
      // Screenshot works for file: even when local images taint canvas readback.
      await page.screenshot({path:root+'/screenshots/loading-'+protocol+'-'+viewport.width+'.png'});
      const pixels=await page.locator('#canvas').screenshot();
      await page.waitForTimeout(80);
      assert.deepEqual(await page.locator('#canvas').screenshot(),pixels,'Pause must hold the canvas');
      await page.selectOption('#mode','comparison');
      assert.equal((await page.evaluate(()=>window.phantomReview.snapshot())).mode,'comparison');
      assert.deepEqual(errors,[]);
      result.successful.push({protocol,viewport,ready:true,runAdvances:true,scrub:true,pause:true,errors});
      await page.close();
    }
  }

  for(const failure of ['missing-image','stalled-image','missing-data-script','missing-viewer-script']){
    const page=await browser.newPage();
    const target=failure.endsWith('script')?(failure==='missing-data-script'?'viewer-data.js':'viewer.js'):'reference/shard-grove.png';
    if(failure==='stalled-image')await page.addInitScript(()=>{
      const decode=HTMLImageElement.prototype.decode;
      HTMLImageElement.prototype.decode=function(){return this.src.endsWith('/reference/shard-grove.png')?new Promise(()=>{}):decode.call(this);};
    });
    else await page.route('**/'+target,route=>route.fulfill({status:404,contentType:'text/plain',body:'Test missing asset'}));
    if(failure==='missing-image'){
      // Late successful assets must not replace the error with progress text.
      await page.route('**/layers/body.png',async route=>{await new Promise(resolve=>setTimeout(resolve,150));await route.continue();});
    }
    await page.goto(http);
    await page.waitForFunction(()=>/Ошибка|Не найден/.test(document.getElementById('loading').textContent),null,{timeout:12000});
    await page.waitForTimeout(250);
    const text=await page.locator('#loading').textContent();
    assert(await page.locator('#loading').isVisible());
    assert.match(text,/Ошибка|Не найден/);
    assert(text.includes(target),text);
    assert.notEqual(await page.getAttribute('html','data-ready'),'true');
    if(failure==='stalled-image')assert.match(text,/время ожидания/);
    result.failures.push({failure,target,visibleError:text});
    await page.close();
  }
  writeFileSync(root+'/validation/loading-validation.json',JSON.stringify(result,null,2)+'\n');
  console.log(JSON.stringify({pass:true,metadataMatches:true,successfulOpenings:result.successful.length,errorCases:result.failures.length}));
}finally{await browser.close();}
