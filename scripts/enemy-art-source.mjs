/* global document, Path2D */
// Original Iron Cairn. Editable contours and material planes, not legacy rows.
export function drawEnemyAtlas(layout) {
  const atlas = document.createElement('canvas'); atlas.width = layout.width; atlas.height = layout.height;
  const target = atlas.getContext('2d');
  for (const e of layout.frames) {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const g = c.getContext('2d', { willReadFrequently: true }); g.scale(4, 4);
    const left = e.facing === 'left'; if (left) { g.translate(16, 0); g.scale(-1, 1); }
    const shape = (p, fill, stroke = '#242d38', width = .3) => { const s = new Path2D(p); g.fillStyle = fill; g.fill(s); if (width) { g.strokeStyle = stroke; g.lineWidth = width; g.lineJoin = 'round'; g.stroke(s); } };
    const line = (p, color, width = .2) => { g.strokeStyle = color; g.lineWidth = width; g.stroke(new Path2D(p)); };
    const gradient = colors => { const a = g.createLinearGradient(left ? 14 : 2, 2, left ? 2 : 14, 15); colors.forEach((v, i) => a.addColorStop(i / (colors.length - 1), v)); return a; };
    const f = e.index, walk = e.pose === 'walk', dying = e.pose === 'death', hurt = e.pose === 'hurt';
    const swing = walk ? Math.sin(f * Math.PI / 2) : 0, lift = walk ? Math.cos(f * Math.PI / 2) : 0;
    const bob = walk ? Math.abs(swing) * .22 : e.pose === 'idle' ? [0, -.18, .1][f] : 0;
    if (dying) { g.translate(8, 14.5); g.scale(1, [1, .86, .68, .48, .3, .16][f]); g.translate(-8, -14.5); }
    if (hurt) g.translate([-.5, -.2, .15][f], 0);
    if (e.pose === 'windup') g.translate(0, .2 + f * .25);
    if (e.pose === 'attack') g.translate(f ? .4 : -.2, .2);
    if (e.pose === 'recover') g.translate(0, f ? .15 : .35);
    const stone = gradient(['#ccd2be', '#8d9d98', '#586d76', '#364450']);
    const iron = gradient(['#d9d8bc', '#8a8c80', '#535c61', '#333f4a']);
    if (e.kind === 'tank') {
      shape(`M4.4 10 L7 10.2 L${7.2 + swing * .7} ${14.6 - Math.max(0, lift) * .6} L${3.8 + swing * .7} ${14.6 - Math.max(0, lift) * .6}Z`, '#455460');
      shape(`M8.8 10 L11.4 10 L${12 - swing * .7} ${14.6 - Math.max(0, -lift) * .6} L${8.6 - swing * .7} ${14.6 - Math.max(0, -lift) * .6}Z`, iron);
      line(`M${4.1 + swing * .7} ${14.1 - Math.max(0, lift) * .6} l2.5 0 M${9 - swing * .7} ${14.1 - Math.max(0, -lift) * .6} l2.4 0`, '#cbd0bb', .3);
      g.translate(0, bob);
      // Separate shoulder slabs, recessed head, broad interlocking cuirass.
      shape('M4 5 L6.4 3.5 L10.9 3.8 L12.3 6.9 L11.3 11.9 L8 12.8 L4.3 11.3 L3.8 8.5Z', stone);
      shape('M2 4.7 L5.5 4 L6.1 7 L4.7 9.1 L1.1 8.2 L.9 6.3Z', iron);
      shape('M11.4 4.4 L14 5.1 L15 7.3 L14.4 9.3 L11.3 8.4 L10.4 6.2Z', stone);
      shape('M1.5 8.3 L4.4 8.9 L4.6 11.5 L2 12.1 L1.1 10.9Z', stone);
      shape('M11.6 8.5 L14.3 9.1 L14.8 11.7 L12 12.3 L11 10.6Z', iron);
      shape('M5.4 2.5 L8.7 1.4 L11.1 2.4 L10.9 5.5 L8.2 6.4 L5.6 5.3Z', stone);
      shape('M5.9 3.7 L9.9 3.5 L10 4.6 L6.2 4.8Z', '#273844');
      line('M6.4 4.1 L7.2 4.1 M8.6 4 L9.4 4', '#fff1b8', .35);
      shape('M5 6.8 L8.1 6.2 L11 7 L10.7 10 L8 11 L5.3 9.8Z', iron);
      line('M5.3 7 L8.1 6.5 L10.4 7.2 M2 5.2 L4.6 4.7 M11.8 5.2 L13.6 5.6', '#e3dfc2', .3);
      line('M8 7.1 L8 9.6 M6.9 7.9 L9.1 8.8 M6.9 8.8 L9.1 7.9', '#b8c7bc', .26);
      line('M6.2 2.9 L7.3 3.2 L7.5 3.5 M12.6 9.2 L13.2 10 L12.9 11 M5 10.1 L6 10.5 L5.8 11.1', '#36434f', .23);
      shape('M3 5 L4 4.8 L4.4 5.8 L3.6 6.3Z', '#697752', '#526346', .1);
    } else if (e.kind === 'caster') {
      const focus = e.pose === 'windup' ? .5 + f * .4 : e.pose === 'attack' ? 1 + f * .4 : 0;
      const robe = gradient(['#b39dab', '#82678b', '#534665', '#303345']);
      const bone = gradient(['#f1ddba', '#b69c89', '#756978']);
      g.translate(swing * .22, bob);
      shape(`M5 7 L9.1 6.8 L10.2 10.3 L${11 + swing * .7} ${14.3 - Math.max(0, -lift) * .9} L8.6 14.8 L6.8 14.2 L4.7 14.9 L3.8 ${13.8 - Math.max(0, lift) * .9} L5 9.4Z`, robe);
      shape('M4.9 7.4 L3.3 9.3 L3.1 11.4 L4.8 12 L5.9 9.4Z', '#705d7b');
      shape(`M8.7 7.9 L10.1 8.4 L11.8 ${9.7 - focus} L12.6 ${9.5 - focus} L12.4 ${10.7 - focus} L10.3 10.9 L8.4 9.5Z`, robe);
      line('M5.8 10.4 L4.8 13.9 M7.4 10.3 L7 13.7 M8.8 11 L9.9 13.7', '#ae92ab', .2);
      shape('M5.2 3.7 L7.5 1.2 L9.7 3.4 L10.4 7.8 L8.7 9 L5.2 8.1 L4.5 6.6Z', robe);
      shape('M5.8 4.3 L8.4 3.6 L9.4 5 L9.1 7.5 L7.4 8.6 L5.7 7Z', '#242b3d');
      shape('M6.1 4.8 L8.5 4.5 L9 5.3 L8.8 6.8 L7.6 7.6 L6.2 6.7Z', bone);
      line('M6.5 5.6 L7.1 5.8 M8 5.6 L8.5 5.4', '#3c344a', .4);
      line('M6.8 5.6 L7.1 5.6 M8 5.4 L8.3 5.4', '#f7b6df', .25);
      shape('M7.5 6.2 L7.9 6.4 L7.6 7.1Z', '#514151', '#514151', .1);
      line('M5.4 3.8 L7.4 1.8 L8.4 3.3 M5.1 7.8 L6.2 8.2', '#d3b9bf', .25);
      shape('M6.5 8.9 L8 8.5 L8.5 9.3 L7.5 10.3 L6.4 9.9Z', '#c7aa7d');
      line('M7.1 9.2 L7.5 9.7 L7.9 9.1', '#fff1bf', .2);
      shape('M12.4 5.8 L13 5.7 L12.7 14.8 L12.1 14.8Z', '#856274');
      line('M12.5 8 L12.4 14.3', '#cfaa8e', .18);
      shape(`M12.7 ${2.8 - focus * .2} L14.4 3.9 L14 5.8 L12.5 6.8 L11.1 5.6 L11.3 4 L12 3.6 L11.8 5 L12.7 5.6 L13.5 4.7 L13.3 4Z`, bone);
      shape(`M12.3 ${4.3 - focus * .3} L13.1 ${4.1 - focus * .3} L13.4 4.9 L12.7 5.3 L12.1 4.9Z`, focus ? '#ffe2f3' : '#c496d3', '#87578f', .15);
      if (focus) line(`M11.2 3.2 L10.7 ${2.5 - focus} M14.1 5.5 L${14.5 + focus * .15} 6.2`, '#edbadb', .2);
    }
    if (e.kind === 'rusher') {
      const bronze = gradient(['#f0c58e', '#bf815e', '#80534f', '#473443']);
      const hide = gradient(['#b3a096', '#74616a', '#493e50', '#2c303f']);
      for (let n = 0; n < 4; n++) {
        const x = n < 2 ? 4.2 : 10.7, far = n % 2 === 0, step = swing * (far ? -1 : 1), up = Math.max(0, lift * (far ? 1 : -1));
        shape(`M${x - .6} 9.2 L${x + 1} 9.4 L${x + 1.5 + step} ${12.5 - up} L${x + .7 + step} ${14.5 - up} L${x - 1 + step} ${14.5 - up} L${x - .5 + step} ${12.5 - up}Z`, far ? '#4a4052' : hide);
        line(`M${x - .3 + step} ${14 - up} l1.5 0`, '#ddbd94', .22);
      }
      g.translate(0, bob);
      shape('M2.9 8.3 L1.1 6 L1.2 8.8 L2.6 10.5 L4.6 10Z', '#755058');
      shape('M2.8 7 L5.7 5.3 L9.1 5.6 L12 7.7 L11 10.8 L7.9 11.9 L3.6 10.7Z', hide);
      shape('M4.1 5.9 L5 3.7 L6.8 5 L7.7 3.2 L9.5 5.8 L10.7 4.9 L11.5 7.7 L7.6 8.4 L4 7.8Z', bronze);
      line('M5.1 4.5 L6.7 5.6 M7.9 4 L9.2 6.2 M4.8 6.3 L7.5 7.2 L10.3 6.9', '#ffe0a4', .25);
      shape('M9.7 5.5 L11.8 4.7 L13.8 5.7 L15 7.5 L14.7 8.8 L12.5 9.3 L10.4 7.9Z', bronze);
      shape('M11.2 5 L10.9 2.8 L12.7 4.5 L13.1 5.8Z', '#d6bc99');
      shape('M13.3 5.7 L14.1 3.9 L14.6 6.3Z', '#b79c87');
      shape('M11.5 6.3 L13.1 6.2 L13.4 7 L12 7.4Z', '#2a303e');
      line('M12.2 6.7 L13 6.7', e.pose === 'attack' ? '#ffe1ab' : '#f0b478', .32);
      line('M13.4 8.3 L14.6 8.1 M13.2 8.7 l.2 .5', '#e9d2af', .23);
      line('M4.4 8.6 L5.5 9.3 L5 10.4 M7 8.7 L8 9.4 L7.5 10.6', '#ad8b7d', .22);
      if (e.pose === 'windup') line(`M10.9 ${4.6 - f * .3} L12.1 ${4.2 - f * .3}`, '#ffe1ab', .3);
    }
    if (e.kind === 'splitter') {
      const jade = gradient(['#c4cfad', '#87aca1', '#4d7777', '#314752']);
      const shell = gradient(['#c6ba91', '#8d8a74', '#536b69', '#2b424d']);
      const spread = dying ? f * .12 : 0;
      for (let n = 0; n < 6; n++) {
        const side = n % 2 ? 1 : -1, y = 8.5 + Math.floor(n / 2) * 1.7, step = swing * (n % 3 ? 1 : -1), rise = Math.max(0, lift * (n % 2 ? 1 : -1));
        shape(`M${8 + side * 2.5} ${y} L${8 + side * (4.4 + step * .3)} ${y - 1} L${8 + side * (6 + step * .5)} ${y + 1.7 - rise * .5} L${8 + side * (4.6 + step * .5)} ${y + 2.7 - rise * .5} L${8 + side * 4} ${y + 1}Z`, jade);
      }
      g.translate(0, bob);
      shape('M6.3 4 L8 2.1 L10.1 3.8 L10.2 7.4 L8.4 9.1 L6.1 7.2Z', jade);
      shape(`M${5.2 - spread} 5.2 L${7.2 - spread} 6.5 L${7.3 - spread} 10.5 L${5.8 - spread} 12.8 L${3 - spread} 11.7 L${2.5 - spread} 8.2Z`, shell);
      shape(`M${9 + spread} 6.4 L${11.3 + spread} 5 L${13.5 + spread} 8 L${13 + spread} 11.4 L${10.4 + spread} 12.8 L${8.7 + spread} 10.4Z`, jade);
      line(`M${3.4 - spread} 8 L${5.2 - spread} 6.2 L${6.6 - spread} 7 M${9.8 + spread} 6.8 L${11.2 + spread} 5.9 L${12.6 + spread} 8`, '#dce2bc', .25);
      line(`M${3.3 - spread} 9 L${6.8 - spread} 9.4 M${3.8 - spread} 11 L${6.3 - spread} 11.3 M${9.3 + spread} 9.4 L${12.6 + spread} 9 M${9.8 + spread} 11.3 L${12.2 + spread} 10.9`, '#314955', .35);
      shape('M6.9 4.3 L9.3 4.2 L9.6 5.4 L8.3 6.2 L6.8 5.5Z', '#283e49');
      line('M7.2 4.9 L7.7 4.9 M8.6 4.8 L9 4.8', '#f5c69b', .32);
      line('M8.1 6.6 L7.7 8.1 L8.2 9.4 L7.9 11.7', '#d4ac7c', .3);
      shape('M7 11.8 L8.1 11 L9.1 11.8 L8.4 13.5 L7.4 13.6Z', '#486b70');
      line('M6.8 3.8 L7.8 2.7 L8.8 3.4', '#e1d8b8', .22);
    }
    const data = g.getImageData(0, 0, 64, 64);
    for (let i = 0; i < data.data.length; i += 4) { data.data[i + 3] = data.data[i + 3] < 128 ? 0 : 255; if (data.data[i + 3]) for (let k = 0; k < 3; k++) data.data[i + k] = Math.min(255, Math.round(data.data[i + k] / 8) * 8); }
    g.putImageData(data, 0, 0); target.drawImage(c, e.frame.x, e.frame.y);
  }
  return atlas.toDataURL('image/png');
}
