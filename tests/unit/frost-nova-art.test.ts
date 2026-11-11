import {expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {inflateSync} from 'node:zlib';
import {World} from '../../src/game/systems/World';
import {frostUltimateNovaView} from '../../src/game/art/FrostUltimateArt';
import {MAGE_ABILITY_MANIFEST as pack,mageAbilityPlaybackFrame,mageAbilityPlaybackDuration,frostDisplaySize} from '../../src/game/art/mageAbilityPack';
import atlas from '../../public/assets/hd/mage-ability-vfx-v1/atlas.json';

const hash=(b:Uint8Array)=>createHash('sha256').update(b).digest('hex');
for(const [clip,count,native]of [['frost-nova',24,512],['frost-nova-ultimate',48,146]] as const){
  it(`${clip}: preserves source files, native timing, full-canvas pivot and every visible RGBA pixel`,()=>{
    const data=pack.clips[clip];expect(data.frameCount).toBe(count);expect(data.durationsMs).toEqual(Array(count).fill(50));
    expect(hash(readFileSync(data.input))).toBe(data.jsonSha256);expect(hash(readFileSync(data.sheet))).toBe(data.sheetSha256);
    expect(hash(readFileSync(data.sheet.replace(/\.png$/,'.gif')))).toBe(data.gifSha256);
    expect(data.sourceCanvas).toBe(native);expect(data.canvas).toBe(native+4);
    expect(data.origin).toEqual({x:.5,y:.5});expect(frostDisplaySize(clip,73)).toBe(146*(native+4)/native);
    expect(mageAbilityPlaybackDuration(clip)).toBe(count/20);
    const b=readFileSync('public/assets/hd/mage-ability-vfx-v1/atlas.png'),chunks:Buffer[]=[];
    for(let p=8;p<b.length;){const n=b.readUInt32BE(p);if(b.toString('ascii',p+4,p+8)==='IDAT')chunks.push(b.subarray(p+8,p+8+n));p+=n+12;}
    const raw=inflateSync(Buffer.concat(chunks)),stride=pack.width*4+1;
    const frames:Record<string,{frame:{x:number;y:number;w:number;h:number};spriteSourceSize:{x:number;y:number};sourceSize:{w:number;h:number}}>=atlas.frames;
    for(let i=0;i<count;i++){
      const name=`${clip}-${i}`,f=frames[name]!,pixels=Buffer.alloc(data.canvas**2*4),r=f.frame,s=f.spriteSourceSize;
      expect(f.sourceSize).toEqual({w:native+4,h:native+4});expect(mageAbilityPlaybackFrame(clip,i*.05+.001)).toBe(name);
      for(let y=0;y<r.h;y++)for(let x=0;x<r.w;x++){
        const k=(r.y+y)*stride+1+(r.x+x)*4;
        if(raw[k+3])raw.copy(pixels,((s.y+y)*data.canvas+s.x+x)*4,k,k+4);
      }
      expect(hash(pixels),name).toBe(data.pixelHashes[i]);
    }
  });
}
it('selects the approved HD source and preserves the boss-practice diameter at native detail',()=>{
  expect(pack.clips['frost-nova'].sheet).toBe('art/main-hero-mage/abilities/frost-nova-hd-v1/frost-nova-hd.png');
  expect(pack.clips['frost-nova-ultimate'].sheet).toBe('art/main-hero-mage/abilities/frost-nova-ultimate/ultimate-nova.png');
  const diameter=127.02*2,size=frostDisplaySize('frost-nova',127.02);
  expect(size*512/516).toBeCloseTo(diameter);expect(diameter*2/512).toBeCloseTo(.99234375);
  expect(pack.width).toBeLessThanOrEqual(2048);expect(pack.height).toBeLessThanOrEqual(4096);
  const rects=Object.values(atlas.frames).map(f=>f.frame);
  for(const [i,a]of rects.entries())for(const b of rects.slice(i+1))expect(a.x+a.w<=b.x||b.x+b.w<=a.x||a.y+a.h<=b.y||b.y+b.h<=a.y).toBe(true);
});
it('anchors the appearance pulse to cast origin, pauses and ends once without changing combat state',()=>{
 const w=new World(42,{spawnRate:0});w.experience.level=40;w.elapsed=900;w.ultimate.choose(w,'frost');w.ultimate.activate(w);
 const f=w.ultimate.frost;expect(frostUltimateNovaView(w,1)).toBeNull();
 w.player.x=800;w.player.y=-6000;
 for(let i=0;i<16;i++){w.elapsed=f.started+.45+i/16+.001;const before=JSON.stringify(w),v=frostUltimateNovaView(w,.7)!;expect(v).toMatchObject({frame:`pixel-survivor-ice-wave ${i}.png`,x:f.origin.x,y:f.origin.y,alpha:.7});expect(v.depth).toBeLessThan(w.player.y/10000);expect(JSON.stringify(w)).toBe(before);}
 w.pause();const paused=frostUltimateNovaView(w,1);w.step(5);expect(frostUltimateNovaView(w,1)).toEqual(paused);expect(frostUltimateNovaView(w,0)).toBeNull();
 w.elapsed=f.started+1.45;expect(frostUltimateNovaView(w,1)).toBeNull();w.status='over';expect(frostUltimateNovaView(w,1)).toBeNull();f.clear();expect(frostUltimateNovaView(w,1)).toBeNull();
});
