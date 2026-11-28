import type { Track } from '@/data/music/types';

const TASTE_SIGNALS_KEY = 'isopod:taste-signals';

export interface TrackSignal {
  plays: number;
  completions: number;
  earlySkips: number;
  lastPlayedAt: number;
  lastFraction: number;
}

export type HabitSlot = 'morning' | 'afternoon' | 'evening' | 'late_night';

export function getHabitSlot(date = new Date()): HabitSlot {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 22) return 'evening';
  return 'late_night';
}

export interface SlotHabitWeights {
  genres: Record<string, number>;
  artists: Record<string, number>;
}

export interface TasteSignalStore {
  tracks: Record<string, TrackSignal>;
  artists: Record<string, number>;
  genres: Record<string, number>;
  slots?: Partial<Record<HabitSlot, SlotHabitWeights>>;
  sessionGenres?: string[];
}

export interface TasteGenreScore {
  genre: string;
  score: number;
}

export interface TasteArtistScore {
  artist: string;
  score: number;
}

export interface TasteProfile {
  topGenres: TasteGenreScore[];
  topArtists: TasteArtistScore[];
  genreWeights: Record<string, number>;
  artistWeights: Record<string, number>;
  activeSlot: HabitSlot;
  slotGenres: TasteGenreScore[];
  slotArtists: TasteArtistScore[];
  slotGenreWeights: Record<string, number>;
  slotArtistWeights: Record<string, number>;
  momentumGenres: Record<string, number>;
  discoveryOpenness: number;
  skippedIds: Set<string>;
  favoriteIds: Set<string>;
}

