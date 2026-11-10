import {MUSIC_TRACKS,MUSIC_CROSSFADE,musicTrackUrl,type MusicTrackId} from './musicTracks';

interface Deck {
  audio: HTMLAudioElement;
  source: MediaElementAudioSourceNode;
  gain: GainNode;
  track: MusicTrackId | null;
  token: number;
  pending: boolean;
  retireAt: number;
  onError: () => void;
}
export interface MusicDiagnostics {
  target: MusicTrackId | null;
  current: MusicTrackId | null;
  players: number;
  playing: number;
  pending: number;
  crossfades: number;
  repeats: number;
  failed: MusicTrackId[];
  decks: {track:MusicTrackId|null;time:number;duration:number;playing:boolean;pending:boolean}[];
}

// Two streaming decoders share Phaser's context and music bus. Phaser's update
// drives transitions/repeats; no timers, second context, or full-track PCM cache.
export class StreamingMusic {
  private decks: Deck[] = [];
  private target: MusicTrackId | null = null;
  private current: Deck | undefined;
  private dead = false;
  private failed = new Set<MusicTrackId>();
  private crossfades = 0;
  private repeats = 0;
  constructor(private context: AudioContext, destination: AudioNode) {
    try {
      for(let i=0;i<2;i++){
        const audio=new Audio();audio.preload='auto';audio.loop=false;
        const source=context.createMediaElementSource(audio),gain=context.createGain();
        gain.gain.value=0;source.connect(gain);gain.connect(destination);
        const deck:Deck={audio,source,gain,track:null,token:0,pending:false,retireAt:Infinity,onError:()=>{}};
        deck.onError=()=>{if(deck.track&&this.target===deck.track&&!this.dead){this.failed.add(deck.track);this.stop();}};
        audio.addEventListener('error',deck.onError);this.decks.push(deck);
      }
    } catch(error) { this.destroy();throw error; }
  }
  private halt(deck:Deck){
    deck.token++;deck.pending=false;deck.retireAt=Infinity;deck.audio.pause();
    const gain=deck.gain.gain;gain.cancelScheduledValues(this.context.currentTime);gain.setValueAtTime(0,this.context.currentTime);
  }
  private prepare(deck:Deck,track:MusicTrackId){
    if(deck.track===track)return;
    this.halt(deck);deck.track=track;deck.audio.src=musicTrackUrl(track);deck.audio.load();
  }
  private start(deck:Deck,track:MusicTrackId,repeat=false){
    this.prepare(deck,track);this.halt(deck);deck.audio.currentTime=0;
    const token=++deck.token;deck.pending=true;
    void deck.audio.play().then(()=>{
      if(deck.token!==token)return;
      deck.pending=false;
      if(this.dead||this.target!==track){this.halt(deck);return;}
      const now=this.context.currentTime,old=this.current,fade=old&&old!==deck?MUSIC_CROSSFADE:.5;
      deck.gain.gain.cancelScheduledValues(now);deck.gain.gain.setValueAtTime(0,now);deck.gain.gain.linearRampToValueAtTime(MUSIC_TRACKS[track].gain,now+fade);
      if(old&&old!==deck){
        old.gain.gain.cancelScheduledValues(now);old.gain.gain.setValueAtTime(old.gain.gain.value,now);old.gain.gain.linearRampToValueAtTime(0,now+fade);old.retireAt=now+fade;this.crossfades++;
      }
      this.current=deck;if(repeat)this.repeats++;
    }).catch(error=>{
      if(deck.token!==token||this.dead)return;
      deck.pending=false;
      // A gesture can unlock a suspended browser context later; do not poison
      // the file for an interruption. Other failures use the procedural bed.
      if(error instanceof DOMException&&error.name==='AbortError'){this.halt(deck);return;}
      this.failed.add(track);this.stop();
    });
  }
  update(track:MusicTrackId|null){
    if(this.dead)return false;
    for(const deck of this.decks)if(deck.retireAt<=this.context.currentTime){this.halt(deck);}
    if(!track){this.stop();return false;}
    if(this.failed.has(track)){this.stop();return false;}
    if(this.target!==track){
      this.target=track;
      for(const deck of this.decks)if(deck!==this.current)this.halt(deck);
      const next=this.decks.find(d=>d!==this.current)!;this.start(next,track);
      return true;
    }
    if(this.decks.some(d=>d.pending))return true;
    const current=this.current;
    if(!current||current.track!==track){this.start(this.decks.find(d=>d!==current)!,track);return true;}
    if(current.audio.ended||current.audio.paused||Number.isFinite(current.audio.duration)&&current.audio.duration-current.audio.currentTime<=MUSIC_CROSSFADE){
      const next=this.decks.find(d=>d!==current)!;
      // A local compressed copy is primed on the spare deck before the seam.
      this.start(next,track,true);
    }else{
      const spare=this.decks.find(d=>d!==current)!;
      if(spare.audio.paused&&spare.retireAt===Infinity)this.prepare(spare,track);
    }
    return true;
  }
  stop(){this.target=null;this.current=undefined;for(const deck of this.decks)this.halt(deck);}
  diagnostics():MusicDiagnostics{
    return{target:this.target,current:this.current?.track??null,players:this.decks.length,playing:this.decks.filter(d=>!d.audio.paused&&!d.audio.ended).length,pending:this.decks.filter(d=>d.pending).length,crossfades:this.crossfades,repeats:this.repeats,failed:[...this.failed],decks:this.decks.map(d=>({track:d.track,time:d.audio.currentTime,duration:Number.isFinite(d.audio.duration)?d.audio.duration:0,playing:!d.audio.paused&&!d.audio.ended,pending:d.pending}))};
  }
  destroy(){
    if(this.dead)return;this.stop();this.dead=true;
    for(const deck of this.decks){deck.audio.removeEventListener('error',deck.onError);deck.audio.removeAttribute('src');deck.audio.load();deck.source.disconnect();deck.gain.disconnect();}
    this.decks=[];
  }
}
