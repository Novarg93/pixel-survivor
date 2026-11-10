import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {readPNG} from '../art/generated/ash-warden-walk-rd-v2/png-io.mjs';
const root='art/generated/mage-phantom-cast-production-v1',pack=JSON.parse(readFileSync('src/game/art/magePhantomManifest.json')),audit=JSON.parse(readFileSync(root+'/source-audit.json'));
const hash=file=>createHash('sha256').update(readFileSync(file)).digest('hex');
const atlas=readPNG('public/assets/hd/mage-phantom-v1/atlas.png'),meta=JSON.parse(readFileSync('public/assets/hd/mage-phantom-v1/atlas.json'));
assert.equal(pack.durationMs,340);assert.equal(pack.durationsMs.reduce((a,b)=>a+b,0),340);assert.equal(pack.loop,false);assert.equal(pack.directions.length,8);assert.equal(audit.frames.length,112);
assert.equal(pack.atlas.rgbaBytes,atlas.width*atlas.height*4);assert(pack.atlas.rgbaBytes<=2*1024*1024);
let nativeFrames=0,partialAlphaPixels=0,minMargin=256;
for(const direction of pack.directions)assert.equal(hash(root+'/reference/'+direction+'.png'),hash('art/generated/mage-hero-v2/first-frames/'+direction+'.png'),'Wrong Mage reference '+direction);
for(const [file,expected]of Object.entries(audit.sources)){
  assert.equal(hash(file),expected,'Source changed: '+file);
  const image=readPNG(file);assert.equal(image.width,256);assert.equal(image.height,256);
  if(file.includes('/processed/')){
    nativeFrames++;
    for(let y=0;y<256;y++)for(let x=0;x<256;x++){const a=image.pixels[(y*256+x)*4+3];if(a){assert(y<200,'Leg region: '+file);minMargin=Math.min(minMargin,x,y,255-x,255-y);if(a<255)partialAlphaPixels++;}}
  }
}
assert.equal(nativeFrames,96);assert(minMargin>=1);assert(partialAlphaPixels>10000);
for(const item of audit.frames){
  const source=readPNG(item.source),frame=meta.frames[item.name],c=frame.spriteSourceSize,r=frame.frame;
  assert.deepEqual(frame.sourceSize,{w:112,h:112});
  for(let y=0;y<112;y++)for(let x=0;x<112;x++){
    const from=(Math.floor(y*256/112)*256+Math.floor(x*256/112))*4,inside=x>=c.x&&y>=c.y&&x<c.x+c.w&&y<c.y+c.h,to=((r.y+y-c.y)*atlas.width+r.x+x-c.x)*4;
    assert.equal(inside?atlas.pixels[to+3]:0,source.pixels[from+3],item.name+' alpha');
    if(source.pixels[from+3])for(let channel=0;channel<3;channel++)assert.equal(atlas.pixels[to+channel],source.pixels[from+channel],item.name+' colour');
  }
}
for(let i=0;i<12;i++)assert.equal(hash(root+'/processed/south/'+String(i).padStart(2,'0')+'.png'),hash('art/generated/mage-phantom-cast-pixellab-v1/processed/frame-'+String(i).padStart(2,'0')+'.png'),'Accepted South changed');
const before=JSON.parse(readFileSync('art/generated/mage-phantom-cast-pixellab-v1/validation/protected-before.json'));
const allowed=new Set(['src/game/art/MageHeroAnimation.ts','src/game/art/MageHeroArt.ts','src/game/art/mageHeroLayers.ts','src/game/art/MageCastingController.ts','src/game/art/GameArt.ts','src/game/art/assetRegistry.ts','src/game/art/RegularLightningArt.ts','src/game/scenes/GameScene.ts','eslint.config.js']);
let protectedUnchanged=0;for(const [file,expected]of Object.entries(before)){if(allowed.has(file))continue;assert.equal(hash(file),expected,'Unrelated runtime/asset changed: '+file);protectedUnchanged++;}
const result={pass:true,nativeFrames,atlasFrames:audit.frames.length,canvas:112,sourceCanvas:256,durationMs:340,rgbaBytes:pack.atlas.rgbaBytes,partialAlphaPixels,minMargin,protectedUnchanged,acceptedSouthUnchanged:true,domainAndOriginalAtlasesUnchanged:true};
writeFileSync(root+'/validation.json',JSON.stringify(result,null,2)+'\n');globalThis.console.log(JSON.stringify(result));