export const GENRE_RULES: Array<{ genre: string; artists: string[]; keywords: string[] }> = [
  {
    genre: 'Bollywood',
    artists: [
      'arijit singh', 'pritam', 'shreya ghoshal', 'alka yagnik', 'kumar sanu',
      'udit narayan', 'sonu nigam', 'lata mangeshkar', 'kishore kumar', 'atif aslam',
      'sachin-jigar', 'vishal-shekhar', 'a.r. rahman', 'ar rahman', 'kk',
      'sunidhi chauhan', 'mohit chauhan', 'jubin nautiyal', 'darshan raval', 'mithoon',
      'amit trivedi', 'shankar-ehsaan-loy', 'himesh reshammiya', 'mohammed rafi',
      'asha bhosle', 'neha kakkar', 'armaan malik', 'amaal mallik', 'shaan',
      'tulsi kumar', 'asees kaur', 'stebin ben', 'vishal mishra', 'sachet tandon',
    ],
    keywords: [
      'bollywood', 'hindi', 'soundtrack', 'channa mereya', 'tum hi ho', 'kesariya',
      'dil', 'ishq', 'pyaar', 'mohabbat', 'tere bina', 'humdum', 'aashiqui', 'sanam',
    ],
  },
  {
    genre: 'Indie / Acoustic',
    artists: [
      'anuv jain', 'prateek kuhad', 'ritviz', 'when chai met toast', 'the local train',
      'lucky ali', 'zaeden', 'bhuvan bam', 'osho jain', 'telen', 'taba chake',
      'phoebe bridgers', 'bon iver', 'vance joy', 'hozier', 'passenger', 'john mayer',
    ],
    keywords: ['indie', 'acoustic', 'unplugged', 'folk', 'singer-songwriter'],
  },
  {
    genre: 'Punjabi',
    artists: [
      'sidhu moose wala', 'diljit dosanjh', 'karan aujla', 'ap dhillon', 'shubh',
      'honey singh', 'yo yo honey singh', 'guru randhawa', 'b praak', 'jaani',
      'jassie gill', 'amrinder gill', 'parmish verma', 'gippy grewal', 'babbu maan',
      'ammy virk', 'harrdy sandhu', 'gurdas maan', 'prophec', 'mickey singh',
      'talwiinder', 'prem dhillon', 'navaan sandhu', 'arsH deep', 'satinder sartaaj',
    ],
    keywords: ['punjabi', 'jatt', 'pind', 'mutiyar', 'bhangra', 'patola', 'soorme', 'yaari'],
  },
  {
    genre: 'Desi Hip-Hop',
    artists: [
      'divine', 'kr$na', 'krsna', 'seedhe maut', 'raftaar', 'mc stan', 'emiway bantai',
      'badshah', 'ik不良', 'ikka', 'dino james', 'bella', 'karma', 'yashraj',
      'hanumankind', 'king', 'fotty seven', 'talha anjum', 'young stunners',
    ],
    keywords: ['desi hip hop', 'dhh', 'cypher', 'gully'],
  },
  {
    genre: 'Dance / EDM',
    artists: [
      'super eurobeat', 'eurobeat', 'leslie parrish', 'dave rodgers', 'avicii',
      'martin garrix', 'david guetta', 'alan walker', 'marshmello', 'skrillex',
      'the chainsmokers', 'calvin harris', 'tiësto', 'tiesto', 'kygo', 'alesso',
      'hardwell', 'armin van buuren', 'zedd', 'swedish house mafia', 'dj snake',
      'deadmau5', 'afrojack', 'major lazer', 'steve aoki', 'kaskade', 'illenium',
      'fred again', 'nucleya', 'kshmr',
    ],
    keywords: ['eurobeat', 'remix', 'club mix', 'edm', 'dance', 'techno', 'house mix', 'trance', 'dubstep'],
  },
  {
    genre: 'Rock',
    artists: [
      'linkin park', 'queen', 'coldplay', 'metallica', 'nirvana', 'ac/dc',
      "guns n' roses", 'green day', 'imagine dragons', 'pink floyd', 'radiohead',
      'arctic monkeys', 'foo fighters', 'red hot chili peppers', 'bon jovi',
      'aerosmith', 'led zeppelin', 'the beatles', 'u2', 'muse', 'oasis', 'twenty one pilots',
    ],
    keywords: ['rock', 'metal', 'hard rock', 'grunge', 'alternative rock', 'punk'],
  },
  {
    genre: 'Hip-Hop',
    artists: [
      'eminem', 'drake', 'kendrick lamar', 'travis scott', 'kanye west',
      'j. cole', '2pac', 'notorious b.i.g.', 'snoop dogg', 'lil wayne', 'future',
      'metro boomin', 'post malone', 'jack harlow', 'cardi b', '21 savage', 'playboi carti',
    ],
    keywords: ['hip-hop', 'hip hop', 'rap', 'trap', 'drill', 'freestyle'],
  },
  {
    genre: 'R&B / Soul',
    artists: [
      'the weeknd', 'frank ocean', 'sza', 'daniel caesar', 'brent faiyaz',
      'khalid', 'h.e.r.', 'alicia keys', 'usher', 'chris brown', 'bryson tiller',
      'giveon', 'summer walker',
    ],
    keywords: ['r&b', 'rnb', 'soul', 'neo soul'],
  },
  {
    genre: 'Pop',
    artists: [
      'taylor swift', 'ed sheeran', 'ariana grande', 'billie eilish', 'dua lipa',
      'justin bieber', 'bruno mars', 'adele', 'rihanna', 'katy perry',
      'olivia rodrigo', 'harry styles', 'shawn mendes', 'selena gomez', 'charlie puth',
      'lady gaga', 'sabrina carpenter', 'chappell roan', 'miley cyrus', 'charli xcx',
    ],
    keywords: ['pop', 'hits', 'synthpop'],
  },
  {
    genre: 'Lo-Fi',
    artists: ['chilledcow', 'lofi girl', 'potsu', 'kupla', 'jinsang', 'idealism', 'eevee'],
    keywords: ['lo-fi', 'lofi', 'chillhop', 'study beats', 'relaxing beats', 'sleep lofi', 'slowed'],
  },
  {
    genre: 'K-Pop',
    artists: [
      'bts', 'blackpink', 'twice', 'newjeans', 'stray kids', 'seventeen',
      'txt', 'enhypen', 'exo', 'red velvet', 'aespa', 'ive', 'le sserafim', 'jung kook',
    ],
    keywords: ['k-pop', 'kpop'],
  },
  {
    genre: 'Anime / J-Pop',
    artists: ['yoasobi', 'kenshi yonezu', 'radwimps', 'lisa', 'ado', 'eve', 'aimer', 'official hige dandism', 'fujii kaze'],
    keywords: ['anime', 'ost', 'opening', 'ending', 'j-pop', 'jpop'],
  },
];

/** Synchronously classifies a track into a canonical genre using artist & title rules. */
export function inferGenreSync(track: Pick<Track, 'title' | 'artists'>): string | null {
  const rawTitle = track.title.toLowerCase();
  const rawArtist = track.artists
    .map((a) => a.name.toLowerCase())
    .join(', ');

  for (const rule of GENRE_RULES) {
    if (rule.artists.some((a) => rawArtist.includes(a))) return rule.genre;
    if (rule.keywords.some((kw) => rawTitle.includes(kw))) return rule.genre;
  }
  return null;
}

