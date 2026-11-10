import {expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {inflateSync} from 'node:zlib';
import {MAGE_HERO as pack,MAGE_HERO_ORIGIN,mageHeroFrame,mageHeroSelection} from '../../src/game/art/mageHeroPack';
import {MAGE_DIRECTIONS,type MageMotion} from '../../src/game/art/MageHeroAnimation';
import {playerHealthLayout} from '../../src/game/art/PlayerHealthBar';
import {World} from '../../src/game/systems/World';

interface Frame {frame:{x:number;y:number;w:number;h:number};sourceSize:{w:number;h:number};spriteSourceSize:{x:number;y:number;w:number;h:number};trimmed:boolean;rotated:boolean}
it('ships 72 native eight-direction clips with separate running transitions and the original four south casts',()=>{
  expect(pack.complete).toBe(true);expect(pack.missing).toEqual([]);expect(Object.keys(pack.clips)).toHaveLength(72);expect(pack.frameCount).toBe(799);
  for(const motion of ['idle','run-start','run','run-stop','fireball','lightning','meteor','defensive','death'] as MageMotion[])for(const direction of MAGE_DIRECTIONS){
    const clip=(pack.clips as Record<string,{frames:string[];loop:boolean}>)[motion+'-'+direction]!;
    expect(clip.frames.length).toBe(motion==='idle'?(direction==='south'?8:1):motion==='run'?8:motion==='run-start'?4:motion==='run-stop'?5:motion==='death'?13:17);
    for(const age of [0,.01,.2,1,999])expect(mageHeroSelection({motion,direction,age,casting:false}).texture).toMatch(/^mage-hero-v2-\d+$/);
    if(!clip.loop)expect(mageHeroFrame({motion,direction,age:999,progress:1,casting:true})).toBe(clip.frames.at(-1));
  }
  expect(pack.clips['fireball-south'].sourceFiles[0]).toContain('/originals/fireball/');
  expect(pack.clips['meteor-north'].sourceFiles[0]).toContain('/attempt-02/');
  expect(pack.clips['run-start-south-west'].sourceFiles[1]).toContain('/south-west/run/');
  expect(pack.clips['run-north'].sourceFiles[0]).toContain('/run-cycle-v2/north/');
});
it('preserves protected originals and every selected generated PNG byte-for-byte',()=>{
  for(const [file,hash]of Object.entries(pack.sources))expect(createHash('sha256').update(readFileSync(file)).digest('hex'),file).toBe(hash);
});
it('takes authored cast colors from the PNG sheets while matching the GIF alpha and timing',()=>{
  const source=JSON.parse(readFileSync('art/generated/mage-hero-v2/sources.json','utf8')) as {clips:Record<string,{colorAuthority:string;frames:{durationMs:number;gifVsPngAlphaDifferences:number;gifVsPngRgbDifferences:number}[]}>};
  for(const name of ['fireball','lightning','meteor','defensive']){
    const clip=source.clips[name]!;expect(clip.colorAuthority).toContain('original PNG');
    expect(clip.frames.every(f=>f.gifVsPngAlphaDifferences===0&&f.durationMs===130)).toBe(true);
    expect(clip.frames.reduce((n,f)=>n+f.gifVsPngRgbDifferences,0)).toBeGreaterThan(0);
  }
});
it('uses the exact PixelLab background repair without modifying the original Mage or other colors',()=>{
  const base='art/main-hero-mage/casting/directions-pixminimax-v2/lightning/north-west',audit=JSON.parse(readFileSync(base+'/repair-v1/audit.json','utf8')) as {changedPixels:number;nonArtifactChanges:number;originalSHA256:string;repairedSHA256:string;remainingGrayBootPixels:number};
  expect(audit.changedPixels).toBe(13432);expect(audit.nonArtifactChanges).toBe(0);expect(audit.remainingGrayBootPixels).toBe(5);
  expect(createHash('sha256').update(readFileSync(base+'/raw/06.png')).digest('hex')).toBe(audit.originalSHA256);
  expect(createHash('sha256').update(readFileSync(base+'/repair-v1/06.png')).digest('hex')).toBe(audit.repairedSHA256);
  expect(pack.clips['lightning-north-west'].sourceFiles[6]).toContain('/repair-v1/');
});
it('packs all frames in bounded trimmed pages with a fixed full-canvas pivot and no overlapping rectangles',()=>{
  let count=0;expect(pack.rgbaBytes).toBeLessThan(24*1024*1024);expect(pack.uniqueFrameCount).toBeLessThan(pack.frameCount);expect(MAGE_HERO_ORIGIN).toEqual({x:.5,y:126/128});expect(pack.displaySize).toBe(40);
  for(const page of pack.pages){
    const data=JSON.parse(readFileSync(`public/assets/hd/mage-hero-v2/${page.index}.json`,'utf8')) as {frames:Record<string,Frame>};
    const entries=Object.entries(data.frames);count+=entries.length;
    expect(page.width).toBeLessThanOrEqual(2048);expect(page.height).toBeLessThanOrEqual(2048);
    for(const [i,[name,f]]of entries.entries()){
      expect((pack.locations as Record<string,number>)[name]).toBe(page.index);expect(f.sourceSize).toEqual({w:pack.canvas,h:pack.canvas});expect(f.trimmed).toBe(true);expect(f.rotated).toBe(false);
      expect(f.frame.x+f.frame.w).toBeLessThanOrEqual(page.width);expect(f.frame.y+f.frame.h).toBeLessThanOrEqual(page.height);
      expect(f.spriteSourceSize.x+f.spriteSourceSize.w).toBeLessThanOrEqual(pack.canvas);expect(f.spriteSourceSize.y+f.spriteSourceSize.h).toBeLessThanOrEqual(pack.canvas);
      for(const [otherName,other]of entries.slice(i+1)){
        const a=f.frame,b=other.frame,aliases=pack.aliases as Record<string,string>;
        if(!(a.x+a.w<=b.x||b.x+b.w<=a.x||a.y+a.h<=b.y||b.y+b.h<=a.y)){
          expect(aliases[name]??name).toBe(aliases[otherName]??otherName);expect(a).toEqual(b);
        }
      }
    }
  }
  expect(count).toBe(pack.frameCount);
});
it('reconstructs each trimmed frame to its exact nearest-neighbor sampled pixel hash',()=>{
  const audit=JSON.parse(readFileSync('art/generated/mage-hero-v2/runtime-audit.json','utf8')) as {frames:{name:string;pixelHash:string}[]};
  const expected=new Map(audit.frames.map(f=>[f.name,f.pixelHash]));
  for(const page of pack.pages){
    const image=readFileSync(`public/assets/hd/mage-hero-v2/${page.index}.png`),chunks:Buffer[]=[];
    for(let p=8;p<image.length;){const n=image.readUInt32BE(p);if(image.toString('ascii',p+4,p+8)==='IDAT')chunks.push(image.subarray(p+8,p+8+n));p+=n+12;}
    const raw=inflateSync(Buffer.concat(chunks)),stride=page.width*4+1;
    const data=JSON.parse(readFileSync(`public/assets/hd/mage-hero-v2/${page.index}.json`,'utf8')) as {frames:Record<string,Frame>};
    for(const [name,f]of Object.entries(data.frames)){
      const pixels=Buffer.alloc(pack.canvas*pack.canvas*4),r=f.frame,s=f.spriteSourceSize;
      for(let y=0;y<r.h;y++){expect(raw[(r.y+y)*stride]).toBe(0);raw.copy(pixels,((s.y+y)*pack.canvas+s.x)*4,(r.y+y)*stride+1+r.x*4,(r.y+y)*stride+1+(r.x+r.w)*4);}
      expect(createHash('sha256').update(pixels).digest('hex'),name).toBe(expected.get(name));
    }
  }
});
it('places Mage HP above the new head while retaining the Warrior layout and collision radius',()=>{
  const w=new World(8),before=JSON.stringify(w);expect(playerHealthLayout(w).y-w.player.y).toBe(-44);expect(JSON.stringify(w)).toBe(before);
  const warrior=new World(9,{character:'warrior'});expect(playerHealthLayout(warrior).y-warrior.player.y).toBe(-33);
});
