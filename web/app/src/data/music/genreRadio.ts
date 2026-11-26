import type { Track } from '@/data/music/types';
import { searchExternalTracks } from '@/data/sources/externalSources';
import { type Candidate, extendStation, artistLine, isSameRecording } from '@/playback/queue/builder';
import { fetchRadio, searchSongs, searchMainVideos } from '@/data/music/api';

export interface GenreRadioResult {
  tracks: Track[];
  genre: string;
  sourceTitle: string;
}

const genreCache = new Map<string, string>();

/** Known artist and keyword heuristics for immediate fallback or enhancement. */
const GENRE_RULES: Array<{ genre: string; artists: string[]; keywords: string[] }> = [
  {
    genre: 'Bollywood',
    artists: [
      'arijit singh', 'pritam', 'shreya ghoshal', 'alka yagnik', 'kumar sanu',
      'udit narayan', 'sonu nigam', 'lata mangeshkar', 'kishore kumar', 'atif aslam',
      'badshah', 'kk', 'sachin-jigar', 'vishal-shekhar', 'a.r. rahman', 'ar rahman',
      'sunidhi chauhan', 'mohit chauhan', 'jubin nautiyal', 'darshan raval', 'anuv jain',
      'prateek kuhad', 'mithoon', 'amit trivedi', 'shankar-ehsaan-loy', 'himesh reshammiya',
      'mohammed rafi', 'asha bhosle', 'neha kakkar', 'tony kakkar', 'armaan malik',
      'amaal mallik', 'arijit', 'shreya', 'sonu', 'udit', 'sanur', 'arijit',
    ],
    keywords: [
      'bollywood', 'hindi', 'soundtrack', 'channa mereya', 'tum hi ho', 'kesariya',
      'dil', 'ishq', 'pyaar', 'mohabbat', 'tere bina', 'humdum', 'aashiqui',
    ],
  },
  {
    genre: 'Punjabi',
    artists: [
      'sidhu moose wala', 'diljit dosanjh', 'karan aujla', 'ap dhillon', 'shubh',
      'honey singh', 'yo yo honey singh', 'guru randhawa', 'b praak', 'jaani',
      'jassie gill', 'amrinder gill', 'parmish verma', 'gippy grewal', 'babbu maan',
      'ammy virk', 'harrdy sandhu', 'gurdas maan', 'prophec', 'mickey singh',
    ],
    keywords: ['punjabi', 'jatt', 'pind', 'mutiyar', 'bhangra', 'patola', 'soorme'],
  },
  {
    genre: 'Dance / EDM',
    artists: [
      'super eurobeat', 'eurobeat', 'leslie parrish', 'dave rodgers', 'avicii',
      'martin garrix', 'david guetta', 'alan walker', 'marshmello', 'skrillex',
      'the chainsmokers', 'calvin harris', 'tiësto', 'tiesto', 'kygo', 'alesso',
      'hardwell', 'armin van buuren', 'zedd', 'swedish house mafia', 'dj snake',
      'deadmau5', 'afrojack', 'major lazer', 'steve aoki', 'kaskade',
    ],
    keywords: ['eurobeat', 'remix', 'club mix', 'edm', 'dance', 'techno', 'house mix', 'trance'],
  },
  {
    genre: 'Rock',
    artists: [
      'linkin park', 'queen', 'coldplay', 'metallica', 'nirvana', 'ac/dc',
      'guns n\' roses', 'green day', 'imagine dragons', 'pink floyd', 'radiohead',
      'arctic monkeys', 'foo fighters', 'red hot chili peppers', 'bon jovi',
      'aerosmith', 'led zeppelin', 'the beatles', 'u2', 'muse', 'oasis', 'twenty one pilots',
    ],
    keywords: ['rock', 'metal', 'hard rock', 'grunge', 'alternative rock', 'punk'],
  },
  {
    genre: 'Hip-Hop',
    artists: [
      'eminem', 'drake', 'kendrick lamar', 'travis scott', 'kanye west',
      'j. cole', '2pac', 'notorious b.i.g.', 'snoop dogg', 'divine', 'kr$na',
      'krsna', 'seedhe maut', 'raftaar', 'mc stan', 'emiway bantai', 'badshah',
      'lil wayne', 'future', 'metro boomin', 'post malone', 'jack harlow', 'cardi b',
    ],
    keywords: ['hip-hop', 'rap', 'trap', 'drill', 'freestyle', 'cypher'],
  },
  {
    genre: 'Pop',
    artists: [
      'taylor swift', 'ed sheeran', 'ariana grande', 'billie eilish', 'dua lipa',
      'justin bieber', 'the weeknd', 'bruno mars', 'adele', 'rihanna', 'katy perry',
      'olivia rodrigo', 'harry styles', 'shawn mendes', 'selena gomez', 'charlie puth',
      'lady gaga', 'sza', 'sabrina carpenter', 'chappell roan', 'miley cyrus',
    ],
    keywords: ['pop', 'hits', 'acoustic pop'],
  },
  {
    genre: 'Lo-Fi',
    artists: ['chilledcow', 'lofi girl', 'potsu', 'kupla', 'jinsang', ' idealism'],
    keywords: ['lo-fi', 'lofi', 'chillhop', 'study beats', 'relaxing beats', 'sleep lofi'],
  },
  {
    genre: 'K-Pop',
    artists: [
      'bts', 'blackpink', 'twice', 'newjeans', 'stray kids', 'seventeen',
      'txt', 'enhypen', 'exo', 'red velvet', 'aespa', 'ive', 'le sserafim',
    ],
    keywords: ['k-pop', 'kpop'],
  },
  {
    genre: 'Anime / J-Pop',
    artists: ['yoasobi', 'kenshi yonezu', 'radwimps', 'lisa', 'ado', 'eve', 'aimer', 'official hige dandism'],
    keywords: ['anime', 'ost', 'opening', 'ending', 'j-pop', 'jpop'],
  },
];