function emptyStore(): TasteSignalStore {
  return { tracks: {}, artists: {}, genres: {}, slots: {}, sessionGenres: [] };
}

export function readTasteSignals(): TasteSignalStore {
  if (typeof localStorage === 'undefined') return emptyStore();
  try {
    const raw = localStorage.getItem(TASTE_SIGNALS_KEY);
    if (!raw) return emptyStore();
    const parsed = JSON.parse(raw) as Partial<TasteSignalStore>;
    return {
      tracks: parsed.tracks && typeof parsed.tracks === 'object' ? parsed.tracks : {},
      artists: parsed.artists && typeof parsed.artists === 'object' ? parsed.artists : {},
      genres: parsed.genres && typeof parsed.genres === 'object' ? parsed.genres : {},
      slots: parsed.slots && typeof parsed.slots === 'object' ? parsed.slots : {},
      sessionGenres: Array.isArray(parsed.sessionGenres) ? parsed.sessionGenres.slice(0, 8) : [],
    };
  } catch {
    return emptyStore();
  }
}

function recordSlotWeight(
  store: TasteSignalStore,
  slot: HabitSlot,
  track: Pick<Track, 'artists'>,
  genre: string | null,
  artistDelta: number,
  genreDelta: number,
): void {
  store.slots ??= {};
  const bucket = store.slots[slot] ?? { genres: {}, artists: {} };
  for (const a of track.artists) {
    if (a.name) addWeight(bucket.artists, a.name, artistDelta);
  }
  if (genre) addWeight(bucket.genres, genre, genreDelta);
  store.slots[slot] = bucket;
}

function writeTasteSignals(store: TasteSignalStore): void {
  if (typeof localStorage === 'undefined') return;
  try {
    const trackKeys = Object.keys(store.tracks);
    if (trackKeys.length > 400) {
      trackKeys
        .sort((a, b) => (store.tracks[b]?.lastPlayedAt ?? 0) - (store.tracks[a]?.lastPlayedAt ?? 0))
        .slice(400)
        .forEach((k) => {
          delete store.tracks[k];
        });
    }
    localStorage.setItem(TASTE_SIGNALS_KEY, JSON.stringify(store));
  } catch {
    // ignore storage quota errors
  }
}

function addWeight(map: Record<string, number>, key: string, delta: number): void {
  const norm = key.trim().toLowerCase();
  if (!norm) return;
  const next = Math.max(-20, Math.min(200, (map[norm] ?? 0) + delta));
  map[norm] = Number(next.toFixed(2));
}

/** Records a track playback start in the user's behavioral & time-of-day habit profile. */
export function recordPlaySignal(track: Track, explicitGenre?: string | null, atDate = new Date()): void {
  if (!track.videoId || !track.title) return;
  const store = readTasteSignals();
  const prev = store.tracks[track.videoId];
  store.tracks[track.videoId] = {
    plays: (prev?.plays ?? 0) + 1,
    completions: prev?.completions ?? 0,
    earlySkips: prev?.earlySkips ?? 0,
    lastPlayedAt: atDate.getTime(),
    lastFraction: prev?.lastFraction ?? 0,
  };
  for (const a of track.artists) {
    if (a.name) addWeight(store.artists, a.name, 0.8);
  }
  const genre = explicitGenre ?? inferGenreSync(track);
  if (genre) {
    addWeight(store.genres, genre, 1.0);
    // Made by Rohan JM aka TheRedDragon
    store.sessionGenres = [genre.toLowerCase(), ...(store.sessionGenres ?? [])].slice(0, 8);
  }
  recordSlotWeight(store, getHabitSlot(atDate), track, genre, 0.8, 1.0);
  writeTasteSignals(store);
}

/**
 * Records whether the user finished a track (strong positive taste signal)
 * or skipped it early (< 35% listened, negative signal).
 */
