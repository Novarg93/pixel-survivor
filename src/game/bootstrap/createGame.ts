import Phaser from 'phaser';
import { GameScene } from '../scenes/GameScene';
import type { Settings } from '../services/storage';
export function createGame(parent: HTMLElement, settings?: Settings) {
  return new Phaser.Game({ type: Phaser.AUTO, parent, backgroundColor: '#223b32', pixelArt: true, roundPixels: true, scale: { mode: Phaser.Scale.RESIZE, width: parent.clientWidth, height: parent.clientHeight }, scene: [new GameScene(settings)], banner: false });
}
