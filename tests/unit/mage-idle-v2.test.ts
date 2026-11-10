import {expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
import {inflateSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {MAGE_IDLE,MAGE_IDLE_TEXTURE,mageIdleSelection} from '../../src/game/art/mageIdlePack';
import {MAGE_HERO} from '../../src/game/art/mageHeroPack';

function image(file:string){
 const bytes=readFileSync(file),idat:Buffer[]=[];let width=0,height=0;
 for(let pos=8;pos<bytes.length;){const length=bytes.readUInt32BE(pos),type=bytes.toString('ascii',pos+4,pos+8),data=bytes.subarray(pos+8,pos+8+length);if(type==='IHDR'){width=data.readUInt32BE(0);height=data.readUInt32BE(4);expect([data[8],data[9],data[12]]).toEqual([8,6,0]);}if(type==='IDAT')idat.push(data);pos+=length+12;}
 const raw=inflateSync(Buffer.concat(idat)),stride=width*4,pixels=Buffer.alloc(stride*height);
 const paeth=(a:number,b:number,c:number)=>{const p=a+b-c,x=Math.abs(p-a),y=Math.abs(p-b),z=Math.abs(p-c);return x<=y&&x<=z?a:y<=z?b:c;};
 for(let y=0;y<height;y++)for(let x=0;x<stride;x++){const k=y*stride+x,a=x>=4?pixels[k-4]!:0,b=y?pixels[k-stride]!:0,c=y&&x>=4?pixels[k-stride-4]!:0;pixels[k]=(raw[y*(stride+1)+1+x]!+[0,a,b,(a+b)>>1,paeth(a,b,c)][raw[y*(stride+1)]!]!)&255;}
 return{width,height,pixels};
}
it('packs all 26 user PNG frames losslessly and protects the four source files',()=>{
 const atlas=image('public/assets/hd/mage-idle-v2/atlas.png'),data=JSON.parse(readFileSync('public/assets/hd/mage-idle-v2/atlas.json','utf8')) as {frames:Record<string,{frame:{x:number;y:number;w:number;h:number}}>};
 expect(Object.keys(data.frames)).toHaveLength(26);expect(MAGE_IDLE.rgbaBytes).toBe(atlas.width*atlas.height*4);expect(MAGE_IDLE.rgbaBytes).toBeLessThan(2*1024*1024);
 for(const [file,sha]of Object.entries(MAGE_IDLE.sources))expect(createHash('sha256').update(readFileSync(file)).digest('hex')).toBe(sha);
 for(const clip of Object.values(MAGE_IDLE.clips)){
  const source=image(clip.sourcePng);expect(clip.frames).toHaveLength(13);expect(clip.periodMs).toBe(1690);
  for(const [i,f]of clip.frames.entries()){
   expect(f.durationMs).toBe(130);const rect=data.frames[f.frame]!.frame,packed:Buffer[]=[];
   expect([rect.w,rect.h]).toEqual([96,96]);expect(f.bounds.partial).toBe(0);
   for(let y=0;y<96;y++){
    const k=((Math.floor(i/4)*96+y)*source.width+i%4*96)*4,a=((rect.y+y)*atlas.width+rect.x)*4;
    const row=atlas.pixels.subarray(a,a+384);expect(row.equals(source.pixels.subarray(k,k+384))).toBe(true);packed.push(row);
   }
   expect(createHash('sha256').update(Buffer.concat(packed)).digest('hex')).toBe(f.pixelSha256);
  }
 }
});
it('uses exactly two views and mirrors the agreed W/SW and NE directions with reflected pivots and hands',()=>{
 for(const [direction,body,flipX]of [['south','front',false],['south-east','front',false],['east','front',false],['west','front',true],['south-west','front',true],['north','north',false],['north-west','north',false],['north-east','north',true]] as const){
  const v=mageIdleSelection(direction,.27),base=MAGE_IDLE.clips[body];expect(v).toMatchObject({body,flipX,texture:MAGE_IDLE_TEXTURE,index:2});
  expect(v.origin.x*96).toBe(flipX?96-base.pivot.x:base.pivot.x);expect(v.origin.y*96).toBe(base.pivot.y);
  expect(v.hand.x).toBe(flipX?96-base.frames[2]!.hand.x:base.frames[2]!.hand.x);expect(v.hand.y).toBe(base.frames[2]!.hand.y);
 }
});
it('preserves the authored 130ms cadence, complete 13-frame cycle and exact loop boundary',()=>{
 for(const direction of ['south','north'] as const){
  expect(mageIdleSelection(direction,-1).index).toBe(0);expect(mageIdleSelection(direction,.129999).index).toBe(0);
  for(let i=0;i<13;i++)expect(mageIdleSelection(direction,i*.13).index).toBe(i);
  expect(mageIdleSelection(direction,1.689).index).toBe(12);expect(mageIdleSelection(direction,1.69).index).toBe(0);expect(mageIdleSelection(direction,169).index).toBe(0);
 }
});
it('preserves the previous rendered hero height and anchors both views at their original soles',()=>{
 const front=MAGE_IDLE.clips.front,back=MAGE_IDLE.clips.north;
 expect((front.frames[0]!.bounds.bottom-front.frames[0]!.bounds.top+1)*MAGE_IDLE.displaySize/96).toBeCloseTo(MAGE_IDLE.visibleHeightWorld,10);
 expect(MAGE_IDLE.visibleHeightWorld).toBeCloseTo(96*MAGE_HERO.displaySize/MAGE_HERO.canvas,10);
 expect(front.pivot.y).toBe(front.frames[0]!.bounds.bottom+1);expect(back.pivot.y).toBe(back.frames[0]!.bounds.bottom+1);
});