function cleanString(str: string): string {
  return str
    .toLowerCase()
    .replace(/\(.*?\)/g, '')
    .replace(/\[.*?\]/g, '')
    .replace(/[^a-z0-9\s]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Detect the musical genre of a track using iTunes Music API with local rule fallbacks.
 */
export async function detectTrackGenre(seed: Track): Promise<string> {
  const cacheKey = `${seed.title.trim().toLowerCase()}__${artistLine(seed).trim().toLowerCase()}`;
  const cached = genreCache.get(cacheKey);
  if (cached) return cached;

  const rawTitle = seed.title.toLowerCase();
  const rawArtist = artistLine(seed).toLowerCase();

  // Step 1: Quick check with local heuristic taxonomy
  for (const rule of GENRE_RULES) {
    if (rule.artists.some((a) => rawArtist.includes(a))) {
      genreCache.set(cacheKey, rule.genre);
      return rule.genre;
    }
    if (rule.keywords.some((kw) => rawTitle.includes(kw))) {
      genreCache.set(cacheKey, rule.genre);
      return rule.genre;
    }
  }

  // Step 2: Query iTunes Search API (fast, authoritative, 2.5s timeout)
  try {
    const cleanedTitle = cleanString(seed.title);
    const primaryArtist = cleanString(seed.artists[0]?.name ?? '');
    const term = encodeURIComponent(`${cleanedTitle} ${primaryArtist}`.trim());
    if (term) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 2500);
      const res = await fetch(`https://itunes.apple.com/search?term=${term}&media=music&entity=song&limit=1`, {
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (res.ok) {
        const data = (await res.json()) as { results?: Array<{ primaryGenreName?: string }> };
        const genreName = data.results?.[0]?.primaryGenreName;
        if (genreName) {
          const mapped = mapItunesGenre(genreName);
          genreCache.set(cacheKey, mapped);
          return mapped;
        }
      }
    }
  } catch {
    // Timeout or network error; fall through to fallback
  }

  // Step 3: Default fallback
  const fallback = seed.artists[0]?.name ? `${seed.artists[0].name} Style` : 'Similar Music';
  genreCache.set(cacheKey, fallback);
  return fallback;
}

function mapItunesGenre(raw: string): string {
  const lower = raw.toLowerCase();
  if (lower.includes('bollywood') || lower.includes('indian') || lower.includes('hindi')) return 'Bollywood';
  if (lower.includes('punjabi')) return 'Punjabi';
  if (lower.includes('dance') || lower.includes('electronic') || lower.includes('house') || lower.includes('techno')) {
    return 'Dance / EDM';
  }
  if (lower.includes('hip-hop') || lower.includes('rap') || lower.includes('trap')) return 'Hip-Hop';
  if (lower.includes('rock') || lower.includes('metal') || lower.includes('punk') || lower.includes('grunge')) {
    return 'Rock';
  }
  if (lower.includes('pop') || lower.includes('teen pop')) return 'Pop';
  if (lower.includes('r&b') || lower.includes('soul') || lower.includes('funk')) return 'R&B / Soul';
  if (lower.includes('soundtrack') || lower.includes('score')) return 'Soundtrack';
  if (lower.includes('country')) return 'Country';
  if (lower.includes('classical')) return 'Classical';
  if (lower.includes('jazz') || lower.includes('blues')) return 'Jazz';
  if (lower.includes('folk') || lower.includes('acoustic')) return 'Acoustic / Folk';
  return raw;
}

/**
 * Automatically fetch and queue tracks matching the same genre and vibe as the seed track.
 * Uses a multi-tier fallback architecture:
 * Tier 1: YouTube Music Up Next Radio
 * Tier 2: YouTube Music Songs shelf by genre & artist
 * Tier 3: General YouTube Video search for top genre hits
 */
export async function fetchSameGenreTracks(
  seed: Track,
  currentQueue: readonly Track[],
  needed: number,
): Promise<GenreRadioResult> {
  const genre = await detectTrackGenre(seed);
  const artist = seed.artists[0]?.name ?? '';
  const candidates: Candidate[] = [];
  let seedIsVideo = false;

  // Tier 1: Try official YouTube Music Radio
  try {
    const radio = await fetchRadio(seed.videoId);
    seedIsVideo = radio.seedIsVideo;
    candidates.push(...radio.candidates);
  } catch {
    // Radio unavailable or rate-limited; proceed to Tier 2
  }

  // Tier 2: Search for same-genre tracks if radio returned too few
  if (candidates.length < needed * 2) {
    const searchQueries: string[] = [];
    if (artist && genre !== 'Similar Music' && !genre.endsWith('Style')) {
      searchQueries.push(`${artist} ${genre}`);
      searchQueries.push(`${genre} hit songs`);
    } else if (artist) {
      searchQueries.push(`${artist} hit songs`);
      searchQueries.push(`${seed.title} radio mix`);
    } else {
      searchQueries.push(`${genre} hits`);
    }

    const searchResults = await Promise.allSettled(
      searchQueries.map(async (query) => {
        try {
          const songs = await searchSongs(query);
          if (songs.length) return songs;
        } catch {
          // ignore
        }
        try {
          return await searchMainVideos(query);
        } catch {
          return [];
        }
      }),
    );

    for (const res of searchResults) {
      if (res.status === 'fulfilled' && Array.isArray(res.value)) {
        for (const track of res.value) {
          if (!candidates.some((c) => isSameRecording(c.track, track))) {
            candidates.push({ track, isVideo: false });
          }
        }
      }
    }
  }

  // Filter and deduplicate against existing queue using extendStation
  const extended = extendStation(currentQueue, candidates, needed, seedIsVideo);

  // If still empty (e.g., YouTube blocked or highly restrictive filters), fall back to external sources + broad video search
  if (!extended.length) {
    try {
      const fallbackQuery = artist ? `${artist} ${genre !== 'Similar Music' ? genre : 'songs'}` : `${seed.title} mix`;
      const [externalRes, videoRes] = await Promise.allSettled([
        searchExternalTracks(fallbackQuery, needed * 2),
        searchMainVideos(fallbackQuery),
      ]);
      const fallbackCandidates: Candidate[] = [];
      if (externalRes.status === 'fulfilled') {
        fallbackCandidates.push(...externalRes.value.map((t) => ({ track: t, isVideo: false })));
      }
      if (videoRes.status === 'fulfilled') {
        fallbackCandidates.push(...videoRes.value.map((t) => ({ track: t, isVideo: false })));
      }
      const fallbackExtended = extendStation(currentQueue, fallbackCandidates, needed, seedIsVideo);
      extended.push(...fallbackExtended);
    } catch {
      // ignore
    }
  }

  const sourceTitle = genre.endsWith('Style') || genre === 'Similar Music'
    ? `${artist || seed.title} Radio`
    : `${genre} Radio • ${seed.title}`;

  return {
    tracks: extended,
    genre,
    sourceTitle,
  };
}