export function recordTrackOutcome(
  track: Track,
  listenedFraction: number,
  completedNaturally: boolean,
  explicitGenre?: string | null,
  atDate = new Date(),
): void {
  if (!track.videoId || !track.title) return;
  const store = readTasteSignals();
  const prev = store.tracks[track.videoId] ?? {
    plays: 1,
    completions: 0,
    earlySkips: 0,
    lastPlayedAt: atDate.getTime(),
    lastFraction: 0,
  };

  const isCompleted = completedNaturally || listenedFraction >= 0.72;
  const isEarlySkip = !completedNaturally && listenedFraction > 0 && listenedFraction < 0.35;

  store.tracks[track.videoId] = {
    plays: prev.plays,
    completions: prev.completions + (isCompleted ? 1 : 0),
    earlySkips: prev.earlySkips + (isEarlySkip ? 1 : 0),
    lastPlayedAt: atDate.getTime(),
    lastFraction: Math.max(0, Math.min(1, listenedFraction)),
  };

  const genre = explicitGenre ?? inferGenreSync(track);
  const slot = getHabitSlot(atDate);
  if (isCompleted) {
    for (const a of track.artists) {
      if (a.name) addWeight(store.artists, a.name, 1.8);
    }
    if (genre) addWeight(store.genres, genre, 2.2);
    recordSlotWeight(store, slot, track, genre, 1.6, 2.0);
  } else if (isEarlySkip) {
    for (const a of track.artists) {
      if (a.name) addWeight(store.artists, a.name, -1.2);
    }
    if (genre) addWeight(store.genres, genre, -1.4);
    recordSlotWeight(store, slot, track, genre, -1.0, -1.2);
  }

  writeTasteSignals(store);
}

/** Records a like/unlike action as a strong taste signal. */
export function recordFavoriteSignal(track: Track, added: boolean, explicitGenre?: string | null): void {
  if (!track.videoId || !track.title) return;
  const store = readTasteSignals();
  const delta = added ? 3.5 : -2.5;
  for (const a of track.artists) {
    if (a.name) addWeight(store.artists, a.name, delta);
  }
  const genre = explicitGenre ?? inferGenreSync(track);
  if (genre) addWeight(store.genres, genre, delta);
  writeTasteSignals(store);
}

/**
 * Computes the user's current music taste profile by fusing:
 * - Behavioral signals (play counts, full completions, early skips, recency decay)
 * - Explicit favorites
 * - User-created playlists
 * - Recent listening history
 */
export function computeTasteProfile(input: {
  recentTracks: readonly Track[];
  favorites?: readonly Track[];
  playlists?: ReadonlyArray<{ tracks: readonly Track[] }>;
  atDate?: Date;
}): TasteProfile {
  const signals = readTasteSignals();
  const artistWeights: Record<string, number> = { ...signals.artists };
  const genreWeights: Record<string, number> = { ...signals.genres };
  const skippedIds = new Set<string>();
  const favoriteIds = new Set<string>();
  const activeSlot = getHabitSlot(input.atDate);
  const slotBucket = signals.slots?.[activeSlot];
  const slotGenreWeights: Record<string, number> = { ...(slotBucket?.genres ?? {}) };
  const slotArtistWeights: Record<string, number> = { ...(slotBucket?.artists ?? {}) };

  let totalPlays = 0;
  let uniqueTracks = 0;
  for (const [id, sig] of Object.entries(signals.tracks)) {
    uniqueTracks++;
    totalPlays += Math.max(1, sig.plays);
    if (sig.earlySkips >= 2 && sig.completions === 0) {
      skippedIds.add(id);
    }
  }
  const discoveryOpenness = totalPlays > 0 ? Math.min(1, Math.max(0.15, uniqueTracks / totalPlays)) : 0.6;

  const momentumGenres: Record<string, number> = {};
  (signals.sessionGenres ?? []).forEach((g, idx) => {
    const decay = Math.max(0.25, 1 - idx * 0.14);
    momentumGenres[g] = Number(((momentumGenres[g] ?? 0) + decay).toFixed(2));
  });

  const now = (input.atDate ?? new Date()).getTime();
  const addTrackInfluence = (track: Track, baseWeight: number) => {
    const sig = signals.tracks[track.videoId];
    const ageDays = sig ? Math.max(0, (now - sig.lastPlayedAt) / 86_400_000) : 0;
    const decay = Math.exp(-ageDays / 14);
    const completionBonus = sig ? sig.completions * 1.2 - sig.earlySkips * 1.5 : 0;
    const total = Math.max(0.1, (baseWeight + completionBonus) * decay);

    for (const a of track.artists) {
      if (a.name) addWeight(artistWeights, a.name, total);
    }
    const g = inferGenreSync(track);
    if (g) addWeight(genreWeights, g, total);
  };

  for (const fav of input.favorites ?? []) {
    favoriteIds.add(fav.videoId);
    addTrackInfluence(fav, 3.0);
  }

  for (const pl of input.playlists ?? []) {
    for (const t of pl.tracks.slice(0, 60)) {
      addTrackInfluence(t, 1.6);
    }
  }

  input.recentTracks.forEach((t, idx) => {
    const recencyWeight = Math.max(0.4, 2.2 - idx * 0.08);
    addTrackInfluence(t, recencyWeight);
  });

  const genreDisplayNames = new Map<string, string>(
    GENRE_RULES.map((r) => [r.genre.toLowerCase(), r.genre]),
  );

  const topGenres = Object.entries(genreWeights)
    .filter(([, score]) => score > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([genreKey, score]) => ({
      genre: genreDisplayNames.get(genreKey) ?? genreKey.replace(/\b\w/g, (c) => c.toUpperCase()),
      score,
    }));

  const topArtists = Object.entries(artistWeights)
    .filter(([, score]) => score > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([artist, score]) => ({ artist, score }));

  const slotGenres = Object.entries(slotGenreWeights)
    .filter(([, score]) => score > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([genreKey, score]) => ({
      genre: genreDisplayNames.get(genreKey) ?? genreKey.replace(/\b\w/g, (c) => c.toUpperCase()),
      score,
    }));

  const slotArtists = Object.entries(slotArtistWeights)
    .filter(([, score]) => score > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([artist, score]) => ({ artist, score }));

  return {
    topGenres,
    topArtists,
    genreWeights,
    artistWeights,
    activeSlot,
    slotGenres,
    slotArtists,
    slotGenreWeights,
    slotArtistWeights,
    momentumGenres,
    discoveryOpenness,
    skippedIds,
    favoriteIds,
  };
}

