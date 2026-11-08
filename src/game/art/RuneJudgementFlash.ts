import type Phaser from 'phaser';
import { RUNE_WARDEN_TEXTURE, runeFlashOpacity } from './runeWardenPack';
export const RUNE_FLASH_TEXTURE='rune-judgement-flash',RUNE_FLASH_BYTES=384*128*4;
// A fixed, feathered circular presentation mask for the three opaque flash frames.
// The source atlas is never edited; this small cache is owned by the current scene.
export function createRuneFlashTexture(scene:Phaser.Scene){
  const texture=scene.textures.createCanvas(RUNE_FLASH_TEXTURE,384,128);
  if(!texture)throw new Error('Unable to create Rune Judgement flash texture');
  const source=scene.textures.get(RUNE_WARDEN_TEXTURE),ctx=texture.context;
  for(let i=0;i<3;i++){
    const name=`judgement-${13+i}`,frame=source.get(name);
    ctx.drawImage(source.getSourceImage() as HTMLImageElement,frame.cutX,frame.cutY,128,128,i*128,0,128,128);
    const data=ctx.getImageData(i*128,0,128,128);
    for(let y=0;y<128;y++)for(let x=0;x<128;x++){const alpha=(y*128+x)*4+3;data.data[alpha]=Math.round(data.data[alpha]!*runeFlashOpacity(x,y));}
    ctx.putImageData(data,i*128,0);texture.add(name,0,i*128,0,128,128);
  }
  texture.refresh();
}
