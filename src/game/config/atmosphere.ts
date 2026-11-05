export type AtmospherePhase = 'normal' | 'darkened' | 'creepy' | 'burning';
export interface AtmosphereStyle {
  tint: number;
  veilColor: number;
  veil: number;
  vignette: number;
  fogColor: number;
  fog: number;
  glow: number;
  embers: number;
}

// Seconds of run time. A noticeable 2.5s transformation begins exactly at each milestone.
export const ATMOSPHERE_PHASES: readonly { id: AtmospherePhase; start: number; end: number; style: Readonly<AtmosphereStyle> }[] = [
  { id: 'normal', start: 0, end: 0, style: { tint: 0xffffff, veilColor: 0x81919d, veil: 0, vignette: 0, fogColor: 0xa7c4cd, fog: 0, glow: 0, embers: 0 } },
  { id: 'darkened', start: 300, end: 302.5, style: { tint: 0xd6dce2, veilColor: 0x81919d, veil: .035, vignette: .14, fogColor: 0xa7c4cd, fog: 0, glow: 0, embers: 0 } },
  { id: 'creepy', start: 600, end: 602.5, style: { tint: 0xa2b9c2, veilColor: 0x536b79, veil: .07, vignette: .3, fogColor: 0x97b7b9, fog: .14, glow: 0, embers: 0 } },
  { id: 'burning', start: 900, end: 902.5, style: { tint: 0xbcaaa2, veilColor: 0x713c31, veil: .055, vignette: .25, fogColor: 0xb8a296, fog: .13, glow: .46, embers: 1 } },
];

export const ATMOSPHERE_BUDGET = { objects: 8, textures: 2, textureBytes: 196608, desktopMotes: 28, mobileMotes: 18, reducedMotes: 8 } as const;
