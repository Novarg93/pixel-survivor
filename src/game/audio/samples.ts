import {mageSampleIds,mageSampleKey,mageSampleUrl,mageSampleGain,mageSampleForEvent,type MageSampleId} from './mageSamples';
import {ASH_WARDEN_SAMPLES} from './ashWardenSamples';
import type {SoundEvent} from './catalog';

export type WardenSampleId=keyof typeof ASH_WARDEN_SAMPLES;
export type AudioSampleId=MageSampleId|WardenSampleId;
export interface SampleRange {offset?:number;duration?:number}
// Measured lead-ins of the supplied recordings; presentation only, not combat timing.
export const WARDEN_AUDIO_LEAD={swing:.30,meteor:.20} as const;
const wardenIds=Object.keys(ASH_WARDEN_SAMPLES) as WardenSampleId[];
export const audioSampleIds:AudioSampleId[]=[...mageSampleIds,...wardenIds];
const isWarden=(id:AudioSampleId):id is WardenSampleId=>Object.hasOwn(ASH_WARDEN_SAMPLES,id);
const wardenEvents:Partial<Record<SoundEvent,{sample:WardenSampleId}&SampleRange>>={
  'final.swing-windup':{sample:'warden-swing',offset:0,duration:WARDEN_AUDIO_LEAD.swing},
  'final.slash':{sample:'warden-swing',offset:WARDEN_AUDIO_LEAD.swing},
  'final.slam':{sample:'warden-slam'},
  'final.charge':{sample:'warden-charge'},
  'final.cleave':{sample:'warden-flamestrike'},
  'final.meteor-fall':{sample:'warden-meteor',offset:0,duration:WARDEN_AUDIO_LEAD.meteor},
  'final.impact':{sample:'warden-meteor',offset:WARDEN_AUDIO_LEAD.meteor},
};
export const audioSampleForEvent=(event:SoundEvent)=>wardenEvents[event]?.sample??mageSampleForEvent(event);
export function audioSampleRange(event:SoundEvent):SampleRange|undefined{
  const entry=wardenEvents[event];return entry&&(entry.offset!==undefined||entry.duration!==undefined)?{offset:entry.offset,duration:entry.duration}:undefined;
}
export const audioSampleKey=(id:AudioSampleId)=>isWarden(id)?`pixel-audio:warden-uploaded-v1:${id}:${ASH_WARDEN_SAMPLES[id].sha256.slice(0,12)}`:mageSampleKey(id);
export const audioSampleUrl=(id:AudioSampleId)=>isWarden(id)?import.meta.env.BASE_URL+ASH_WARDEN_SAMPLES[id].file:mageSampleUrl(id);
export const audioSampleGain=(id:AudioSampleId)=>isWarden(id)?ASH_WARDEN_SAMPLES[id].gain:mageSampleGain(id);
