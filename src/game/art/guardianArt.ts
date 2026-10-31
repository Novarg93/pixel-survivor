import type Phaser from 'phaser';
const COLORS: Record<string, number> = { o: 0x23313e, t: 0x53636a, T: 0x91a3a1, g: 0xc4954a, G: 0xffd77c, w: 0xfff0c0, b: 0x81dcd7, B: 0x4084a8 };
// An original immobile stone sentinel with a sun crown and a sealed relic in its chest.
const GUARDIAN = [
  '...........GG...........', '.....G....GwwG....G......', '.....GG...GwwG...GG......', '.....GwG..GGGG..GwG......',
  '......GwGGGGGGGGwG......', '......GooooooooooG......', '......otTTTTTTTTo.......', '......otTTTTTTTTo.......',
  '......otGbTTbGTTo.......', '.......otTTTTTTo........', '.......ottGGttto........', '....ooootTTTTToooo......',
  '...oTtGGoTTTToGGtTo.....', '..oTTtGGoTGGToGGtTTo....', '..oTttGGoGwwGoGGttTo....', '..oTttGGoGbbGoGGttTo....',
  '..oTttoootGGtoootTTo....', '..oTTTo.otTTTo.oTTTo....', '..oooo..otTTTo..oooo....', '........otGGTo..........',
  '.......otTTTTTo.........', '......otTTTTTTTo........', '......ottTToTTto........', '......otTTo.oTTo........',
  '.....otTTTo.oTTTo.......', '.....oooooo.oooooo......', '....oGGGGGGGGGGGGGo.....', '....ooooooooooooooo.....',
];
const RELIC = [
  '................', '.......GG.......', '......GwwG......', '.....GwbwwG.....',
  '....GwbBBwwG....', '...GwbBBBBwwG...', '..GwbBBGGBBwwG..', '..GwwBGwwGBwwG..',
  '...GwwBGGBwwG...', '....GwwBBwwG....', '.....GwwwwG.....', '......GwwG......',
  '.......GG.......', '................', '................', '................',
];
export function createGuardianArt(scene: Phaser.Scene) {
  const g = scene.make.graphics({ x: 0, y: 0 });
  for (const [name, rows, width, height] of [['guardian', GUARDIAN, 24, 28], ['artifact', RELIC, 16, 16]] as const) if (!scene.textures.exists(name)) {
    rows.forEach((row, y) => [...row].forEach((c, x) => { if (COLORS[c] !== undefined) g.fillStyle(COLORS[c]).fillRect(x, y, 1, 1); }));
    g.generateTexture(name, width, height); g.clear();
  }
  g.destroy();
}
