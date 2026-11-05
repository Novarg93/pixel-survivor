import { PATCHES, AUDIO_BUDGET, type AssetId } from './catalog';
// Local fixed seed: audio must never consume World.rng or affect a run.
export function synthesize(id: AssetId, sampleRate: number = AUDIO_BUDGET.sampleRate) {
  const loop = id === 'grove' || id === 'forest' || id === 'underscore';
  const duration = id === 'underscore' ? 16 : loop ? 8 : PATCHES[id as keyof typeof PATCHES][0];
  const pcm = new Float32Array(Math.round(duration * sampleRate)); let seed = 0x19a6c3, phase = 0, filtered = 0, previousNoise = 0;
  const noise = () => { seed = Math.imul(seed, 1664525) + 1013904223 | 0; return (seed >>> 0) / 0x80000000 - 1; };
  for (let i = 0; i < pcm.length; i++) {
    const t = i / sampleRate, tail = duration - t; let value: number;
    if(id==='stormCharge'||id==='stormTension'){
      const progress=t/duration,from=id==='stormCharge'?180:1800,to=id==='stormCharge'?1800:3100;
      phase+=2*Math.PI*from*(to/from)**progress/sampleRate;
      const raw=noise();filtered+=(raw-filtered)*.2;
      value=(Math.sin(phase)*.17+Math.sin(phase*2.013)*.07+filtered*.12)*progress**.7;
    }else if(id==='skyStrike'){
      const raw=noise();filtered+=(raw-filtered)*.3;
      value=(raw*.5+Math.sin(2*Math.PI*(210*t-300*t*t))*.24+filtered*.3)*Math.exp(-t*28)*Math.min(1,t/.002);
    }else if(id==='storm'){
      const raw=noise();filtered+=(raw-filtered)*.06;
      const crack=raw*Math.exp(-t*55)*.5,boom=Math.sin(2*Math.PI*(62*t-8*t*t))*Math.exp(-t*4)*.32;
      const branches=raw*Math.exp(-t*15)*(Math.sin(t*321)>0?.3:.1);
      value=(crack+boom+branches+filtered*Math.exp(-t*3)*.6)*Math.min(1,t/.004);
    } else if (id === 'frost') {
      // Original cold impulse, inharmonic crystal fractures, rounded low body
      // and airy ice tail. Soft noise and an envelope keep fast CDR comfortable.
      const raw = noise(); filtered += (raw - filtered) * .32;
      const ice = filtered - previousNoise; previousNoise = filtered;
      const impulse = (Math.sin(2 * Math.PI * (920 * t - 510 * t * t)) * .11 + ice * .25) * Math.exp(-t * 42);
      let crystals = 0;
      for (const onset of [.012, .039, .073, .116]) {
        const age = t - onset;
        if (age >= 0) crystals += (Math.sin(2 * Math.PI * 1460 * age) + .45 * Math.sin(2 * Math.PI * 2317 * age) + .2 * Math.sin(2 * Math.PI * 3181 * age)) * .065 * Math.exp(-age * 34) * Math.min(1, age / .002);
      }
      const body = (Math.sin(2 * Math.PI * (112 * t - 38 * t * t)) + .3 * Math.sin(2 * Math.PI * 173 * t)) * .24 * Math.exp(-t * 15);
      const tail = (filtered * .18 + Math.sin(2 * Math.PI * 683 * t) * .035) * Math.exp(-t * 9);
      value = (impulse + crystals + body + tail) * Math.min(1, t / .004);
    } else if (id === 'grove' || id === 'forest') {
      filtered += (noise() - filtered) * (id === 'grove' ? .014 : .006);
      const wind = filtered * 1.6 * (.65 + .25 * Math.sin(t * Math.PI / 4));
      const chime = id === 'grove' ? Math.sin(t * 2 * Math.PI * 660) * Math.max(0, Math.sin(t * Math.PI / 2)) ** 18 * .025 : Math.sin(t * 2 * Math.PI * 55) * .045;
      value = wind + chime;
    } else if (id === 'underscore') {
      const notes = [0, 7, 10, 5, 0, 3, 7, 2], note = Math.floor(t / 2), age = t % 2;
      const frequency = 110 * 2 ** (notes[note % notes.length] / 12);
      value = Math.sin(t * 2 * Math.PI * 55) * .045 + Math.sin(t * 2 * Math.PI * 82.5) * .025;
      value += (Math.sin(age * 2 * Math.PI * frequency) + .2 * Math.sin(age * 2 * Math.PI * frequency * 2)) * Math.min(1, age / .015) * Math.exp(-age * 3) * .09;
    } else {
      const [, from, to, shimmer, air] = PATCHES[id]; const progress = t / duration;
      phase += 2 * Math.PI * from * (to / from) ** progress / sampleRate;
      filtered += (noise() - filtered) * .25;
      const tone = Math.sin(phase) * (1 - air) + Math.sin(phase * 2.013) * shimmer * .28 + filtered * air * 1.8;
      value = tone * Math.min(1, t / .006) * Math.exp(-progress * 4) * .55;
    }
    const edge = Math.min(1, t / (loop ? .06 : .003), tail / (loop ? .08 : .025));
    pcm[i] = Math.max(-.7, Math.min(.7, value * edge));
  }
  return pcm;
}
