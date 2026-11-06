import type { AtmospherePhase } from '../config/atmosphere';
import { biomeTile } from '../config/biomes';
import { tileHash } from '../utils/worldTiles';

export const GROVE_ART_PHASES: readonly AtmospherePhase[] = ['normal', 'dusk', 'dying', 'burning'];
export const GROVE_DECOR = ['tree', 'bush', 'grass', 'rock', 'mushroom', 'roots', 'stump'] as const;
export type GroveDecor = typeof GROVE_DECOR[number];
export const GROVE_ART_BUDGET = { atlasWidth: 512, atlasHeight: 896, chunkPixels: 256, warmupSeconds: 5, warmupPerFrame: 1 } as const;
type Brush = CanvasRenderingContext2D;
const palettes = {
  normal: { soil: ['#5d5948', '#615d4c'], ground: ['#3a4a3b', '#3c4c3d', '#3e4d3d', '#3d4b3b'], grass: '#667c4b', light: '#89965d', leaf: '#506d44', shade: '#2e4337', bark: '#79674c', edge: '#293c32', rock: '#7b8072' },
  dusk: { soil: ['#494b4c', '#4d4e50'], ground: ['#303d40', '#334043', '#344244', '#354145'], grass: '#586956', light: '#73806a', leaf: '#415a50', shade: '#25363c', bark: '#6c6360', edge: '#202f36', rock: '#666f75' },
  dying: { soil: ['#58544d', '#5c584f'], ground: ['#444947', '#454b47', '#474c48', '#484c46'], grass: '#7b7963', light: '#a29a7c', leaf: '#696e55', shade: '#383e3b', bark: '#8a8070', edge: '#2c3435', rock: '#767a76' },
  burning: { soil: ['#383a39', '#3c3b38'], ground: ['#303735', '#343938', '#353a38', '#373b38'], grass: '#63615a', light: '#898279', leaf: '#484b44', shade: '#262f2e', bark: '#555650', edge: '#202a2a', rock: '#626b68' },
} as const;
function rect(g: Brush, color: string, x: number, y: number, w: number, h: number) { g.fillStyle = color; g.fillRect(x, y, w, h); }
function poly(g: Brush, color: string, points: readonly number[][]) { g.fillStyle = color; g.beginPath(); points.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); g.fill(); }
function branch(g: Brush, color: string, points: number[][], width = 2) { g.strokeStyle = color; g.lineWidth = width; g.lineJoin = 'miter'; g.beginPath(); points.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke(); }
function flame(g: Brush, x: number, y: number, variant: number) {
  // Small ochre environmental flames: no white core / large halo competing with Fire.
  poly(g, '#9a5637', [[x-3,y],[x-4,y-5],[x-1,y-11-variant],[x,y-6],[x+3,y-9],[x+4,y-3],[x+2,y]]);
  poly(g, '#c48548', [[x-2,y],[x-1,y-6],[x+1,y-3],[x+2,y]]);
  rect(g, '#e2af65', x-1, y-3, 1, 3);
}
function drawGround(g: Brush, phase: AtmospherePhase, variant: number, dirt: boolean) {
  const p = palettes[phase]; rect(g, dirt ? p.soil[variant % 2] : p.ground[variant % 4], 0, 0, 32, 32);
  for (let i = 0; i < 15; i++) {
    const h = tileHash(variant * 71 + i, dirt ? 4 : 9), x = 2+h%27, y = 2+(h>>>9)%27;
    rect(g, i%2 ? p.shade : p.grass, x, y, dirt ? 2 : 1, 1);
    if (!dirt && i%3 === 0) {
      if (phase === 'normal' || phase === 'dusk') { rect(g, p.grass, x+1, y-2, 1, 2); if (phase === 'dusk') rect(g, p.shade, x-2,y,2,1); }
      else rect(g, p.grass, x, y, phase === 'dying' ? 3 : 2, 1);
    }
  }
  if (phase === 'dying' || phase === 'burning') {
    if (variant % 2 === 0) {
      branch(g, p.edge, [[0,12+variant*3],[6,15+variant*2],[10,13],[14,17],[20,19-variant],[23,24],[32,26-variant*4]], 1);
      branch(g, p.edge, [[14,17],[15+variant,11],[19+variant*2,8]], 1);
    }
    if (phase === 'burning') {
      poly(g, '#293230', [[3,5],[9,2],[14,7],[12,11],[5,13],[1,9]]);
      rect(g, '#68665b', 5, 8, 5, 1); rect(g, '#565b54', 7, 10, 3, 1);
      if (variant === 0) { branch(g, '#8d4f35', [[20,19],[23,24],[30,25]], 1); rect(g,'#bc7941',23,23,2,1); }
    }
  }
  if (phase === 'dusk' || phase === 'dying') for (let i=0;i<3;i++) rect(g,i%2?'#847c5e':'#606b56',5+i*9,22-i*6,3,1);
}
function drawDecor(g: Brush, kind: GroveDecor, phase: AtmospherePhase, v: number) {
  const p = palettes[phase], dead = phase === 'dying', burnt = phase === 'burning', alive = !dead && !burnt;
  // Every frame uses the same root (32,54), including leafless and charred frames.
  poly(g,p.edge,[[9,52],[18,47],[43,47],[55,53],[46,58],[18,58]]);
  if (kind === 'tree') {
    poly(g,p.edge,[[22,55],[27,48],[28,25],[25,16],[30,19],[34,34],[36,49],[45,56],[33,54],[27,57]]);
    poly(g,p.bark,[[27,52],[30,40],[29,25],[32,32],[34,49],[38,53],[32,51]]);
    rect(g,alive?'#a08a61':burnt?'#747166':'#b0a28a',30,36,1,13);
    branch(g,p.edge,[[31,36],[20,29],[18,17],[12,13]],3);
    branch(g,p.bark,[[30,35],[21,28],[20,20]],1);
    branch(g,p.edge,[[32,32],[41,24],[44,12],[50,8]],3);
    branch(g,p.bark,[[33,31],[40,24],[43,15]],1);
    branch(g,p.edge,[[30,27],[33,17],[29,7],[33,3]],2);
    if (alive) {
      // Faceted broad crowns; dusk gets denser hanging foliage and deep cutouts.
      for (const [i,[cx,cy,r]] of [[18,23,13],[39,23,15],[28,12,13],[16,34,11],[41,36,12],[30,30,15]].entries()) {
        const dx = v-1;
        poly(g,p.shade,[[cx-r+dx,cy-3],[cx-r+4+dx,cy-r+2],[cx+5+dx,cy-r],[cx+r+dx,cy-4],[cx+r-2+dx,cy+7],[cx+dx,cy+11],[cx-r+dx,cy+5]]);
        poly(g,p.leaf,[[cx-r+2+dx,cy-4],[cx-4+dx,cy-r+3],[cx+4+dx,cy-r+2],[cx+r-3+dx,cy-3],[cx+4+dx,cy+3],[cx-7+dx,cy+2]]);
        rect(g,p.grass,cx-5+dx,cy-r+4,7,2); rect(g,p.light,cx-3+dx,cy-r+4,3,1);
        rect(g,p.edge,cx+4,cy+4,4,2);
        if (phase==='dusk' && i%2===0) { rect(g,p.shade,cx+2,cy+8,3,6); rect(g,p.leaf,cx+1,cy+8,1,3); }
      }
    } else {
      branch(g,p.bark,[[21,29],[11,24],[7,17]],2); branch(g,p.edge,[[40,26],[49,23],[53,16]],2);
      branch(g,p.bark,[[32,21],[39,15],[37,8]],1);
      if (dead) { for(const [x,y] of [[15,20],[42,14],[24,31],[37,24]]) { rect(g,p.shade,x,y,7,4); rect(g,p.leaf,x+1,y,4,2); } }
      else {
        rect(g,'#9a5d3b',29,43,1,7); rect(g,'#ba7944',29,45,1,2);
        rect(g,'#79766a',15,56,5,1); rect(g,'#6a6b61',39,57,7,1);
        if(v!==1) flame(g,v?44:19,v?22:29,v);
      }
      branch(g,p.bark,[[27,52],[20,54],[16,57]],1);
    }
  } else if (kind === 'bush') {
    for (let i=0;i<5;i++) {
      const x=16+i*7,y=39+(i%2)*5;
      if(alive){poly(g,p.shade,[[x-5,y+12],[x-7,y+3],[x-3,y-4],[x+3,y-6],[x+7,y+2],[x+5,y+13]]);rect(g,p.leaf,x-4,y-2,8,7);rect(g,p.grass,x-2,y-3,5,2);}
      else {branch(g,p.bark,[[x,54],[x-1,y],[x-5,y-5]],2);branch(g,p.grass,[[x-1,y+6],[x+5,y]],1);if(dead)rect(g,p.leaf,x-6,y-1,4,2);}
    }
    if(burnt&&v===0)flame(g,38,51,0);
  } else if (kind === 'grass' || kind === 'roots') {
    for (let i=0;i<9;i++) {const x=15+i*4,top=kind==='roots'||burnt?48:34+(i*7+v)%13;branch(g,i%2?p.grass:p.shade,[[x,54],[x-2,top+5],[x+(dead?4:-3),top]],1);if(alive&&kind==='grass')rect(g,p.light,x-3,top,1,3);}
    if(dead||burnt||kind==='roots')branch(g,p.bark,[[13,54],[23,50],[31,53],[40,49],[51,52]],2);
  } else if (kind === 'rock') {
    poly(g,p.rock,[[12,47],[20,35],[37,33],[49,44],[45,53],[25,55]]);
    poly(g,burnt?'#7d8176':dead?'#a09f8c':alive&&phase==='normal'?'#a4a18b':'#8a9390',[[12,47],[20,35],[37,33],[31,41]]);
    poly(g,p.shade,[[31,41],[49,44],[45,53],[25,55]]);
    branch(g,p.edge,[[37,35],[32,43],[35,49]],1);
    if(alive){rect(g,p.leaf,19,49,7,3);rect(g,p.grass,22,51,5,2);}else{rect(g,p.grass,14,55,6,1);rect(g,p.rock,46,57,4,2);if(burnt)rect(g,'#89573d',33,43,1,4);}
  } else if (kind === 'mushroom') {
    for(let i=0;i<3;i++){const x=21+i*9,y=44+i%2*6;rect(g,burnt?p.bark:'#9a967c',x,y,2,10-i);poly(g,burnt?p.shade:dead?'#79776e':phase==='dusk'?'#877e8f':'#aa9270',[[x-5,y],[x-4,y-4],[x+1,y-6],[x+5,y-3],[x+6,y]]);if(alive)rect(g,'#bcb49b',x-2,y-4,2,1);if(dead)rect(g,p.edge,x+3,y-3,3,2);}
    if(burnt)rect(g,'#7b7a6d',17,56,28,1);
  } else {
    poly(g,p.edge,[[19,53],[22,38],[40,37],[44,54]]);rect(g,p.bark,24,39,15,13);rect(g,p.grass,25,38,13,3);rect(g,p.edge,28,42,2,10);rect(g,p.edge,35,41,1,8);
    if(alive)rect(g,p.leaf,18,51,10,3);if(burnt){rect(g,'#ae6d3b',31,42,1,7);if(v===2)flame(g,34,42,0);}
  }
}

