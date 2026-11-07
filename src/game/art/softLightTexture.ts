import type Phaser from 'phaser';

export const SOFT_LIGHT_SIZE=128;
// Same feathered light profile for the forest atmosphere and local spell lighting.
// Each owner supplies its own key and removes the texture on scene teardown.
export function createSoftLightTexture(scene:Phaser.Scene,key:string){
  const texture=scene.textures.createCanvas(key,SOFT_LIGHT_SIZE,SOFT_LIGHT_SIZE);
  if(!texture)throw new Error(`Unable to create soft light texture: ${key}`);
  const ctx=texture.context,half=SOFT_LIGHT_SIZE/2;
  const gradient=ctx.createRadialGradient(half,half,0,half,half,half);
  gradient.addColorStop(0,'rgba(255,255,255,1)');
  gradient.addColorStop(.35,'rgba(255,255,255,.48)');
  gradient.addColorStop(1,'rgba(255,255,255,0)');
  ctx.fillStyle=gradient;ctx.fillRect(0,0,SOFT_LIGHT_SIZE,SOFT_LIGHT_SIZE);texture.refresh();
  return texture;
}
