import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {readPNG,png} from '../ash-warden-walk-rd-v2/png-io.mjs';
const root='art/generated/mage-phantom-cast-pixellab-v1',hero=JSON.parse(readFileSync('src/game/art/mageHeroManifest.json'));
const waists=JSON.parse(readFileSync('src/game/art/mageHeroWaists.json'));
const atlas=hero.pages.map(p=>({image:readPNG(`public/assets/hd/mage-hero-v2/${p.index}.png`),data:JSON.parse(readFileSync(`public/assets/hd/mage-hero-v2/${p.index}.json`))}));
mkdirSync(root+'/reference/runtime',{recursive:true});const clips={};
for(const name of ['run-north','idle-north','fireball-north','fireball-south']){
  clips[name]=[];
  for(const [i,key]of hero.clips[name].frames.entries()){
    const page=atlas[hero.locations[key]],f=page.data.frames[key],pixels=new Uint8Array(hero.canvas**2*4),r=f.frame,s=f.spriteSourceSize;
    for(let y=0;y<r.h;y++)pixels.set(page.image.pixels.subarray(((r.y+y)*page.image.width+r.x)*4,((r.y+y)*page.image.width+r.x+r.w)*4),((s.y+y)*hero.canvas+s.x)*4);
    const file=`reference/runtime/${name}-${String(i).padStart(2,'0')}.png`;writeFileSync(root+'/'+file,png(pixels,hero.canvas,hero.canvas));
    clips[name].push({file,key,waist:waists.frames[key]});
  }
}
writeFileSync(root+'/reference/runtime-clips.json',JSON.stringify({canvas:hero.canvas,pivot:hero.pivot,displaySizeWorld:hero.displaySize,runDurationsMs:hero.clips['run-north'].frames.map(()=>60),clips},null,2)+'\n');
console.log('Exported '+Object.values(clips).flat().length+' actual full-canvas runtime frames without changing their pixels or source atlases.');