// Coordinate-only cosmetic layout, independent of phase, traversal and gameplay RNG.
export function groveDecoration(wx: number, wy: number) {
  const {hash,dirt} = biomeTile(wx,wy,'grove');
  if(dirt)return null;
  const kind: GroveDecor | undefined = hash%41===0?'tree':hash%29===0?'rock':hash%23===0?'bush':hash%31===0?'mushroom':hash%37===0?'stump':hash%13===0?'grass':hash%43===0?'roots':undefined;
  return kind ? { id: `${wx}:${wy}:${kind}`, kind, variant: (hash>>>16)%3, x: wx*32+16, y: wy*32+28 } : null;
}
export function createGroveArtAtlas() {
  const canvas=document.createElement('canvas');canvas.width=GROVE_ART_BUDGET.atlasWidth;canvas.height=GROVE_ART_BUDGET.atlasHeight;
  const g=canvas.getContext('2d')!;g.imageSmoothingEnabled=false;
  for(const [index,phase]of GROVE_ART_PHASES.entries()) {
    const row=index*224;
    for(let dirt=0;dirt<2;dirt++)for(let v=0;v<4;v++){g.save();g.translate((dirt*4+v)*32,row);drawGround(g,phase,v,!!dirt);g.restore();}
    for(const [i,kind]of GROVE_DECOR.entries())for(let v=0;v<3;v++){g.save();g.translate(i*64,row+32+v*64);drawDecor(g,kind,phase,v);g.restore();}
  }
  return canvas;
}
export function paintGroveRegion(atlas: HTMLCanvasElement, phase: AtmospherePhase, tileX: number, tileY: number, tilesWide=8, tilesHigh=8) {
  const canvas=document.createElement('canvas');canvas.width=tilesWide*32;canvas.height=tilesHigh*32;
  const g=canvas.getContext('2d')!;g.imageSmoothingEnabled=false;
  const row=GROVE_ART_PHASES.indexOf(phase)*224;
  for(let x=0;x<tilesWide;x++)for(let y=0;y<tilesHigh;y++){
    const {hash,dirt}=biomeTile(tileX+x,tileY+y,'grove');g.drawImage(atlas,((dirt?4:0)+hash%4)*32,row,32,32,x*32,y*32,32,32);
  }
  // Include crossing crowns from adjacent tiles. World-space order makes seams identical.
  for(let y=-1;y<=tilesHigh+1;y++)for(let x=-1;x<=tilesWide+1;x++){
    const d=groveDecoration(tileX+x,tileY+y);if(!d)continue;
    g.drawImage(atlas,GROVE_DECOR.indexOf(d.kind)*64,row+32+d.variant*64,64,64,d.x-tileX*32-32,d.y-tileY*32-54,64,64);
  }
  return canvas;
}
