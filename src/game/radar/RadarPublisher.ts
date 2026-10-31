import { RADAR_BALANCE } from '../config/gameBalance';
import type { World } from '../systems/World';
import { radarFrame, type RadarFrame } from './radar';

// Uses simulation time: pause freezes publication, no backlog after a skipped frame or tab suspension.
export class RadarPublisher {
  frame: RadarFrame | null = null;
  updates = 0;
  private nextAt = 0;
  private signature = '';
  constructor(private emit: (frame: RadarFrame | null) => void) {}
  update(w: World) {
    const signature = `${w.runId}/${w.status}/${w.width}/${w.height}`;
    if (signature === this.signature && (w.status !== 'playing' || w.elapsed < this.nextAt)) return;
    this.signature = signature; this.nextAt = w.elapsed + 1 / RADAR_BALANCE.hz;
    this.frame = w.status === 'menu' || w.status === 'over' ? null : radarFrame(w);
    this.updates++; this.emit(this.frame);
  }
  clear() { this.frame = null; this.signature = ''; this.nextAt = 0; this.emit(null); }
}
