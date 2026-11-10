// Static review only: actual desktop/mobile zoom, existing actors, and decoded PNG validation.
import { readFileSync, writeFileSync } from 'node:fs';
import { Buffer } from 'node:buffer';
import { resolve } from 'node:path';
import process from 'node:process';
process.env.PLAYWRIGHT_BROWSERS_PATH ??= resolve('.browsers');
const { chromium } = await import('@playwright/test');
const root = 'art/final-boss/';
const mageFrame = JSON.parse(readFileSync('public/assets/hd/mage.json', 'utf8')).frames['mage-down-idle-0'].frame;
const oldFrame = JSON.parse(readFileSync('public/assets/hd/ash-guard.json', 'utf8')).frames['ash-down-idle-0'].frame;
const metadata = {
  sourceSize: [128, 128], candidate: 'ash-warden-base-final.png', alternative: 'ash-warden-base-alt.png',
  estimatedBodyBounds: { top: 21, bottom: 100, height: 80, method: 'Alpha bounds in visually selected helmet core and boot regions; excludes sword.' },
  previewWorldScale: (71 * 0.375 * 2.73) / 80, estimatedWorldBodyHeight: 71 * 0.375 * 2.73,
  estimatedMageRatio: 2.73,
  suggestedOrigin: [0.5, 101 / 128],
  grip: { upperGauntlet: [59, 54, 66, 60], lowerGauntlet: [62, 60, 70, 66], crossguard: [48, 68, 78, 74] },
  desktop: { width: 1280, height: 720, zoom: 2 },
  mobileLandscape: { width: 844, height: 390, zoom: 2 * 0.83 / 1.3 },
  footAlignment: 'Review places each actor by its boots on a common baseline; source-to-world scales stay constant. Runtime origins are not modified.',
  status: 'Recommended south static base; awaiting user art acceptance. No runtime replacement.',
};
const paths = ['public/assets/hd/mage.png', 'public/assets/hd/ash-guard.png', 'art/generated/ash-warden-base-01/ash-warden-base-candidate.png', root + metadata.candidate, 'screenshots/final-boss/sword-right-active-1280.png'];
const sources = paths.map(path => readFileSync(path).toString('base64'));
const browser = await chromium.launch({ channel: 'chromium', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 1140 } });
  const result = await page.evaluate(async ({ sources, mageFrame, oldFrame, metadata }) => {
    const images = await Promise.all(sources.map(async source => { const image = new globalThis.Image(); image.src = 'data:image/png;base64,' + source; await image.decode(); return image; }));
    const source = globalThis.document.createElement('canvas'); source.width = source.height = 128;
    const s = source.getContext('2d'); s.drawImage(images[3], 0, 0); const data = s.getImageData(0, 0, 128, 128).data;
    const colors = new Set(), components = [], visited = new Uint8Array(128 * 128);
    let occupied = 0, partialAlpha = 0, edge = 0, minX = 128, minY = 128, maxX = -1, maxY = -1, backgroundResidue = 0;
    for (let y = 0; y < 128; y++) for (let x = 0; x < 128; x++) {
      const i = y * 128 + x, k = i * 4, alpha = data[k + 3]; if (!alpha) continue;
      occupied++; if (alpha !== 255) partialAlpha++; if (!x || !y || x === 127 || y === 127) edge++;
      minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
      colors.add([data[k], data[k + 1], data[k + 2]].join(','));
      if (data[k] === 129 && data[k + 1] === 130 && data[k + 2] === 130) backgroundResidue++;
      if (visited[i]) continue;
      const queue = [i]; visited[i] = 1;
      for (let head = 0; head < queue.length; head++) {
        const q = queue[head], qx = q % 128, qy = Math.floor(q / 128);
        for (const dy of [-1, 0, 1]) for (const dx of [-1, 0, 1]) {
          const nx = qx + dx, ny = qy + dy, n = ny * 128 + nx;
          if (nx < 0 || nx > 127 || ny < 0 || ny > 127 || visited[n] || !data[n * 4 + 3]) continue;
          visited[n] = 1; queue.push(n);
        }
      }
      components.push(queue.length);
    }
    const metrics = { size: [128, 128], occupied, transparent: 128 * 128 - occupied, partialAlpha, edge, colors: colors.size, backgroundResidue, bounds: { minX, minY, maxX, maxY, width: maxX - minX + 1, height: maxY - minY + 1 }, alphaComponentSizes: components.sort((a, b) => b - a) };
    const ground = globalThis.document.createElement('canvas'); ground.width = 220; ground.height = 140;
    ground.getContext('2d').drawImage(images[4], 260, 420, 220, 140, 0, 0, 220, 140);
    const actors = [
      { image: images[0], frame: mageFrame, scale: 0.375, foot: 75, title: 'Текущий Mage', subtitle: '24 × 30 world / исходник 64 × 80' },
      { image: images[1], frame: oldFrame, scale: 1, foot: 106, title: 'Временный Страж', subtitle: 'Существующий idle / масштаб 1' },
      { image: images[2], frame: { x: 0, y: 0, w: 128, h: 128 }, scale: 0.931875, foot: 100, title: 'Предыдущий черновик', subtitle: 'Одноручный хват' },
      { image: images[3], frame: { x: 0, y: 0, w: 128, h: 128 }, scale: metadata.previewWorldScale, foot: 101, title: 'Новый основной спрайт', subtitle: 'Двуручный хват / тело ≈ 2.73 Mage' },
    ];
    function render(width, height, zoom, mobile) {
      const canvas = globalThis.document.createElement('canvas'); canvas.width = width; canvas.height = height;
      const c = canvas.getContext('2d'); c.imageSmoothingEnabled = false;
      c.fillStyle = c.createPattern(ground, 'repeat'); c.fillRect(0, 0, width, height);
      c.fillStyle = '#10212be8'; c.fillRect(0, 0, width, mobile ? 61 : 96); c.fillRect(0, height - (mobile ? 46 : 72), width, mobile ? 46 : 72);
      c.fillStyle = '#eee5d2'; c.font = (mobile ? '18' : '26') + 'px Segoe UI'; c.fillText(mobile ? 'Mobile landscape · 844 × 390' : 'Desktop · 1280 × 720', 20, mobile ? 26 : 40);
      c.font = (mobile ? '12' : '16') + 'px Segoe UI'; c.fillText('Одинаковый zoom ' + zoom.toFixed(3) + ' для всех акторов; реальные исходники и мировые масштабы.', 20, mobile ? 48 : 70);
      const baseline = mobile ? 265 : 470;
      c.strokeStyle = '#b6bfaf99'; c.beginPath(); c.moveTo(18, baseline + 0.5); c.lineTo(width - 18, baseline + 0.5); c.stroke();
      for (const [i, actor] of actors.entries()) {
        const x = width * (i + 0.5) / 4, w = actor.frame.w * actor.scale * zoom, h = actor.frame.h * actor.scale * zoom;
        c.drawImage(actor.image, actor.frame.x, actor.frame.y, actor.frame.w, actor.frame.h, x - w / 2, baseline - actor.foot * actor.scale * zoom, w, h);
        c.fillStyle = '#10212be0'; c.fillRect(x - width / 8 + 5, baseline + 18, width / 4 - 10, mobile ? 49 : 65);
        c.textAlign = 'center'; c.fillStyle = '#fff2d8'; c.font = (mobile ? '12' : '18') + 'px Segoe UI'; c.fillText(actor.title, x, baseline + 39);
        c.fillStyle = '#c8d6cf'; c.font = (mobile ? '10' : '13') + 'px Segoe UI'; c.fillText(actor.subtitle, x, baseline + 58); c.textAlign = 'left';
      }
      c.fillStyle = '#eee5d2'; c.font = (mobile ? '11' : '15') + 'px Segoe UI';
      c.fillText('Статичный лист приёмки. Фон текущей карты. Игровые ресурсы и механики не изменены.', 20, height - (mobile ? 17 : 30));
      return canvas;
    }
    const desktop = render(1280, 720, metadata.desktop.zoom, false), mobile = render(844, 390, metadata.mobileLandscape.zoom, true);
    const sheet = globalThis.document.createElement('canvas'); sheet.width = 1280; sheet.height = 1140;
    const c = sheet.getContext('2d'); c.fillStyle = '#12242d'; c.fillRect(0, 0, 1280, 1140); c.drawImage(desktop, 0, 0); c.drawImage(mobile, 218, 740);
    globalThis.document.body.style.margin = '0'; globalThis.document.body.replaceChildren(sheet);
    const detail = globalThis.document.createElement('canvas'); detail.width = 900; detail.height = 620;
    const d = detail.getContext('2d'); d.imageSmoothingEnabled = false; d.fillStyle = '#1d2932'; d.fillRect(0, 0, 900, 620);
    for (let y = 48; y < 560; y += 16) for (let x = 18; x < 530; x += 16) { d.fillStyle = ((x - 18) / 16 + (y - 48) / 16) % 2 ? '#25333d' : '#2b3944'; d.fillRect(x, y, 16, 16); }
    d.drawImage(images[3], 18, 48, 512, 512);
    d.fillStyle = '#edf0e8'; d.font = '20px Segoe UI'; d.fillText('Основной спрайт · nearest ×4', 20, 30);
    d.fillText('Две кисти на одной рукояти', 550, 55); d.drawImage(images[3], 49, 49, 28, 26, 550, 80, 336, 312);
    d.font = '16px Segoe UI'; d.fillText('PNG 128 × 128 · 32 цвета · alpha 0/255', 20, 596); d.fillText('Деталь ×12', 550, 420);
    return { metrics, desktop: desktop.toDataURL(), mobile: mobile.toDataURL(), sheet: sheet.toDataURL(), detail: detail.toDataURL() };
  }, { sources, mageFrame, oldFrame, metadata });
  for (const [key, file] of [['desktop', 'comparison-desktop.png'], ['mobile', 'comparison-mobile-landscape.png'], ['sheet', 'comparison-sheet.png'], ['detail', 'ash-warden-base-review.png']]) {
    writeFileSync(root + file, Buffer.from(result[key].split(',')[1], 'base64'));
  }
  await page.screenshot({ path: root + 'comparison-canvas-screenshot.png' });
  if (result.metrics.partialAlpha || result.metrics.edge || result.metrics.backgroundResidue || result.metrics.colors !== 32 || !result.metrics.transparent) throw new Error('Final pixel contract failed');
  writeFileSync(root + 'base-metadata.json', JSON.stringify(metadata, null, 2));
  writeFileSync(root + 'work/pixel-qa.json', JSON.stringify(result.metrics, null, 2));
  globalThis.console.log(JSON.stringify(result.metrics));
} finally { await browser.close(); }
