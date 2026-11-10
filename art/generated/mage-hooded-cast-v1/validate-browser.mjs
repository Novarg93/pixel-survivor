const root='C:/Users/Novarg/Desktop/PixelSurvivor/art/generated/mage-hooded-cast-v1/';
const state=page=>page.evaluate(()=>globalThis.HOODED_CAST_STATE);
const assert=(ok,message)=>{if(!ok)throw Error(message);};
export async function validate(page){
 const errors=[],report=[];page.on('pageerror',e=>errors.push(e.message));
 for(const protocol of ['file','http'])for(const size of [{width:1280,height:720},{width:390,height:844}]){
  await page.setViewportSize(size);await page.goto(protocol==='file'?'file:///'+root+'viewer.html':'http://127.0.0.1:5173/art/generated/mage-hooded-cast-v1/viewer.html');
  await page.waitForFunction(()=>globalThis.HOODED_CAST_READY||globalThis.HOODED_CAST_ERROR,{},{timeout:10000});
  await page.waitForFunction(()=>[...globalThis.document.images].every(i=>i.complete&&i.naturalWidth>0));
  assert(await page.evaluate(()=>!!globalThis.HOODED_CAST_READY),'Viewer error');
  const speedSamples=[];
  for(const speed of ['0.25','0.5','1','2']){
   await page.selectOption('#clip','forward');await page.selectOption('#speed',speed);
   const a=await state(page);await page.waitForTimeout(140);const b=await state(page),delta=(b.age-a.age+880)%880;
   assert(delta>0,'Animation did not advance at '+speed);speedSamples.push({speed,deltaMs:delta});
  }
  await page.locator('#pause').click();const paused=await state(page);await page.waitForTimeout(180);assert((await state(page)).age===paused.age,'Pause advanced');
  for(const id of ['forward','high','low']){
   await page.selectOption('#clip',id);await page.locator('#frame').fill('3');assert((await state(page)).frame===3,'Scrub failed');
   await page.locator('#next').click();assert((await state(page)).frame===4,'Next failed');await page.locator('#previous').click();assert((await state(page)).frame===3,'Previous failed');
  }
  const canvas=page.locator('#stage');await page.selectOption('#background','neutral');const a=await canvas.screenshot();await page.selectOption('#background','grove');const b=await canvas.screenshot();assert(!a.equals(b),'Backdrop unchanged');
  await page.selectOption('#mode','target');
  const aims=[];
  for(const [x,y,expectedFacing,expectedClip]of [[1100,275,'east','forward'],[180,275,'west','forward'],[1000,90,'east','high'],[280,90,'west','high'],[1000,490,'east','low'],[280,490,'west','low']]){
   const box=await canvas.boundingBox();await canvas.dispatchEvent('pointerdown',{clientX:box.x+x*box.width/1280,clientY:box.y+y*box.height/560});
   const s=await state(page);assert(s.facing===expectedFacing&&s.clip===expectedClip,'Wrong target gesture '+JSON.stringify(s));aims.push({x,y,facing:s.facing,clip:s.clip});
  }
  await page.selectOption('#mode','compare');await page.selectOption('#background','neutral');await page.selectOption('#clip','forward');await page.locator('#frame').fill('3');
  const layout=await page.evaluate(()=>{const {document,innerWidth}=globalThis;return{images:document.images.length,missing:[...document.images].filter(i=>!i.complete||!i.naturalWidth).length,overflow:document.documentElement.scrollWidth>innerWidth};});
  assert(!layout.missing&&!layout.overflow,'Layout/image failure');await page.screenshot({path:root+'screenshots/'+protocol+'-'+size.width+'.png',fullPage:true});
  report.push({protocol,...size,...layout,speedSamples,pauseFrozen:true,frameControls:true,backgroundChanged:true,targetCases:aims});
 }
 await page.setViewportSize({width:1344,height:900});await page.goto('http://127.0.0.1:5173/art/generated/mage-hooded-cast-v1/viewer.html');await page.waitForFunction(()=>globalThis.HOODED_CAST_READY);
 const gifs=await page.evaluate(async()=>{
  const {fetch,ImageDecoder,createImageBitmap,OffscreenCanvas}=globalThis,data=globalThis.HOODED_CAST_DATA,results=[];
  if(!globalThis.ImageDecoder)throw Error('Chromium ImageDecoder unavailable');
  for(const [id,c]of Object.entries(data.clips)){
   const bytes=await (await fetch(c.gif)).arrayBuffer(),decoder=new ImageDecoder({data:bytes,type:'image/gif'});await decoder.tracks.ready;
   if(decoder.tracks.selectedTrack.frameCount!==6||decoder.tracks.selectedTrack.repetitionCount!==0)throw Error('GIF frames/loop '+id);
   let durationUs=0,differences=0;
   for(let i=0;i<6;i++){
    const {image}=await decoder.decode({frameIndex:i}),rgba=new Uint8Array(96*96*4);durationUs+=image.duration;await image.copyTo(rgba,{format:'RGBA'});
    const bitmap=await createImageBitmap(await(await fetch(c.frames[i].file)).blob()),canvas=new OffscreenCanvas(96,96),g=canvas.getContext('2d');g.drawImage(bitmap,0,0);const expected=g.getImageData(0,0,96,96).data;
    for(let k=0;k<rgba.length;k+=4)if(rgba[k+3]!==expected[k+3]||expected[k+3]&&(rgba[k]!==expected[k]||rgba[k+1]!==expected[k+1]||rgba[k+2]!==expected[k+2]))differences++;
    image.close();bitmap.close();
   }
   if(durationUs!==480000||differences)throw Error('GIF differs '+id+' '+durationUs+' '+differences);
   results.push({id,frames:6,durationMs:durationUs/1000,repetitionCount:0,rgbaDifferences:differences});decoder.close();
  }
  return results;
 });
 await page.locator('#pause').click();
 for(const id of ['forward','high','low']){
  await page.selectOption('#clip',id);await page.locator('#frame').fill('3');await page.locator('#stage').screenshot({path:root+'screenshots/'+id+'-release.png'});await page.locator('#sheet').screenshot({path:root+'screenshots/'+id+'-poses.png'});
 }
 await page.locator('#world').screenshot({path:root+'screenshots/game-scale.png'});
 assert(!errors.length,'Browser errors: '+errors.join(';'));
 return{report,gifs,errors,pass:true};
}
