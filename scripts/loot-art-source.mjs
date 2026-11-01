/* global document, Path2D */
// Original reliquary set, authored on a 32-unit grid with two source pixels per unit.
// Top-left material light, hard alpha; HUD crops are the actual atlas idle0 pixels.
export function drawLootAtlas(layout) {
  const atlas = document.createElement('canvas'); atlas.width = layout.width; atlas.height = layout.height;
  const target = atlas.getContext('2d'), icons = {};
  for (const e of layout.frames) {
    const c = document.createElement('canvas'); c.width = e.frame.w; c.height = e.frame.h;
    const g = c.getContext('2d', { willReadFrequently: true }); g.scale(e.key === 'xp' ? .75 : 2, e.key === 'xp' ? .75 : 2);
    const shape = (p, color, edge = '#202e3d', width = .8) => { const path = new Path2D(p); g.fillStyle = color; g.fill(path); if (width) { g.strokeStyle = edge; g.lineWidth = width; g.lineJoin = 'miter'; g.stroke(path); } };
    const line = (p, color, width = .6) => { g.strokeStyle = color; g.lineWidth = width; g.stroke(new Path2D(p)); };
    const rect = (x, y, w, h, color) => { g.fillStyle = color; g.fillRect(x, y, w, h); };
    const gold = '#d8b476', light = '#fff0c6', steel = '#a4c5cd';
    if (e.key === 'healing') {
      shape('M12 4L20 4L21 7L19 9L19 12L24 17L25 24L22 28L10 28L7 24L8 17L13 12L13 9L11 7Z', '#4e7c90');
      shape('M13 6L18 6L18 13L23 18L23 23L20 26L11 26L9 23L10 18L15 13L15 8Z', '#9dc7cd', '#74a3b6', .4);
      shape('M9 20L23 20L23 24L20 27L12 27L9 24Z', '#bb4261');
      shape('M10 20L15 20L15 26L12 25L10 23Z', '#ff8090', '#d85e7e', .4);
      rect(11, 4, 10, 3, gold); rect(12, 4, 5, 1, light); rect(10, 16, 2, 5, '#e0eee2'); line('M17 21L17 25M15 23L19 23', '#ffb1a5', 1);
    } else if (e.key === 'haste') {
      for (const [x, y] of [[17, 3], [6, 7]]) {
        shape(`M${x} ${y}L${x + 7} ${y}L${x + 7} ${y + 12}L${x + 10} ${y + 16}L${x + 9} ${y + 19}L${x - 3} ${y + 19}L${x - 4} ${y + 15}L${x} ${y + 12}Z`, '#8f644f');
        shape(`M${x} ${y + 2}L${x + 6} ${y + 2}L${x + 6} ${y + 12}L${x + 9} ${y + 16}L${x - 2} ${y + 16}L${x + 2} ${y + 12}Z`, gold, '#bc8f5c', .5);
        line(`M${x + 1} ${y + 5}L${x + 5} ${y + 5}M${x + 1} ${y + 8}L${x + 5} ${y + 8}`, light, 1);
      }
      shape('M4 15L2 7L8 11L5 4L13 10L12 16L8 20Z', '#e8dbc2', '#9da7a1', .6);
    } else if (e.key === 'fury') {
      shape('M25 2L27 3L26 9L15 22L12 19Z', '#a64459');
      shape('M25 3L25 8L14 21L12 19Z', '#ffac90', '#e46b6c', .5);
      shape('M24 4L23 10L14 20L13 18Z', '#ffe2b2', '#f8bd93', .3);
      shape('M9 17L17 23L15 25L7 20Z', gold); shape('M10 21L13 24L7 30L4 27Z', '#725265');
      rect(8, 23, 2, 2, '#ffc789'); shape('M18 11L16 7L20 9L21 5L22 13Z', '#f27f73', '#a74c60', .5);
    } else if (e.key === 'magnet') {
      shape('M5 5L12 5L12 18L14 21L18 21L20 18L20 5L27 5L27 20L23 27L16 29L9 27L5 20Z', '#345870');
      shape('M7 6L11 6L11 19L14 23L19 23L23 19L23 6L26 6L26 20L22 26L16 27L10 25L7 20Z', '#72cce6', '#438eaf', .5);
      rect(6, 5, 6, 5, light); rect(20, 5, 7, 5, steel); line('M3 13L1 15M29 13L31 15M15 9L17 9M16 8L16 11', '#d9f8f0', 1);
    } else if (e.key === 'xp') {
      shape('M15 2L24 9L21 24L14 30L7 23L8 10Z', '#2d5d70', '#182f42', 1.5);
      shape('M15 4L20 11L14 27L10 22L10 11Z', '#9ce6d0', '#549caa', .5);
      shape('M15 4L22 10L19 23L14 27L18 12Z', '#4aafb6', '#397d93', .5);
      shape('M5 15L9 12L10 23L5 25L2 22Z', '#77b9b3', '#244655', .8); rect(13, 9, 2, 6, '#e8ffdb');
    } else if (e.key === 'chest') {
      const lift = e.pose === 'open' ? 2 + e.index * .6 : 0;
      shape('M4 14L28 14L28 27L25 29L6 29L4 26Z', '#6f4f45');
      shape('M5 17L27 17L27 26L24 28L6 28Z', '#a17855', '#4b4245', .5);
      for (const y of [19, 23, 26]) line(`M6 ${y}L26 ${y}`, '#5d4542', .7);
      for (const x of [7, 22]) { rect(x, 16, 3, 11, gold); rect(x, 17, 1, 9, light); }
      if (e.pose === 'open') { shape('M4 13L28 13L27 19L5 19Z', '#252e3e'); shape('M10 14L14 10L18 15L23 12L24 18L8 18Z', '#a6dfc6', '#d1af6d', .6); }
      shape(`M4 ${15 - lift}L4 ${9 - lift}L8 ${5 - lift * .5}L24 ${5 - lift * .5}L28 ${9 - lift}L28 ${15 - lift}Z`, '#8a654d');
      shape(`M6 ${10 - lift}L9 ${7 - lift * .5}L23 ${7 - lift * .5}L26 ${10 - lift}L26 ${13 - lift}L6 ${13 - lift}Z`, '#b38a5c', '#5e4c47', .6);
      line(`M8 ${8 - lift * .5}L24 ${8 - lift * .5}`, '#e8c78a', 1);
      rect(4, 13 - lift, 24, 2, gold); rect(13, 14, 6, 7, '#d8b476'); rect(15, 16, 2, 3, '#344654');
    } else if (e.key === 'artifact-health') {
      shape('M16 27L6 18L5 10L9 6L14 6L16 9L19 6L24 7L27 12L25 19Z', '#b88e56', '#473e45', 1);
      shape('M16 25L8 17L7 11L10 8L14 8L16 12L20 8L24 10L25 14L23 18Z', '#a3b682', '#6d7d69', .6);
      shape('M15 21L10 16L10 11L14 11L16 15L20 11L23 13L20 18Z', '#eac792', '#b18a5c', .6);
      line('M16 16L16 24M9 19L5 23L5 17M22 19L27 22L27 16', '#5c886f', 1.5); rect(11, 10, 3, 2, light);
    } else if (e.key === 'artifact-damage') {
      shape('M16 3L27 10L27 22L16 29L5 22L5 10Z', '#a57b4f', '#473747', 1);
      shape('M16 6L24 11L24 21L16 26L8 21L8 11Z', '#704252', '#e2b377', .8);
      shape('M16 8L19 14L22 13L22 19L17 23L12 21L10 16L14 17Z', '#ed9d74', '#a65c58', .6);
      shape('M16 15L19 20L16 22L14 20Z', light, '#e4ba87', .3); rect(8, 10, 2, 2, light);
    } else if (e.key === 'artifact-speed') {
      shape('M23 3L27 4L26 14L22 22L12 26L6 29L5 27L10 22L10 14L16 6Z', '#8b9d9a', '#3c4d57', 1);
      shape('M23 5L24 10L19 16L12 21L12 14L17 8Z', '#fff0ca', '#b7c5b6', .5);
      shape('M24 11L24 16L20 21L13 24L17 19Z', '#bdc8b6', '#738f94', .5);
      line('M7 27L23 7', gold, 1.5); line('M14 12L16 15M19 7L20 10M17 21L20 21', '#738d97', .6);
    } else if (e.key === 'artifact-cooldown') {
      shape('M7 4L25 4L25 7L23 8L22 13L18 16L22 20L23 25L25 26L25 29L7 29L7 26L9 25L10 20L14 16L10 13L9 8L7 7Z', '#79616b');
      shape('M11 8L21 8L20 13L16 16L12 13Z', '#99c6ca', '#577c99', .5);
      shape('M16 18L21 23L21 25L11 25L11 23Z', '#98baca', '#577c99', .5);
      shape('M12 9L20 9L19 12L16 15L13 12Z', '#e9c589', '#ad8e70', .4); shape('M16 21L20 24L12 24Z', gold, '#ad8e70', .4);
      rect(6, 4, 20, 3, gold); rect(6, 26, 20, 3, gold); rect(8, 4, 12, 1, light); rect(15, 17, 1, 3, light);
    } else if (e.key === 'artifact-experience') {
      shape('M5 21L16 18L27 21L27 28L16 30L5 27Z', '#8e7195', '#3f445b', 1);
      shape('M6 21L16 23L26 21L26 26L16 28L6 25Z', '#dac6a1', '#9a9eac', .5); line('M16 24L16 28M8 23L13 24M19 25L24 24', '#806a81', .6);
      shape('M15 2L23 8L21 19L15 23L9 18L10 7Z', '#66537f', '#c8a66f', .9);
      shape('M15 4L19 9L15 20L11 17L12 8Z', '#bcb5ea', '#8075aa', .5); shape('M15 4L21 8L19 18L15 20L18 9Z', '#8b82b8', '#665d93', .5);
      rect(12, 8, 2, 5, '#e8e3ff');
    }
    // Quiet three-step glint, kept inside each fixed frame; no animation scale wobble.
    const sx = e.key === 'xp' ? 13 + e.index : 12 + e.index * 2, sy = e.key === 'chest' ? 10 - (e.pose === 'open' ? e.index * .3 : 0) : 11 + e.index;
    rect(sx, sy, 1, 2, light);
    const data = g.getImageData(0, 0, c.width, c.height);
    for (let i = 0; i < data.data.length; i += 4) { data.data[i + 3] = data.data[i + 3] < 128 ? 0 : 255; if (data.data[i + 3]) for (let k = 0; k < 3; k++) data.data[i + k] = Math.min(255, Math.round(data.data[i + k] / 8) * 8); }
    g.putImageData(data, 0, 0); target.drawImage(c, e.frame.x, e.frame.y);
    if (e.pose === 'idle' && !e.index) icons[e.key] = c.toDataURL('image/png');
  }
  return { png: atlas.toDataURL('image/png'), icons };
}
