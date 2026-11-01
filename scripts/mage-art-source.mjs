/* global document, Path2D */
// Original Lantern Weaver: indigo felt, ivory scarf, copper lantern staff.
// Shapes are authored independently at 4x; this is not a scaled legacy sprite.
export function drawMageAtlas(layout) {
  const atlas = document.createElement('canvas'); atlas.width = layout.width; atlas.height = layout.height;
  const target = atlas.getContext('2d');
  for (const entry of layout.frames) {
    const c = document.createElement('canvas'); c.width = entry.frame.w; c.height = entry.frame.h;
    const g = c.getContext('2d', { willReadFrequently: true }); g.scale(4, 4);
    const path = (p, fill, stroke = '#202432', width = .3) => { const s = new Path2D(p); g.fillStyle = fill; g.fill(s); if (width) { g.strokeStyle = stroke; g.lineWidth = width; g.lineJoin = 'round'; g.stroke(s); } };
    const line = (p, color, width = .2) => { g.strokeStyle = color; g.lineWidth = width; g.stroke(new Path2D(p)); };
    const grad = colors => { const a = g.createLinearGradient(3, 3, 13, 17); colors.forEach((v, i) => a.addColorStop(i / (colors.length - 1), v)); return a; };
    const { pose, index: f, facing } = entry;
    if (pose === 'fireball') {
      const wave = f % 2 * .35;
      path(`M.6 4 L2 ${2.5 + wave} L3 2.8 L4.8 1 L6.6 2.3 L7.5 4 L6.6 6 L4.9 7 L3 5.8 L1.2 6 L2.3 4.9Z`, '#a84838', '#4b2c39', .2);
      path(`M1.8 4 L4.7 ${1.6 + wave} L6.9 3.5 L6.4 5.2 L4.6 6 L3.8 4.8Z`, '#fba35e', '#df7045', .15);
      path('M3.8 3.2 L5.4 2.8 L6.2 4 L5.2 5.2 L4 4.5Z', '#fff0b8', '#ffd080', .15);
    } else {
      const walk = pose === 'walk', death = pose === 'death', hurt = pose === 'hurt';
      const swing = walk ? Math.sin(f * Math.PI / 3) : 0, stride = walk ? Math.cos(f * Math.PI / 3) : 0, bob = walk ? Math.cos(f * Math.PI * 2 / 3) * .22 : pose === 'idle' ? [0, -.18, .1][f] : 0;
      // Ground contact stays at y=18.5; death folds around the unchanged foot pivot.
      if (death) { g.translate(7.4 - f * .5 - (f > 1 ? 1 : 0), 16.8 - f * .6 - (f > 2 ? .6 : 0)); g.rotate([.05, .2, .48, .8, 1.1, 1.22][f]); g.scale(.9, [1, .9, .8, .65, .58, .5][f]); g.translate(-7.4, -16.8); }
      if (hurt) g.translate([-.5, -.25, 0][f], 0);
      path(`M5.2 15.5 L7.1 15.6 L${7.1 + swing} 18.6 L${4.5 + swing} 18.6 L${4.6 + swing} 17.7Z`, '#4e3542');
      path(`M8.5 15.5 L10.2 15.3 L${10.4 - swing} 18.6 L${7.9 - swing} 18.6 L${8.3 - swing} 17.6Z`, '#765247');
      line(`M${4.8 + swing} 18 L${6.5 + swing} 18 M${8.5 - swing} 18 L${10 - swing} 18`, '#e3bc8b', .25);
      g.translate(0, bob);
      const cloth = grad(['#a6b3b9', '#5c7288', '#3f4b69', '#303347']);
      path('M5.3 9.5 L9.6 9.2 L11.3 12 L10.2 14.3 L11.5 17.1 L8.2 17.6 L5.9 17.3 L3.8 17.5 L5 13.3 L4.5 11Z', cloth);
      path(`M5.1 10 L3.1 ${12.1 - swing * .3} L3.9 14.2 L5.2 13.7 L5.7 11.8Z`, '#627e90');
      path('M8.8 9.5 L10.3 10.1 L12.2 12.3 L13.1 11.6 L13.6 12.6 L12 13.5 L9.8 12.4Z', cloth);
      line('M5.8 13.3 L5 16.8 M7.7 13.2 L7.2 17 M9.1 14 L10 16.8', '#b1b9c1', .2);
      path('M5.4 12.8 L9.7 12.5 L9.9 13.2 L5.3 13.6Z', '#9f744d');
      path('M7.2 12.7 L8.5 12.6 L8.5 13.4 L7.3 13.6Z', '#f4d69e', '#6b4f48', .16);
      // Split ivory collar separates the face from both pale Grove and cold Forest.
      path('M5.2 9 L8.3 9.4 L10.1 9.1 L9.2 10.7 L8.4 11.4 L7.7 10.1 L6 10.7Z', '#d8c6a7');
      if (facing !== 'up') {
        path(facing === 'side' ? 'M6.6 6.1 L9.5 6.1 L10.2 7.2 L9.5 7.6 L9.4 8.7 L7.5 9.4 L6.5 8.3Z' : 'M5.7 6.2 L9.7 6.2 L9.5 8.6 L7.7 9.5 L5.9 8.7Z', grad(['#ffe2ad', '#ce9c7c', '#82625e']));
        line(facing === 'side' ? 'M8.8 7.1 l.6 0' : 'M6.5 7.1 l.55 0 M8.4 7.1 l.55 0', '#252c3c', .36);
        path('M6.4 8.3 L7.8 8.6 L9 8.1 L8.6 9.8 L7.8 10.3Z', '#eee0bb', '#bc9e89', .15);
      } else path('M5.7 6.2 L9.7 6.2 L9.5 9.1 L7.6 9.6 L5.9 8.7Z', '#444359');
      const hat = grad(['#a8b8cd', '#667c9f', '#494766', '#303146']);
      path('M4.7 5.6 L5.7 3.3 L7 1.1 L8.5 1.6 L9.1 3.3 L10.6 5.8Z', hat);
      path('M3.1 5.5 L6.1 5 L9.3 5.1 L11.8 6 L11.4 6.9 L8.5 7.3 L5.8 7 L2.9 6.3Z', hat);
      path('M5.2 4.5 L9.6 4.8 L10 5.5 L5 5.3Z', '#a47c61', '#73514c', .12);
      path('M7 4.5 L7.7 4.2 L8.3 4.8 L7.8 5.4 L7.2 5.2Z', '#ffe0a4', '#b18a61', .12);
      line('M6 3.5 L7.2 1.9 L8.1 2 M3.7 5.8 L6 5.5', '#d3d1d5', .23);
      // Angular lantern, no orb silhouette shared with XP pickups.
      const lantern = pose === 'idle' ? [0, .18, -.1][f] : swing * .22 + stride * .35;
      path(`M12.6 5.6 L13.4 5.8 L13.1 18 L12.6 18Z`, '#815c52');
      line('M12.8 7.5 L12.8 17.5', '#d6a777', .22);
      path(`M12.4 ${4.2 + lantern} L13.1 ${3.6 + lantern} L14 ${4.3 + lantern} L14 ${6.2 + lantern} L13.2 ${7 + lantern} L12.2 ${6.2 + lantern}Z`, '#a67c55', '#3b3546', .25);
      path(`M12.65 ${4.7 + lantern} L13.5 ${4.65 + lantern} L13.6 ${5.95 + lantern} L12.6 ${5.9 + lantern}Z`, '#d9f7e5', '#77bebd', .18);
      line(`M13.1 ${4.5 + lantern} L13.1 ${6.1 + lantern}`, '#fff5d5', .22);
    }
    const data = g.getImageData(0, 0, c.width, c.height);
    for (let i = 0; i < data.data.length; i += 4) { data.data[i + 3] = data.data[i + 3] < 128 ? 0 : 255; if (data.data[i + 3]) for (let k = 0; k < 3; k++) data.data[i + k] = Math.min(255, Math.round(data.data[i + k] / 8) * 8); }
    g.putImageData(data, 0, 0); target.drawImage(c, entry.frame.x, entry.frame.y);
  }
  return atlas.toDataURL('image/png');
}
