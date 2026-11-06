export const FROST_AVALANCHE = { key: 'frost-avalanche-crest', size: 384, radius: 188 } as const;

// Original pixel snowbank: a hollow rolling crest, blue ice facets and scattered powder.
// Coordinate hashes never consume gameplay RNG. Authored once, scaled by the game clock.
export function frostAvalanchePixels() {
  const { size, radius } = FROST_AVALANCHE, pixels = new Uint8ClampedArray(size * size * 4);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const dx=x-size/2,dy=y-size/2,r=Math.hypot(dx,dy),a=Math.atan2(dy,dx);
    const noise=((Math.imul(x,374761393)^Math.imul(y,668265263))>>>0)%101/100;
    const billow=Math.sin(a*29+.8)*3+Math.sin(a*53)*2;
    const crest=radius-8+billow,depth=crest-r;
    let color:readonly number[]|undefined,alpha=0;
    if(depth>=0&&depth<30){
      const facet=Math.sin(a*71+Math.floor(depth/5)*.8);
      color=depth<5?[233,253,255]:depth<12?[178,234,249]:facet>.15?[108,188,221]:[64,126,178];
      alpha=depth<12?225:Math.round(185*(1-(depth-12)/22));
      if(depth>19&&noise<.28)alpha=0;
      if(facet>.75&&depth<22){color=[219,248,255];alpha=220;}
    }else if(r<=radius&&depth<0&&depth>-9&&noise>.82){color=[216,247,255];alpha=190;}
    else if(depth>=30&&depth<46&&noise>.88){color=[141,211,235];alpha=Math.round(95*(1-(depth-30)/16));}
    if(color&&alpha>0){const i=(y*size+x)*4;pixels[i]=color[0]!;pixels[i+1]=color[1]!;pixels[i+2]=color[2]!;pixels[i+3]=alpha;}
  }
  return pixels;
}
