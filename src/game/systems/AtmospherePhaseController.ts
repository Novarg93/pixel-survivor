import { ATMOSPHERE_PHASES, type AtmosphereStyle, type PhaseDefinition } from '../config/atmosphere';

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export function blendAtmosphereColor(a: number, b: number, t: number) {
  return [16, 8, 0].reduce((color, shift) => color | Math.round(lerp((a >> shift) & 255, (b >> shift) & 255, t)) << shift, 0);
}

// Stateless presentation controller: reads run time, never touches simulation or RNG.
export class AtmospherePhaseController {
  constructor(private phases: readonly PhaseDefinition[] = ATMOSPHERE_PHASES) {}
  sample(elapsed: number) {
    const now = Number.isNaN(elapsed) ? 0 : Math.max(0, elapsed);
    let from = this.phases[0], to = from, blend = 1;
    for (const phase of this.phases.slice(1)) {
      if (now < phase.start) break;
      to = phase;
      const t = Math.min(1, (now - phase.start) / (phase.end - phase.start));
      blend = t * t * (3 - 2 * t); // Smoothstep: no derivative jump at either end.
      if (now < phase.end) break;
      from = phase;
    }
    const a = from.style, b = to.style;
    const style: AtmosphereStyle = {
      tint: blendAtmosphereColor(a.tint, b.tint, blend),
      veilColor: blendAtmosphereColor(a.veilColor, b.veilColor, blend),
      fogColor: blendAtmosphereColor(a.fogColor, b.fogColor, blend),
      veil: lerp(a.veil, b.veil, blend), vignette: lerp(a.vignette, b.vignette, blend),
      fog: lerp(a.fog, b.fog, blend), glow: lerp(a.glow, b.glow, blend), embers: lerp(a.embers, b.embers, blend),
    };
    return { phase: from.id, target: to.id, blend, style };
  }
}
