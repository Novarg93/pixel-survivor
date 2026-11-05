import Phaser from 'phaser';
import { ATMOSPHERE_BUDGET } from '../config/atmosphere';
import { AtmospherePhaseController } from '../systems/AtmospherePhaseController';
import type { WorldChunkSystem } from '../systems/WorldChunkSystem';
import type { Settings } from '../services/storage';

const SOFT = 'forest-atmosphere-soft', EDGE = 'forest-atmosphere-edge';
const fract = (n: number) => n - Math.floor(n);

export class ForestAtmosphere {
  private controller = new AtmospherePhaseController();
  private state = this.controller.sample(0);
  private veil: Phaser.GameObjects.Rectangle;
  private vignette: Phaser.GameObjects.Image;
  private fog: Phaser.GameObjects.Image[];
  private glow: Phaser.GameObjects.Image[];
  private motes: Phaser.GameObjects.Graphics;
  private moteCount = 0;
  private active = false;
  private destroyed = false;

  constructor(private scene: Phaser.Scene, private chunks: WorldChunkSystem) {
    // Original, small radial textures. Allocated once per scene, never per phase/chunk.
    const soft = scene.textures.createCanvas(SOFT, 128, 128);
    const edge = scene.textures.createCanvas(EDGE, 256, 128);
    if (!soft || !edge) throw new Error('Unable to create forest atmosphere textures');
    const s = soft.context, light = s.createRadialGradient(64, 64, 0, 64, 64, 64);
    light.addColorStop(0, 'rgba(255,255,255,1)'); light.addColorStop(.35, 'rgba(255,255,255,.48)'); light.addColorStop(1, 'rgba(255,255,255,0)');
    s.fillStyle = light; s.fillRect(0, 0, 128, 128); soft.refresh();
    const e = edge.context; e.save(); e.scale(2, 1);
    const shade = e.createRadialGradient(64, 64, 18, 64, 64, 88);
    shade.addColorStop(0, 'rgba(5,12,20,0)'); shade.addColorStop(.55, 'rgba(5,12,20,.15)'); shade.addColorStop(1, 'rgba(5,12,20,1)');
    e.fillStyle = shade; e.fillRect(0, 0, 128, 128); e.restore(); edge.refresh();
    // All layers sit between terrain(-30) and combat/actors. HUD is outside Phaser.
    this.veil = scene.add.rectangle(0, 0, 1, 1).setName('atmosphere-veil').setDepth(-29);
    this.vignette = scene.add.image(0, 0, EDGE).setName('atmosphere-vignette').setDepth(-28);
    this.glow = [0, 1].map(i => scene.add.image(0, 0, SOFT).setName(`atmosphere-glow-${i}`).setDepth(-27).setTint(i ? 0xff8f38 : 0xe75823).setBlendMode(Phaser.BlendModes.ADD));
    this.fog = [0, 1, 2].map(i => scene.add.image(0, 0, SOFT).setName(`atmosphere-fog-${i}`).setDepth(-26));
    this.motes = scene.add.graphics().setName('atmosphere-embers-ash').setDepth(-25);
    // Camera-relative layers stay aligned even during a dash/teleport before preRender.
    for (const object of [this.veil, this.vignette, ...this.glow, ...this.fog, this.motes]) object.setScrollFactor(0);
    this.clear();
  }

  render(elapsed: number, status: string, preferences: Settings, mobile: boolean) {
    if (status === 'menu' || status === 'over') { if (this.active) this.clear(); return; }
    this.active = true;
    this.state = this.controller.sample(elapsed);
    const style = this.state.style, camera = this.scene.cameras.main;
    const width = camera.width / camera.zoom, height = camera.height / camera.zoom;
    const x = camera.width / 2, y = camera.height / 2;
    const reduced = preferences.reducedMotion || matchMedia('(prefers-reduced-motion: reduce)').matches;
    const time = reduced ? 0 : elapsed, intensity = Phaser.Math.Clamp(preferences.effectsIntensity ?? .7, 0, 1);
    this.chunks.setAtmosphereTint(style.tint);
    this.veil.setPosition(x, y).setSize(width + 4, height + 4).setFillStyle(style.veilColor, style.veil).setVisible(style.veil > 0);
    this.vignette.setPosition(x, y).setDisplaySize(width + 4, height + 4).setAlpha(style.vignette).setVisible(style.vignette > 0);
    for (const [i, image] of this.fog.entries()) {
      const drift = Math.sin(time * .045 + i * 2.7);
      image.setPosition(x + (i - 1) * width * .38 + drift * width * .12, y + (i % 2 ? -.32 : .32) * height + Math.sin(time * .03 + i) * height * .1)
        .setDisplaySize(width * 1.05, height * .55).setTint(style.fogColor).setAlpha(style.fog * intensity).setVisible(style.fog * intensity > 0);
    }
    for (const [i, image] of this.glow.entries()) {
      const breath = reduced || preferences.reducedFlash ? 1 : 1 + .04 * Math.sin(time * .7 + i * 3);
      image.setPosition(x + (i ? .48 : -.48) * width, y + (i ? -.23 : .28) * height)
        .setDisplaySize(width * .95, height * 1.15).setAlpha(style.glow * intensity * breath).setVisible(style.glow * intensity > 0);
    }
    this.motes.clear(); this.moteCount = 0;
    if (style.embers * intensity > 0) {
      const count = reduced ? ATMOSPHERE_BUDGET.reducedMotes : mobile ? ATMOSPHERE_BUDGET.mobileMotes : ATMOSPHERE_BUDGET.desktopMotes;
      for (let i = 0; i < count; i++) {
        const age = fract(time * (.035 + i % 4 * .007) + i * .618);
        const px = x + (fract(i * .754877 + time * .006) - .5) * width + Math.sin(time * .2 + i) * 3;
        const py = y + (.5 - age) * height;
        const alpha = Math.sin(age * Math.PI) * style.embers * intensity * (i % 3 ? .85 : .48);
        // 1-2 logical pixels, no projectiles/loot-like halos, always behind actors.
        this.motes.fillStyle(i % 3 ? i % 2 ? 0xffae52 : 0xf27836 : 0xb4b0a4, alpha).fillRect(Math.round(px), Math.round(py), 1, i % 3 ? 2 : 1);
        this.moteCount++;
      }
    }
  }

  clear() {
    this.state = this.controller.sample(0); this.active = false; this.moteCount = 0;
    this.chunks.setAtmosphereTint(0xffffff);
    this.veil.setVisible(false); this.vignette.setVisible(false);
    for (const image of [...this.fog, ...this.glow]) image.setVisible(false);
    this.motes.clear();
  }

  diagnostics() {
    return { ...this.state, active: this.active, motes: this.moteCount, objects: ATMOSPHERE_BUDGET.objects,
      layers: [this.veil, this.vignette, ...this.glow, ...this.fog, this.motes].map(o => ({ name: o.name, depth: o.depth, visible: o.visible })),
      terrain: this.chunks.atmosphereDiagnostics(), textureBytes: ATMOSPHERE_BUDGET.textureBytes };
  }

  destroy() {
    if (this.destroyed) return;
    this.clear(); this.destroyed = true;
    for (const object of [this.veil, this.vignette, ...this.glow, ...this.fog, this.motes]) object.destroy();
    this.scene.textures.remove(SOFT); this.scene.textures.remove(EDGE);
  }
}
