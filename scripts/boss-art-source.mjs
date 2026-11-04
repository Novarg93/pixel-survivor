/* global document, Path2D */
// Original Thorn Ram: layered bark, ivory antlers, split amber mask, root gauntlets.
export function drawBossAtlas(layout) {
  const atlas = document.createElement('canvas'); atlas.width = layout.width; atlas.height = layout.height; const target = atlas.getContext('2d');
  for (const e of layout.frames) {
    const c = document.createElement('canvas'); c.width = e.frame.w; c.height = e.frame.h;
    const g = c.getContext('2d', { willReadFrequently: true }); g.scale(4, 4);
    const shape = (p, color, stroke = '#2b2939', width = .4) => { const s = new Path2D(p); g.fillStyle = color; g.fill(s); if (width) { g.strokeStyle = stroke; g.lineWidth = width; g.lineJoin = 'round'; g.stroke(s); } };
    const line = (p, color, width = .25) => { g.strokeStyle = color; g.lineWidth = width; g.stroke(new Path2D(p)); };
    const left = e.facing === 'left';
    if (e.kind === 'hostile') {
      shape(`M4 ${.6 + e.index * .12} L6.8 3 L7.3 4 L5.3 6.7 L4 7.4 L1.2 5.1 L.7 4 L2.7 1.3Z`, '#a84970', '#4c304c', .25);
      shape(`M4 1.4 L6.2 4 L4 ${6.6 - e.index * .12} L1.8 4Z`, '#ff82a7', '#d3608c', .15);
      shape('M4 2.5 L5.2 4 L4 5.4 L2.8 4Z', '#ffe0c4', '#ffc3ba', .1);
    } else {
      if (left) { g.translate(32, 0); g.scale(-1, 1); }
      const grad = colors => { const a = g.createLinearGradient(left ? 29 : 3, 3, left ? 3 : 29, 30); colors.forEach((v, i) => a.addColorStop(i / (colors.length - 1), v)); return a; };
      const f = e.index, walk = e.pose === 'walk', dying = e.pose === 'death', attack = e.pose === 'attack';
      const swing = walk || attack ? Math.sin(f * Math.PI / 2) : 0, lift = walk || attack ? Math.cos(f * Math.PI / 2) : 0;
      const bob = walk ? [0, -.65, .6, -.2][f] : e.pose === 'idle' ? [0, -.18, .15][f] : 0;
      if (dying) { g.translate(16, 29.3); g.scale(1, [.98, .85, .65, .45, .25, .12][f]); g.translate(-16, -29.3); }
      if (e.pose === 'hurt') g.translate([-.7, -.3, .15][f], 0);
      if (e.pose === 'windup') g.translate(0, .5 + f * .4);
      if (attack) g.translate(f % 2 ? .4 : -.2, -.15);
      if (e.pose === 'recover') g.translate(0, .8 - f * .25);
      const bark = grad(['#d4ac83', '#a07768', '#6c5059', '#3c3448']), bone = grad(['#fff0bd', '#dac39c', '#a38c7e', '#68596b']);
      if (e.kind === 'charger') {
        const slam = e.pose === 'slam', crouch = slam ? [-.1, -.6, -1, 1.1, .6, .2][f] : 0;
        g.translate(0, crouch);
        if (attack) { g.translate(16, 25); g.transform(1, 0, .12, .94, 0, 0); g.translate(-16, -25); }
        const armRaise = slam ? [0, 2.5, 5, -1.3, -.8, 0][f] : e.pose === 'windup' ? 3 + f * 3 : e.pose === 'recover' ? -1.3 + f * .65 : walk ? swing * .7 : 0;
        shape(`M10.2 21 L14.6 21.5 L${14.4 + swing * 1.2} ${28.8 - Math.max(0, lift)} L${8.4 + swing * 1.2} ${29 - Math.max(0, lift)} L8.8 26Z`, '#5b4555');
        shape(`M18.2 20.9 L22.6 20.2 L${24 - swing * 1.2} ${28.7 - Math.max(0, -lift)} L${17.6 - swing * 1.2} ${29 - Math.max(0, -lift)} L17.6 26Z`, bark);
        line(`M${9.4 + swing * 1.2} ${28 - Math.max(0, lift)} l3.8 -.1 M${18.6 - swing * 1.2} ${28 - Math.max(0, -lift)} l4.5 -.2`, '#e0c19b', .35);
        g.translate(0, bob);
        shape('M8.4 11 L14 8.3 L21.7 9.7 L25 15.1 L23.2 22.1 L17.5 25.1 L9.2 22.3 L6.7 16.8Z', bark);
        g.save(); g.translate(0, -armRaise);
        shape('M5.1 12 L10.1 10.5 L12.3 14.7 L9.7 18.2 L4.1 17.7 L2.5 15.4Z', '#745c64');
        shape('M4.6 16.8 L9.4 17.7 L10.5 22.5 L7.4 25.3 L3 23.5 L2.8 20.2Z', bark);
        shape('M21.6 11 L26 12.1 L28 17 L25.6 19.8 L21.1 17.1 L19.5 13.8Z', bark);
        shape('M23.5 17 L28 17.2 L29.2 22.2 L26.8 25 L22.5 23.1 L21.2 20Z', '#8b6b68');
        g.restore();
        // Long branched antlers form the boss's unmistakable top silhouette.
        g.save();
        const lean = e.pose === 'windup' ? .11 + f * .03 : attack ? .17 : 0;
        g.translate(17 + (attack ? .4 : 0), 12 + (attack ? .6 : 0)); g.rotate(lean); g.translate(-17, -12);
        shape('M12.4 9.1 L8.3 7 L5.7 2.3 L5.4 6.9 L7.3 10.6 L12.1 12Z', bone);
        shape('M8 7.9 L3.3 6.2 L4.7 9.5 L9.5 11Z', '#cab18e');
        shape('M20.9 9.4 L23.5 6.8 L25.7 2.7 L26.2 6.6 L24.1 11.1 L21.1 12Z', bone);
        shape('M24.7 7.4 L28.8 5.5 L27 9.6 L23.1 11Z', '#b5a08e');
        shape('M12.7 6.4 L17.5 5.1 L21.7 7.2 L23 12.1 L20 15 L14.1 14.4 L11.6 10.2Z', bone);
        shape('M14.1 8.9 L20.5 8.6 L21.1 10.5 L18.5 12.2 L14.4 11.9Z', '#3a3446');
        line('M15 10.1 L16.6 10.2 M18.6 10 L20 9.9', attack ? '#fff0b1' : '#e8b785', .5);
        shape('M16.5 11.8 L19.1 11.4 L19.8 14.3 L17.5 15.5 L16 14.2Z', '#9a7a70');
        line('M17.4 5.6 L17.1 8 M12.9 7.1 L14.5 8 M20.7 7.6 L20.3 8.4', '#8a776f', .35);
        g.restore();
        shape('M12.2 15.4 L17.7 14.6 L22 16.6 L20 22.1 L15 23 L10.5 20Z', '#735963');
        line('M12.4 16.1 L15.9 17.2 L20.6 16.9 M11.8 18.4 L15 19.4 L19.7 19 M14.7 20 L16.5 22', '#c49b7b', .35);
        line('M16.2 15.7 L15.8 18 L17.1 19.7 L16.7 21.7', '#f2c783', .5);
        for (const x of [5.3, 7, 23.8, 25.6]) line(`M${x} 19.4 l.8 2.1 l-.5 1.5`, '#dac29e', .28);
        shape('M7 11.7 L6.2 9.1 L9.1 11.3 L10.4 12.2Z', '#839077');
        shape('M22.1 12.3 L24.5 10.3 L24 13.9Z', '#7d876e');
      } else if (e.kind === 'sorcerer') {
        g.translate(0, bob);
        const cloth = grad(['#c2b2c5', '#98829f', '#665370', '#353648']);
        const trim = grad(['#ffdfba', '#c2a287', '#806b7d']);
        const raise = e.pose === 'windup' ? 2 + f * 2 : attack ? [4, 1, .3, 0][f] : 0;
        const drift = swing * .65;
        shape(`M12 12 L20.4 12 L22 19 L${25 + drift} ${28.5 - Math.max(0, -lift) * 1.1} L20.4 29.5 L17.4 28.7 L14.5 29.6 L9.7 28.4 L6.8 ${29 - Math.max(0, lift) * 1.1} L9.8 20Z`, cloth);
        shape('M12 13 L9 12.5 L7.2 17.3 L9.3 21 L12.5 20Z', '#574b68');
        shape(`M9.3 12.9 L6.7 ${14.7 - raise} L4.4 ${14.4 - raise} L3.3 ${16 - raise} L5.1 ${18.2 - raise} L9.5 17.8 L12 15Z`, cloth);
        shape(`M20.8 13 L24.3 ${14.3 - raise} L27 ${13.5 - raise} L28 ${15.4 - raise} L26 ${17.9 - raise} L22.2 18.1 L19.5 15.7Z`, cloth);
        line(`M4.8 ${15.6 - raise} L6 ${16.6 - raise} L9.1 16.1 M22.1 16.1 L25.5 ${16 - raise} L26.8 ${14.7 - raise}`, '#ddbbba', .35);
        shape('M11.5 7 L14 3.6 L18.4 3.4 L21.6 8.8 L20.8 14.5 L17 16.7 L11.4 13.5 L9.9 10.6Z', cloth);
        shape('M13 7.3 L17.2 5.5 L19.7 8.3 L19.8 11.7 L16.9 14.4 L13 12.5 L11.9 10.1Z', '#2c2c42');
        shape('M13.8 8 L17.1 6.8 L19 8.7 L18.6 11.3 L16.6 12.9 L13.8 11.6Z', trim);
        line('M14.1 9.1 L15.2 9.4 M17.2 9.2 L18.4 8.9', '#45364f', .5);
        line('M14.8 9.5 L15.4 9.5 M17 9.4 L17.7 9.4', attack ? '#fff0e2' : '#efb6dd', .35);
        shape('M16.3 10.1 L17.1 10.8 L16.5 11.8 L15.8 11.1Z', '#6b516b');
        // Forked rune crest, unlike Mage's soft pointed hat or Guardian's halo.
        shape('M12 6 L10.7 2.3 L13.2 3.5 L14.8 1.3 L16 4 L18 1.5 L20.5 3.1 L20.7 5.5 L17.9 4.9 L15.9 6.3Z', trim);
        line('M11.8 3.6 L13.3 4.6 M15 2.9 L15.8 4.6 M18.2 2.6 L19.1 3.7', '#fff0cc', .3);
        shape('M12.5 14 L16.9 16.1 L20.1 14.4 L20.7 18 L17.2 20 L12.2 17.6Z', trim);
        shape('M14.1 17.6 L17.1 19 L19 18.2 L19.8 26.9 L17.9 28 L15.2 27.1Z', '#a08892');
        line('M13.6 20 L12.2 27.7 M20.6 20.1 L22.9 27.9 M9.4 27.8 L12.6 28.3 M18.3 28.5 L22.7 28.1', '#c9adbc', .3);
        for (let i = 0; i < 3; i++) { const y = 20.6 + i * 2.1; line(`M16 ${y} l1.2 -.7 l.8 .9 l-1.1 1`, '#ffe2b4', .3); }
        // Suspended runestones follow cast posture but never become independent FX objects.
        for (const side of [-1, 1]) {
          const x = side < 0 ? 4.5 : 27, y = 11.5 - raise;
          shape(`M${x} ${y - 2.2} L${x + 1.7} ${y - .7} L${x + 1.3} ${y + 1.4} L${x - .5} ${y + 2} L${x - 1.5} ${y + .3} L${x - 1.2} ${y - 1.3}Z`, '#645071');
          line(`M${x - .4} ${y - 1} L${x + .7} ${y} L${x - .3} ${y + .9}`, raise ? '#ffe1f1' : '#c9a5d1', .35);
        }
      } else if (e.kind === 'eclipse') {
        g.translate(0, bob);
        const second = e.stage === 2, glow = second ? '#e2c4ff' : '#b5f1df';
        const ice = grad(second ? ['#e6d5f1', '#b4a1c8', '#727492', '#384455'] : ['#d8eee1', '#9bc5c2', '#5b8d99', '#304a61']);
        const dark = grad(['#708994', '#456073', '#293f55']);
        const raise = e.pose === 'windup' ? 1.5 + f * 2 : attack ? [3.8, 1, .4, 0][f] : 0;
        // A hollow moon cage: broad crescents frame the face without a solid halo disk.
        shape('M10.7 13 L6.5 10 L4.4 5 L5.6 1.7 L6.8 5.6 L9.2 8.2 L12 8.8Z', ice);
        shape('M21.4 12.4 L25.5 9.2 L27.5 4.7 L26.5 1.9 L25.3 5.7 L22.7 8.3 L20.1 8.7Z', ice);
        line('M5.9 3.8 L6.9 6.5 L9.6 9.1 M26.1 3.8 L25 7 L22 9.6', glow, .3);
        if (second) { shape('M7.7 13 L3.3 10.8 L2 7.1 L5.2 9.4 L8.5 9.9Z', ice); shape('M23.3 12.6 L28.8 9.3 L30 6.5 L27.5 9.3 L23 9.8Z', ice); }
        shape(`M11.7 19.1 L20.8 19 L23.2 24.3 L${24.2 + swing * .6} ${29.1 - Math.max(0, -lift) * .9} L18.1 28.2 L15.7 29.4 L12.3 28.4 L${8.5 - swing * .6} ${29 - Math.max(0, lift) * .9} L10 24.1Z`, dark);
        line('M11.8 24 L10.2 28.2 M16.4 23.6 L15.9 28.3 M20.5 23.8 L22.5 28.2', '#adc8ce', .3);
        shape('M10 12 L14.8 10.3 L21.6 11.8 L24.2 16 L21.2 22.1 L16.6 24 L11 21.6 L8.7 16.1Z', ice);
        shape(`M9.8 13.4 L6.6 ${15 - raise} L4.3 ${18.3 - raise} L6 ${21.5 - raise} L8.3 ${19.7 - raise} L11.2 16.4Z`, dark);
        shape(`M21.8 13 L25.4 ${15 - raise} L27.8 ${18.3 - raise} L26.2 ${21.2 - raise} L23.8 ${19.6 - raise} L20.6 16.3Z`, ice);
        shape('M12.2 5.1 L16.7 3.8 L20.8 6.2 L21.3 10.7 L18.1 13.5 L13.5 12.7 L11.2 9.1Z', ice);
        shape('M13 6.7 L17 5.5 L19.4 7.1 L19.3 10 L16.7 11.9 L13.1 10.4Z', '#253a4d');
        line('M13.8 8.1 L15 8.2 M17.6 8 L18.6 7.9', glow, .45);
        line('M16.1 6.2 L15.6 7.1 L16.2 8.8 L15.9 10.7', '#709aa7', .25);
        // The chest is an aperture, not a flat XP-like jewel.
        shape('M13.1 14.3 L16.8 12.9 L20.4 14.9 L21 18.1 L18.8 21.4 L15.3 22 L12 19.4 L11.7 16.5Z', dark);
        line('M13.3 15.3 L16.8 13.9 L19.3 15.3 L19.8 17.8 L18.2 20.3 L15.7 20.9 L13.2 18.9 L12.8 16.5Z', glow, .5);
        shape(`M15.4 ${16.3 + lift * .3} L17.2 ${15.8 + lift * .3} L18 ${17.5 + lift * .3} L16.6 ${18.8 + lift * .3} L15 ${18.1 + lift * .3}Z`, '#304658');
        line(`M15.7 ${16.7 + lift * .3} L17.2 ${16.4 + lift * .3} L17.5 ${17.4 + lift * .3}`, second ? '#f2defb' : '#c9fff1', .3);
        for (let i = 0; i < (second ? 5 : 3); i++) { const x = 11 + i * (second ? 2.5 : 5); line(`M${x} 13 L${x + .7} 14.2`, glow, .3); }
        if (dying) {
          // Baked crystal splinters keep a distinct death silhouette; no new entities.
          g.save(); g.setTransform(4, 0, 0, 4, 0, 0); if (left) { g.translate(32, 0); g.scale(-1, 1); }
          for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 + .2, r = 4 + f * 1.1, x = 16 + Math.cos(a) * r, y = 15 + Math.sin(a) * r * .7 - f * .35, s = 1.1 - f * .08; shape(`M${x - s} ${y} L${x} ${y - s * 1.8} L${x + s} ${y + .4}Z`, glow, '#54828f', .15); }
          g.restore();
        }
      }
    }
    const data = g.getImageData(0, 0, c.width, c.height);
    for (let i = 0; i < data.data.length; i += 4) { data.data[i + 3] = data.data[i + 3] < 128 ? 0 : 255; if (data.data[i + 3]) for (let k = 0; k < 3; k++) data.data[i + k] = Math.min(255, Math.round(data.data[i + k] / 8) * 8); }
    g.putImageData(data, 0, 0); target.drawImage(c, e.frame.x, e.frame.y);
  }
  return atlas.toDataURL('image/png');
}
