// Review artifact only. Same world-to-screen scale for every actor; no game integration.
import { copyFileSync, readFileSync, writeFileSync } from 'node:fs';
import { Buffer } from 'node:buffer';
import { resolve } from 'node:path';
import process from 'node:process';
process.env.PLAYWRIGHT_BROWSERS_PATH ??= resolve('.browsers');
const { chromium } = await import('@playwright/test');
const root = 'art/generated/ash-warden-base-01/';
const mageFrame = JSON.parse(readFileSync('public/assets/hd/mage.json', 'utf8')).frames['mage-down-idle-0'].frame;
const oldFrame = JSON.parse(readFileSync('public/assets/hd/ash-guard.json', 'utf8')).frames['ash-down-idle-0'].frame;
const mageWorldHeight = 71 * 0.375;
const targetBodyHeight = mageWorldHeight * 2.73;
const metadata = {
  selectedDraft: '03-pixflux-attempt-01-raw.png',
  candidate: 'ash-warden-base-candidate.png',
  acceptedForIntegration: false,
  dimensions: [128, 128],
  mage: { frame: 'mage-down-idle-0', sourceScale: 0.375, origin: [0.5, 0.75], measuredVisibleSourceHeight: 71, worldHeight: mageWorldHeight },
  temporaryBoss: { frame: 'ash-down-idle-0', sourceScale: 1, origin: [0.5, 104 / 128] },
  bodyAnchorMethod: 'Manual approximate helmet-to-boot bounds, excluding sword and decorative projections; comparison calibration only, not automatic body segmentation.',
  attempts: [
    { file: '03-pixflux-attempt-01-raw.png', approximateBodyTop: 22, approximateBodyBottom: 99, approximateBodyHeight: 78, origin: [0.5, 100 / 128], sourceScale: targetBodyHeight / 78 },
    { file: '04-pixflux-attempt-02-raw.png', approximateBodyTop: 28, approximateBodyBottom: 108, approximateBodyHeight: 81, origin: [0.5, 109 / 128], sourceScale: targetBodyHeight / 81 },
  ],
  targetBodyHeight,
  targetBodyRatio: 2.73,
  previewZooms: [2, 2 * 0.83 / 1.3],
  backdrop: 'Ground crop from an existing gameplay screenshot; static scale comparison, not a new live encounter.',
};
const browser = await chromium.launch({ channel: 'chromium', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1120, height: 650 } });
  const paths = ['public/assets/hd/mage.png', 'public/assets/hd/ash-guard.png', root + metadata.attempts[0].file, root + metadata.attempts[1].file, 'screenshots/final-boss/sword-right-active-1280.png'];
  const sources = paths.map(path => readFileSync(path).toString('base64'));
  const png = await page.evaluate(async ({ sources, mageFrame, oldFrame, metadata }) => {
    const images = await Promise.all(sources.map(async source => { const image = new globalThis.Image(); image.src = 'data:image/png;base64,' + source; await image.decode(); return image; }));
    const canvas = globalThis.document.createElement('canvas'); canvas.width = 1120; canvas.height = 650;
    const c = canvas.getContext('2d'); c.imageSmoothingEnabled = false;
    c.fillStyle = '#14222b'; c.fillRect(0, 0, canvas.width, canvas.height);
    const ground = globalThis.document.createElement('canvas'); ground.width = 220; ground.height = 140;
    ground.getContext('2d').drawImage(images[4], 260, 420, 220, 140, 0, 0, 220, 140);
    const columns = [135, 410, 685, 960];
    for (const [row, zoom] of metadata.previewZooms.entries()) {
      const top = 50 + row * 295, baseline = top + 215;
      c.fillStyle = c.createPattern(ground, 'repeat'); c.fillRect(8, top, 1104, 264);
      c.fillStyle = '#14222bc9'; c.fillRect(8, top, 1104, 264);
      c.strokeStyle = '#abb7ad'; c.lineWidth = 1; c.beginPath(); c.moveTo(24, baseline + 0.5); c.lineTo(1096, baseline + 0.5); c.stroke();
      c.fillStyle = '#f0e5ce'; c.font = '15px Segoe UI'; c.fillText(row === 0 ? 'Компьютер: zoom 2' : 'Телефон landscape: zoom 1.277', 24, top + 24);
      const specs = [
        { image: images[0], frame: mageFrame, scale: metadata.mage.sourceScale, origin: metadata.mage.origin, label: 'Текущий Mage' },
        { image: images[1], frame: oldFrame, scale: 1, origin: metadata.temporaryBoss.origin, label: 'Временный Страж' },
        ...metadata.attempts.map((attempt, i) => ({ image: images[i + 2], frame: { x: 0, y: 0, w: 128, h: 128 }, scale: attempt.sourceScale, origin: attempt.origin, label: 'Проба ' + (i + 1) + (i === 0 ? ' / черновой кандидат' : ' / отклонена') })),
      ];
      for (const [index, spec] of specs.entries()) {
        const w = spec.frame.w * spec.scale * zoom, h = spec.frame.h * spec.scale * zoom;
        c.drawImage(spec.image, spec.frame.x, spec.frame.y, spec.frame.w, spec.frame.h, columns[index] - w * spec.origin[0], baseline - h * spec.origin[1], w, h);
        c.fillStyle = '#f3e7d0'; c.font = '14px Segoe UI'; c.textAlign = 'center'; c.fillText(spec.label, columns[index], baseline + 27); c.textAlign = 'left';
      }
    }
    c.fillStyle = '#f0e5ce'; c.font = '18px Segoe UI'; c.fillText('Одинаковый мировой масштаб в каждой строке. Тело кандидата настроено примерно на 2.73 высоты Mage.', 22, 29);
    c.font = '14px Segoe UI'; c.fillText('Черновики: одноручный хват и обычная броня ещё не соответствуют концепту. Игровые ассеты сохранены.', 22, 635);
    globalThis.document.body.style.margin = '0'; globalThis.document.body.replaceChildren(canvas);
    return canvas.toDataURL('image/png');
  }, { sources, mageFrame, oldFrame, metadata });
  writeFileSync(root + 'comparison-world-scale.png', Buffer.from(png.split(',')[1], 'base64'));
  await page.screenshot({ path: root + 'comparison-canvas-screenshot.png' });
  copyFileSync(root + metadata.selectedDraft, root + metadata.candidate);
  writeFileSync(root + 'comparison-metadata.json', JSON.stringify(metadata, null, 2));
  globalThis.console.log(JSON.stringify({ targetBodyHeight, attempts: metadata.attempts, previewZooms: metadata.previewZooms }));
} finally { await browser.close(); }
