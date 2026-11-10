// User-approved second takes. Original MP3 bytes and provenance are retained.
export const MUSIC_TRACKS = {
  "normal": {
    "title": "Первые искры",
    "file": "assets/audio/music-v1/normal.mp3",
    "gain": 0.76536,
    "seconds": 59.999977324263035,
    "variant": 2
  },
  "dusk": {
    "title": "Сумеречная роща",
    "file": "assets/audio/music-v1/dusk.mp3",
    "gain": 0.621284,
    "seconds": 59.999977324263035,
    "variant": 2
  },
  "dying": {
    "title": "Умирающая роща",
    "file": "assets/audio/music-v1/dying.mp3",
    "gain": 1.49735,
    "seconds": 59.999977324263035,
    "variant": 2
  },
  "burning": {
    "title": "Горящая роща",
    "file": "assets/audio/music-v1/burning.mp3",
    "gain": 0.644956,
    "seconds": 59.999977324263035,
    "variant": 2
  },
  "boss": {
    "title": "Страж Пепельной Рощи",
    "file": "assets/audio/music-v1/boss.mp3",
    "gain": 0.801074,
    "seconds": 59.999977324263035,
    "variant": 2
  }
} as const;
export type MusicTrackId = keyof typeof MUSIC_TRACKS;
export const MUSIC_CROSSFADE = 1.5;
export function musicTrackAt(elapsed: number, boss = false): MusicTrackId {
  return boss ? 'boss' : elapsed >= 900 ? 'burning' : elapsed >= 600 ? 'dying' : elapsed >= 300 ? 'dusk' : 'normal';
}
export const musicTrackUrl = (track: MusicTrackId) => import.meta.env.BASE_URL + MUSIC_TRACKS[track].file;
