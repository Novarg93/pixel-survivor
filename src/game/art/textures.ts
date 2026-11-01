import Phaser from 'phaser';
const PALETTE: Record<string, number> = { o: 0x142a30, h: 0x3d5b7f, H: 0x799bd0, c: 0x416e77, C: 0x7ca8a6, f: 0xf4cfa0, s: 0xbf9975, b: 0xe2c98b, w: 0x98795c, g: 0x8bdbc5, G: 0xe5ffe2, a: 0x567f57, A: 0x9ebd7a, l: 0xc4d998, r: 0xb97b57, R: 0xe7b778, t: 0x536d74, T: 0x94aeb0, p: 0x68547c, P: 0xb49ace, X: 0xf2e5ba };
const MAGE = ['.........HH.....','........HHH.....','.......HHhH.....','......HHhhHH....','.....HHhhhhHH...','....HHHHHHHHHH..','...oooooooooooo.','.....offffo..g..','.....ofsffo.gGg.','.....offffo..g..','....ooCCCCoo.w..','...oCoCccCoCow..','...oCocccCoCow..','....oocccCo..w..','.....obbbbo..w..','.....oCccCo..w..','....oCCccCCo.w..','....oooooooo.w..','.....oo..oo.....','.....oo..oo.....'];
const CREATURES: Record<string, string[]> = {
 grunt: ['....aa....aa....','...aAAa..aAAa...','...aAlAAAAAaa...','....aAAAAAAa....','...aAAAAlAAAa...','..aAAoAAoAAAAa..','..aAAXAAXAAAAa..','...aAAAAAAAaa...','....aaaAaaa.....','...aoaAAAaoa....','..aAoaAAAaoAa...','..aa.aAAAa.aa...','.....aaaaa......','....aa...aa.....','...aAa...aAa....','...ooo...ooo....'],
 runner: ['..rRr.......rRr.','.rRRRr.....rRRr.','..rRRRrrrrrRRr..','...rRRRRRRRRr...','..rRRoRRRoRRRr..','..rRRXRRRXRRRr..','...rRRRRRRRRr...','....rrRRRRrr....','...rRRRRRRRRr...','..rRrrRRRRrrRr..','.rRr..rRRr..rRr.','..rr..rRRr...rr.','.....rrrrrr.....','....rRr..rRr....','...rRr....rRr...','...oo......oo...'],
 tank: ['....tttttttt....','...tTTTTTTTTt...','..tTTTtTTtTTTt..','..tTTToTToTTTt..','..tTTTXTTXTTTt..','...tTTTTTTTTt...','.ttttTTTTTTtttt.','tTTTtTTTTTTtTTTt','tTTTtTbTTbTtTTTt','tTTTtTTTTTTtTTTt','tTTttTTTTTTttTTt','.tt.tTTTTTTt.tt.','....ttTTTTtt....','...tTTt..tTTt...','...tTTt..tTTt...','...oooo..oooo...'],
 caster: ['.......PP.......','......PPpP......','.....PPpppP.....','....PPppppPP....','...PPPPPPPPPP...','..oooooooooooo..','....oppppppo..P.','....opXppXpo.PXP','....oppppppo..P.','...oPPppppPPo.w.','..oPpPppppPpPow.','...ooPppppPoo.w.','....oPPbbPPo..w.','...oPPppppPPo.w.','..oPPPppppPPPow.','..oooooooooooo..'],
 charger: ['.bb..........bb.','bRrb........brRb','bRRrb......brRRb','.bRRrbbbbbbrrRb.','..bRRRRRRRRRRb..','.rRRRoRRRoRRRRr.','.rRRRXRRRXRRRRr.','..rRRRRRRRRRRr..','.rrrRRbbbbRRrrr.','rRRrrRRRRRRrrRRr','rRRrRRRRRRRRrRRr','rrrrRRRbbRRRrrrr','...rRRRRRRRRr...','..rrRRrrrrRRrr..','..rRRr....rRRr..','..oooo....oooo..'],
 sorcerer: ['......bPPb......','.....bPPPPb.....','....bPPppPPb....','...bPPppppPPb...','..bPPPPPPPPPPb..','.oooooooooooooo.','....oppppppo....','....opXppXpo....','.P..oppppppo..P.','PXPooPPPPPPooPXP','.P.oPppbbppPo.P.','...oPpbPPbpPo...','...oPPpbPPPPo...','..oPPppbpppPPo..','.oPPPppppppPPPo.','.oooooooooooooo.'],
};
import { LOOT_PALETTE, LOOT_PIXELS } from './lootPixels';
export function createTextures(scene: Phaser.Scene, replaced: ReadonlySet<string> = new Set()) {
 const lootGraphics = scene.make.graphics({ x: 0, y: 0 });
 for (const [kind, rows] of Object.entries(LOOT_PIXELS)) if (!scene.textures.exists(`loot-${kind}`)) {
  rows.forEach((row, y) => [...row].forEach((color, x) => { if (LOOT_PALETTE[color] !== undefined) lootGraphics.fillStyle(LOOT_PALETTE[color]).fillRect(x, y, 1, 1); }));
  lootGraphics.generateTexture(`loot-${kind}`, 16, 16); lootGraphics.clear();
 }
 lootGraphics.destroy();
 if (scene.textures.exists('xp')) return;
 CREATURES.rusher = ['..bb........bb..','..bRr......rRb..','...rRRrrrrRRr...','..rRRRRRRRRRRr..','..rRoRRRRoRRRr..','..rRXRRRRXRRRr..','...rRRRRRRRRr...','....rrRRRRrr....','...rRrRRRRrRr...','..rRr.rRRr.rRr..','..rr..rRRr..rr..','.....rRRRRr.....','....rRRrrRRr....','...rRr....rRr...','...ooo....ooo...','................'];
 CREATURES.eclipse = ['...b........b...','..bgGg....gGgb..','.bgGg......gGgb.','bgGg..gggg..gGgb','bgGg.gTTTTg.gGgb','.bgGgTTXXTTgGgb.','..bgTTTXXTTTgb..','...gTTTTTTTTg...','...gTTbbbbTTg...','..gTTbggggbTTg..','..gTTbgGGgbTTg..','...gTTbggbTTg...','....gTTbbTTg....','...gTTTggTTTg...','..gTTgg..ggTTg..','..ooo......ooo..'];
 CREATURES.splitter = ['......gggg......','....ggAAAggg....','...gAAAAAAAAg...','..gAAAggAAAAAg..','..gAAXggXAAAAg..','..gAAAggAAAAAg..','...gAAggAAAAg...','....gggggggg....','..ggAAg.gAAg....','.gAAAAg.gAAAAg..','.gAAAgg.ggAAAg..','..gggg...gggg...','...gg.....gg....','..ggg.....ggg...','..ooo.....ooo...','................'];
 const g = scene.make.graphics({ x: 0, y: 0 });
 const draw = (rows: string[], scale = 1) => { rows.forEach((row, y) => [...row].forEach((color, x) => { if (PALETTE[color] !== undefined) g.fillStyle(PALETTE[color]).fillRect(x * scale, y * scale, scale, scale); })); };
 for (const hero of ['mage', 'warrior']) for (const facing of ['down', 'up', 'side']) for (let frame = 0; frame < 3; frame++) {
  if (replaced.has(hero)) continue;
  const rows = [...MAGE];
  if (facing === 'up') { rows[7] = '.....ohhhho..g..'; rows[8] = '.....ohhhho.gGg.'; rows[9] = '.....occcco..g..'; }
  if (facing === 'side') { rows[7] = '.....ohfffo..g..'; rows[8] = '.....ohfsfo.gGg.'; }
  if (frame === 1) { rows[18] = '....ooo..oo.....'; rows[19] = '....oo..........'; }
  if (frame === 2) { rows[18] = '.....oo..ooo....'; rows[19] = '.........ooo....'; }
  if(hero === 'warrior'){ for(let y=0;y<18;y++)rows[y]=rows[y].replaceAll('H','T').replaceAll('h','t').replaceAll('C','T').replaceAll('c','t').replaceAll('g','b').replaceAll('G','X'); rows[0]='................'; rows[1]='................'; rows[2]='.....tttttt.....'; rows[3]='....tTTTTTTt....'; rows[4]='....tTTTTTTt....'; }
  if(hero === 'warrior'){ rows[7]=facing==='up'?'.....otttto..X..':'.....offffo..X..'; rows[8]=facing==='up'?'.....otttto..X..':'.....ofsffo..X..'; rows[9]='.....otttto..X..';rows[10]='....otTTTTto.X..';rows[11]='...oTtTTTTtTbbb.';rows[12]='...oTtTTTTtT.w..'; }
  draw(rows); g.generateTexture(`${hero}-${facing}-${frame}`, 16, 20); if (hero === 'mage' && facing === 'down' && frame === 0) g.generateTexture('mage', 16, 20); g.clear();
 }
 for (const [name, rows] of Object.entries(CREATURES)) for (let frame = 0; frame < 2; frame++) {
  if (replaced.has(name)) continue;
  const size = name === 'charger' || name === 'sorcerer' || name === 'eclipse' ? 2 : 1, art = [...rows];
  if (frame === 1) { art[14] = art[14].slice(1) + '.'; art[15] = '.' + art[15].slice(0, -1); }
  draw(art, size); if (size === 2) g.fillStyle(name === 'charger' ? 0xe2c98b : 0xf3d2ff).fillRect(11, 11, 2, 2).fillRect(21, 11, 2, 2);
  g.generateTexture(frame === 0 ? name : `${name}-walk`, 16 * size, 16 * size); g.clear();
 }
 if (!replaced.has('fireball')) { g.fillStyle(0xad5b45).fillRect(0, 2, 8, 4); g.fillStyle(0xf3a567).fillRect(2, 1, 6, 6); g.fillStyle(0xffefbd).fillRect(3, 2, 4, 3); g.generateTexture('fireball', 8, 8); g.clear(); }
 g.fillStyle(0x214d59).fillRect(0, 2, 6, 4); g.fillStyle(0x70d9cf).fillRect(1, 1, 4, 4).fillRect(2, 0, 2, 6); g.fillStyle(0xe9ffdb).fillRect(2, 1, 2, 2); g.generateTexture('xp', 6, 6); g.clear();
 if (!replaced.has('hostile')) { g.fillStyle(0x572d58).fillRect(0, 1, 8, 6); g.fillStyle(0xff809a).fillRect(1, 2, 6, 4).fillRect(3, 0, 2, 8); g.fillStyle(0xffe1b6).fillRect(3, 2, 2, 3); g.generateTexture('hostile', 8, 8); } g.destroy();
}