/**
 * Scores a candidate track (0-100+) for precision ranking against:
 * - Current seed track & seed genre
 * - User's multi-signal taste profile (top genres, top artists, skip penalties)
 * - Track duration quality (penalizes short clips/snippets < 60s)
 */
export function scoreCandidate(
  candidate: Track,
  profile: TasteProfile,
  options?: {
    seedTrack?: Track | null;
    seedGenre?: string | null;
    candidateGenre?: string | null;
  },
): number {
  if (profile.skippedIds.has(candidate.videoId)) return -100;

  let score = 0;
  const candGenre = options?.candidateGenre ?? inferGenreSync(candidate);
  const seedGenre = options?.seedGenre;

  // 1. Seed genre alignment (highest priority for contextual radio/vibe)
  if (seedGenre && candGenre) {
    if (candGenre.toLowerCase() === seedGenre.toLowerCase()) {
      score += 36;
    } else if (
      (seedGenre === 'Bollywood' && candGenre === 'Indie / Acoustic') ||
      (seedGenre === 'Indie / Acoustic' && candGenre === 'Bollywood') ||
      (seedGenre === 'Punjabi' && candGenre === 'Desi Hip-Hop') ||
      (seedGenre === 'Desi Hip-Hop' && candGenre === 'Hip-Hop')
    ) {
      // Adjacent genre affinity
      score += 18;
    }
  }

  // 2. User's long-term genre taste + active time-of-day habit + live session momentum
  if (candGenre) {
    const gKey = candGenre.toLowerCase();
    const gw = profile.genreWeights[gKey] ?? 0;
    if (gw > 0) {
      score += Math.min(26, gw * 1.4);
    }
    const slotGw = profile.slotGenreWeights[gKey] ?? 0;
    if (slotGw > 0) {
      score += Math.min(18, slotGw * 1.6);
    }
    const momGw = profile.momentumGenres[gKey] ?? 0;
    if (momGw > 0) {
      score += Math.min(16, momGw * 5);
    }
  }

  // 3. Artist affinity (seed artist + user's favorite/replayed artists + time-of-day habit artists)
  const seedArtists = new Set((options?.seedTrack?.artists ?? []).map((a) => a.name.toLowerCase()));
  for (const a of candidate.artists) {
    const norm = a.name.toLowerCase();
    if (!norm) continue;
    if (seedArtists.has(norm)) score += 16;
    const aw = profile.artistWeights[norm] ?? 0;
    if (aw > 0) {
      score += Math.min(24, aw * 1.5);
    } else if (aw < 0) {
      score += Math.max(-25, aw * 2);
    }
    const slotAw = profile.slotArtistWeights[norm] ?? 0;
    if (slotAw > 0) {
      score += Math.min(12, slotAw * 1.4);
    }
  }

  // 4. Full-length track quality bonus / short-snippet penalty
  if (typeof candidate.durationSec === 'number' && candidate.durationSec > 0) {
    if (candidate.durationSec < 50) score -= 45;
    else if (candidate.durationSec >= 120 && candidate.durationSec <= 420) score += 6;
  }

  // 5. Artwork & favorite bonus
  if (candidate.thumbnail) score += 2;
  if (profile.favoriteIds.has(candidate.videoId)) score += 6;

  return Number(score.toFixed(2));
}
