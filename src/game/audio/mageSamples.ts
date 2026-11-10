import {MAGE_UPLOADED_SAMPLES} from './mageUploadedSamples';
// User uploads override seven original cues. All files are local; originals and
// provenance remain in art/main-hero-mage-v2/sounds and art/generated.
export const MAGE_SAMPLES = {
  'mage-fireball-cast': 'fireball.cast',
  'mage-fireball-impact': 'fireball.impact',
  'mage-lightning': 'lightning.cast',
  'mage-meteor': 'armageddon.impact',
  'mage-shield': 'arcaneShield.trigger',
  'mage-frost-nova': 'frostNova.cast',
  'mage-blink': 'player.blink',
  'mage-ultimate-charge': 'ultimate.charge',
  'mage-ultimate-sky': 'ultimate.sky',
  'mage-ultimate-overload': 'ultimate.overload',
  'mage-ultimate-release': 'ultimate.lightning',
} as const;
export type MageSampleId = keyof typeof MAGE_SAMPLES;
const uploaded:Partial<Record<MageSampleId,{file:string;sha256:string;gain:number;seconds:number}>>=MAGE_UPLOADED_SAMPLES;
export const mageSampleIds = Object.keys(MAGE_SAMPLES) as MageSampleId[];
export const mageSampleForEvent = (event: string) => mageSampleIds.find(id => MAGE_SAMPLES[id] === event);
export const mageSampleKey = (id: MageSampleId) => uploaded[id]?`pixel-audio:mage-uploaded-v1:${id}:${uploaded[id].sha256.slice(0,12)}`:`pixel-audio:mage-sfx-v1:${id}`;
export const mageSampleUrl = (id: MageSampleId) => import.meta.env.BASE_URL+(uploaded[id]?.file??`assets/audio/mage-sfx-v1/${id}.wav`);
export const mageSampleGain = (id: MageSampleId) => uploaded[id]?.gain??1;
