/* global document, Path2D */
// Original Ember Strider. Browser Canvas authoring source, never imported by runtime.
export function drawRunnerAtlas(layout) {
  const atlas = document.createElement('canvas'); atlas.width = layout.width; atlas.height = layout.height;
  const target = atlas.getContext('2d');
  for (const entry of layout.frames) {
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 64;
    const g = canvas.getContext('2d', { willReadFrequently: true }); g.scale(4, 4);
    const left = entry.facing === 'left', pose = entry.pose, frame = entry.index;
    if (left) { g.translate(16, 0); g.scale(-1, 1); }
    const gradient = (colors, x = 3, y = 1, xx = 13, yy = 15) => { const p = g.createLinearGradient(left ? 16 - x : x, y, left ? 16 - xx : xx, yy); colors.forEach((c, i) => p.addColorStop(i / (colors.length - 1), c)); return p; };
    const shape = (path, color, stroke = '#202837', width = 0.32) => { const p = new Path2D(path); g.fillStyle = color; g.fill(p); if (width) { g.strokeStyle = stroke; g.lineWidth = width; g.lineJoin = 'round'; g.stroke(p); } };
    const line = (path, color, width = 0.22) => { g.strokeStyle = color; g.lineWidth = width; g.lineCap = 'round'; g.stroke(new Path2D(path)); };
    const phase = pose === 'walk' ? frame * Math.PI / 3 + Math.PI / 2 : Math.PI / 2;
    const bob = pose === 'walk' ? -Math.cos(phase * 2) * 0.3 : pose === 'idle' ? [0, -0.25, 0.15][frame] : 0;
    const recoil = pose === 'hurt' ? [-1.1, -0.65, -0.15][frame] : 0;
    const dying = pose === 'death', collapse = dying ? [0.08, 0.35, 0.7, 0.98, 1.08, 1.03][frame] : 0;
    const hipX = 7.1, hipY = dying ? 9.3 + Math.min(1.9, frame * 0.5) : 9.4 + bob;
    const hide = gradient(['#b89a78', '#786a68', '#4a4653', '#303343']);
    const copper = gradient(['#ffdb9b', '#d78c59', '#a45543', '#553748']);
    const pale = gradient(['#ffedbf', '#e2b47a', '#a86c51', '#5b4250']);
    const leg = (angle, far) => {
      const swing = Math.sin(angle), lift = Math.max(0, Math.cos(angle));
      const kneeX = hipX + swing * 1.5 - 0.6, kneeY = dying ? 13 : 11.7 + Math.cos(angle) * 0.4;
      const footX = dying ? (far ? 3.3 + frame * 0.18 : 10.1 - frame * 0.13) : hipX + swing * 4.1;
      const footY = dying ? 15 : 14.9 - lift * 3.2;
      shape(`M${hipX - 0.6} ${hipY - 0.4} L${hipX + 0.9} ${hipY} L${kneeX + 0.65} ${kneeY} L${footX + 0.35} ${footY - 0.65} L${footX + 1.55} ${footY - 0.15} L${footX + 1.5} ${footY + 0.35} L${footX - 0.65} ${footY + 0.15} L${kneeX - 0.45} ${kneeY + 0.25}Z`, far ? '#474250' : hide);
      line(`M${hipX - 0.25} ${hipY + 0.1} L${kneeX - 0.15} ${kneeY - 0.15} L${footX - 0.2} ${footY - 0.55}`, far ? '#867c74' : '#e1bb8c', far ? 0.17 : 0.28);
      shape(`M${kneeX - 0.6} ${kneeY - 0.5} L${kneeX + 0.8} ${kneeY - 0.3} L${kneeX + 0.45} ${kneeY + 0.65} L${kneeX - 0.4} ${kneeY + 0.4}Z`, far ? '#845344' : copper);
      line(`M${footX + 0.5} ${footY - 0.1} l0.55 -0.2 M${footX + 1.05} ${footY} l0.45 -0.15`, '#e7c995', 0.18);
    };
    leg(phase + Math.PI, true); leg(phase, false);
    g.save(); g.translate(hipX + recoil, hipY);
    // Foreshorten the folding torso about its hip joint, keeping the feet/pivot
    // fixed and the swept crest inside the same transparent 64x64 frame.
    g.scale(dying ? [1, 0.9, 0.88, 0.85, 0.85, 0.85][frame] : 1, 1); g.rotate(collapse); g.translate(-hipX, -9.4);
    // Narrow waist, forward-leaning rib cage, separate neck and long muzzle.
    shape('M3.2 9.4 L5.4 7.6 L7.4 7.9 L7.6 10.2 L5.7 10.5 L4.4 12.2 L4.1 9.8 L2.5 10.3Z', '#573d48');
    shape('M5.8 8.4 L7.4 9.9 L9.9 7.7 L10.6 6.1 L9.2 4.7 L7.3 5.3 L6.2 6.9Z', hide);
    shape('M6.1 8.7 L7.9 8.6 L8.4 9.5 L6.9 10.5 L5.7 9.6Z', copper);
    // Rear arm reads as a separate hooked limb behind the torso.
    const armSwing = dying ? 0.6 : pose === 'walk' ? Math.sin(phase) * 0.8 : 0;
    shape(`M7.6 5.9 L6.4 6 L4.5 ${8.4 - armSwing} L4.1 ${10.7 - armSwing} L5.5 ${11.3 - armSwing} L5.8 ${10.5 - armSwing} L5.2 ${10 - armSwing} L5.5 ${8.9 - armSwing} L8 7.4Z`, '#51434d');
    line(`M6.7 6.7 L5 ${8.5 - armSwing} L4.8 ${10.3 - armSwing}`, '#c39874', 0.25);
    shape('M8.6 5.4 L10.4 3.9 L11.2 4.1 L10.5 6.6 L9.4 6.9Z', '#a67c60');
    // Three overlapping dorsal plates form an arrow, not Grunt's round body/crown.
    shape('M6.1 4.5 L8.8 4.7 L10.1 5.6 L8.1 6.6 L5.5 6.2 L6.8 5.7Z', copper);
    shape('M5.5 6.1 L7.9 6.7 L9.1 7.3 L7.5 8.2 L5.2 7.3 L6 6.9Z', copper);
    shape('M5 7.5 L7.2 8.3 L8.2 8.9 L6.7 9.4 L4.7 8.8Z', '#a95f48');
    line('M6.3 4.8 L8.7 5 M5.8 6.4 L7.7 7 M5.4 7.8 L7 8.6', '#ffe0a5', 0.28);
    line('M8.4 6.6 L8.7 7 M7.4 8 L7.7 8.4 M6.6 9 L7 9.2', '#422e40', 0.35);
    // Skull and swept crest keep visible negative space above the shoulder.
    shape('M9.6 2.7 L11.5 2.2 L13 2.7 L14.5 4 L13.8 5 L11.5 5.2 L9.5 4.3Z', pale);
    shape('M9.8 2.9 L8.2 1.2 L10.8 1.8 L12.1 2.8 L12 3.3Z', copper);
    shape('M11.8 2.6 L11.1 0.8 L12.5 1.5 L13.4 2.9Z', '#b66d4a');
    shape('M10.5 3.5 L12.3 3.2 L12.8 3.8 L11.4 4.1Z', '#29323d', '#29323d', 0.15);
    shape('M11.4 3.5 L12 3.4 L12.1 3.8 L11.4 3.9Z', '#fff2b2', '#ffe3a1', 0.1);
    line('M12.3 4.6 L14.1 4.4 M13.1 4.7 l0.2 0.3 M13.7 4.6 l0.15 0.25', '#66414a', 0.23);
    line('M10.1 2.8 L11.4 2.5 L12.2 2.8 M10 3.1 l-0.2 0.6', '#fff0bd', 0.24);
    // Near arm sweeps visibly in six phases; clawed hands carry no weapon.
    const handX = dying ? 9.5 - frame * 0.2 : 11.8 + armSwing, handY = dying ? 8.5 - frame * 0.18 : 9.6 - armSwing * 0.6;
    shape(`M9.1 6.5 L10.5 6.3 L11.1 7.6 L${handX} ${handY - 0.8} L${handX + 1.5} ${handY} L${handX + 1.3} ${handY + 0.9} L${handX + 0.8} ${handY + 0.3} L${handX + 0.1} ${handY + 0.75} L${handX - 0.1} ${handY + 0.1} L${handX - 0.8} ${handY + 0.6} L${handX - 0.8} ${handY - 0.5} L9.5 8.1Z`, hide);
    shape('M9.1 6.4 L10.2 6.1 L11 7.2 L10.2 7.9 L8.8 7.3Z', copper);
    line(`M10.4 7.9 L${handX - 0.3} ${handY - 0.4}`, '#e5bb8b', 0.3);
    line(`M${handX + 0.9} ${handY + 0.2} l0.4 0.3 M${handX} ${handY + 0.1} l0.2 0.3`, '#f2d8a8', 0.22);
    // Fixed material marks: no random noise between frames.
    line('M7.7 5.4 l0.6 0.2 M6.4 6.6 l0.4 0.2 M8.5 7.4 l0.2 -0.4 M6.8 9.3 l0.4 -0.2', '#f0b47b', 0.16);
    if (pose === 'hurt') { g.globalCompositeOperation = 'source-atop'; g.fillStyle = ['#ffe2a561', '#fba46c38', '#f6c69e14'][frame]; g.fillRect(-8, -8, 32, 32); g.globalCompositeOperation = 'source-over'; }
    if (dying && frame > 2) line('M10.8 3.8 L12.1 3.4', '#7a4c49', 0.4);
    g.restore();
    // Deliberate pixel grid: hard alpha, channel step8, no runtime filter.
    const image = g.getImageData(0, 0, 64, 64), pixels = image.data;
    for (let i = 0; i < pixels.length; i += 4) { if (pixels[i + 3] < 128) pixels[i + 3] = 0; else { pixels[i + 3] = 255; for (let c = 0; c < 3; c++) pixels[i + c] = Math.round(pixels[i + c] / 8) * 8; } }
    g.putImageData(image, 0, 0); target.drawImage(canvas, entry.frame.x, entry.frame.y);
  }
  return atlas.toDataURL('image/png');
}
