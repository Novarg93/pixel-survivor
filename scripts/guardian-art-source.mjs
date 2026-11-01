/* global document, Path2D */
// Original Sun Seal Sentinel, a stationary limestone reliquary, not a loot chest.
export function drawGuardianAtlas(layout) {
  const atlas = document.createElement('canvas'); atlas.width = layout.width; atlas.height = layout.height; const target = atlas.getContext('2d');
  for (const e of layout.frames) {
    const c = document.createElement('canvas'); c.width = 96; c.height = 112; const g = c.getContext('2d', { willReadFrequently: true }); g.scale(4, 4);
    const shape = (path, color, stroke = '#29333e', width = .3) => { const p = new Path2D(path); g.fillStyle = color; g.fill(p); if (width) { g.strokeStyle = stroke; g.lineWidth = width; g.lineJoin = 'round'; g.stroke(p); } };
    const line = (path, color, width = .2) => { g.strokeStyle = color; g.lineWidth = width; g.stroke(new Path2D(path)); };
    const grad = colors => { const p = g.createLinearGradient(3, 3, 21, 25); colors.forEach((c, i) => p.addColorStop(i / (colors.length - 1), c)); return p; };
    if (e.pose === 'death') { g.translate(12, 25.5); g.scale(1, [.98, .9, .74, .57, .4, .24][e.index]); g.translate(-12, -25.5); }
    if (e.pose === 'hurt') g.translate([-.4, -.15, .1][e.index], 0);
    const stone = grad(['#d9d7bf', '#9aaba7', '#657983', '#374654']), gold = grad(['#ffe3a5', '#d3ab69', '#93694e', '#55434b']);
    // A broad stone halo, distinct from elite crown prongs.
    for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6, x = 12 + Math.cos(a) * 5.3, y = 7 + Math.sin(a) * 5.3; shape(`M${x - .45} ${y - .6} L${x + .5} ${y - .4} L${x + .4} ${y + .8} L${x - .5} ${y + .5}Z`, i < 7 ? gold : '#766555'); }
    shape('M8.2 4.1 L12 2.5 L16.3 4.2 L17 8.2 L14.8 11.6 L9 11.6 L6.8 8Z', gold);
    shape('M8.7 4.8 L12 3.6 L15.3 4.9 L15.8 8 L14 10.4 L9.7 10.3 L8 7.8Z', stone);
    shape('M9.5 6.3 L14.5 6.1 L14.4 7.8 L9.6 8Z', '#293e4b');
    line('M10.1 7 L11 7 M13 6.9 L13.9 6.9', '#ffe3a4', .4);
    shape('M10 8.5 L14 8.4 L13.6 10.5 L10.6 10.5Z', '#6d8188');
    // Wide braced arms and a broken plinth communicate immobility.
    shape('M5.6 10.6 L8.8 11.4 L8.2 15 L5.6 16.6 L2.9 15.9 L2 12.9Z', stone);
    shape('M15.1 11.3 L18.3 10.4 L21.7 12.7 L21.1 16 L18.4 16.7 L15.8 15Z', stone);
    shape('M2.9 16.2 L6.1 16.9 L7 19.8 L4.8 21 L2.5 19.5Z', gold);
    shape('M18.2 16.8 L21 16 L21.6 19.4 L19.1 21 L17.4 19.6Z', gold);
    shape('M8.5 11.1 L15 11.1 L17 15.5 L15.4 21.2 L13.7 24.5 L10 24.5 L8.3 21.1 L7 15.4Z', stone);
    shape('M6 23.8 L10 23.1 L13.7 23.5 L17.7 23 L19.2 26.6 L4.8 26.6Z', stone);
    line('M5.7 25.4 L9.3 25.1 M12.7 25.1 L18 25.5 M7.3 12 L6.3 14 L3.1 13.3 M17 12 L18.2 13.8 L20.5 13.1', '#e1dfc5', .3);
    line('M9.8 20 L10.4 21.2 L9.9 23.3 M14.5 20.7 L13.5 22.4 L14 23.8 M7.3 24.5 L8 25.1 L7.8 26.2', '#354b59', .3);
    // Large inset sun seal; the readable signature sits on the chest, not the head.
    shape('M9.1 12.8 L12 11.8 L15 12.8 L16 15.6 L14.6 18.9 L11.8 19.9 L8.8 18.3 L7.9 15.4Z', gold);
    shape('M9.8 13.8 L12 13 L14.1 13.9 L14.7 15.7 L13.8 18 L11.8 18.8 L9.7 17.7 L9 15.5Z', '#4b5964');
    const t = e.pose === 'idle' ? e.index : 0, color = ['#ffe1a0', '#fff1c0', '#e8c58b'][t];
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 + t * .12, x = 12 + Math.cos(a) * 1.7, y = 15.8 + Math.sin(a) * 1.7; line(`M12 15.8 L${x} ${y}`, color, .3); }
    shape('M11.3 15.4 L12 14.8 L12.8 15.5 L12 16.7 L11.2 16.1Z', color);
    line('M4.1 17.2 L5 18.1 L4.5 19 M19 17.4 L20 18 L19.5 19', '#fff0bb', .3);
    const data = g.getImageData(0, 0, 96, 112);
    for (let i = 0; i < data.data.length; i += 4) { data.data[i + 3] = data.data[i + 3] < 128 ? 0 : 255; if (data.data[i + 3]) for (let k = 0; k < 3; k++) data.data[i + k] = Math.min(255, Math.round(data.data[i + k] / 8) * 8); }
    g.putImageData(data, 0, 0); target.drawImage(c, e.frame.x, e.frame.y);
  }
  return atlas.toDataURL('image/png');
}
