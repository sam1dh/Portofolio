import { useEffect, useRef, useState } from 'react';

export type Station = 'chill' | 'focus' | 'jazzy';
export const STATION_LIST: Station[] = ['chill', 'focus', 'jazzy'];

// jamendo search tags for each station
const TAGS: Record<Station, string> = {
  chill: 'lofi chillout',
  focus: 'ambient downtempo',
  jazzy: 'jazz lounge',
};

export type Track = {
  id: string;
  title: string;
  artist: string;
  cover: string;
  audio: string;
  duration: number;
  url: string;
  license: string;
};

const CLIENT_ID = import.meta.env.PUBLIC_JAMENDO_CLIENT_ID as string | undefined;
const VOL_KEY = 'sameen-radio-vol';

async function fetchStation(station: Station): Promise<Track[]> {
  const key = `sameen-radio-${station}`;
  try {
    const hit = sessionStorage.getItem(key);
    if (hit) return JSON.parse(hit);
  } catch {}

  const params = new URLSearchParams({
    client_id: CLIENT_ID!,
    format: 'json',
    limit: '30',
    fuzzytags: TAGS[station],
    vocalinstrumental: 'instrumental',
    audioformat: 'mp32',
    imagesize: '300',
    groupby: 'artist_id',
    boost: 'popularity_month',
  });
  const res = await fetch(`https://api.jamendo.com/v3.0/tracks/?${params}`);
  if (!res.ok) throw new Error(String(res.status));
  const json = await res.json();
  if (json?.headers?.status !== 'success') throw new Error(json?.headers?.error_message || 'jamendo error');

  const list: Track[] = (json.results ?? [])
    .filter((t: any) => t.audio)
    .map((t: any) => ({
      id: String(t.id),
      title: t.name,
      artist: t.artist_name,
      cover: t.image || t.album_image || '',
      audio: t.audio,
      duration: Number(t.duration) || 0,
      url: t.shareurl,
      license: t.license_ccurl,
    }));

  // shuffle so every visit feels fresh
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  try {
    sessionStorage.setItem(key, JSON.stringify(list));
  } catch {}
  return list;
}

export function useRadio() {
  const audio = useRef<HTMLAudioElement | null>(null);
  const lists = useRef<Partial<Record<Station, Track[]>>>({});
  const list = useRef<Track[]>([]);
  const idx = useRef(0);
  const fails = useRef(0);
  const volRef = useRef(60);
  const nextRef = useRef<() => void>(() => {});

  const [station, setStationState] = useState<Station>('chill');
  const [track, setTrack] = useState<Track | null>(null);
  const [upNext, setUpNext] = useState<Track | null>(null);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vol, setVolState] = useState(60);

  useEffect(() => {
    try {
      const v = localStorage.getItem(VOL_KEY);
      if (v !== null) {
        const n = Math.max(0, Math.min(100, Number(v)));
        volRef.current = n;
        setVolState(n);
      }
    } catch {}
    return () => audio.current?.pause();
  }, []);

  // one audio element, created on first play
  const el = () => {
    if (!audio.current) {
      const a = new Audio();
      a.preload = 'none';
      a.addEventListener('play', () => setPlaying(true));
      a.addEventListener('pause', () => setPlaying(false));
      a.addEventListener('playing', () => {
        fails.current = 0;
        setError(null);
      });
      a.addEventListener('ended', () => nextRef.current());
      a.addEventListener('error', () => {
        fails.current += 1;
        if (fails.current > 3) {
          setError("couldn't play right now. try again later.");
          setPlaying(false);
          return;
        }
        nextRef.current(); // skip a track that won't load
      });
      audio.current = a;
    }
    audio.current.volume = volRef.current / 100;
    return audio.current;
  };

  const playAt = (i: number) => {
    const l = list.current;
    if (!l.length) return;
    const n = ((i % l.length) + l.length) % l.length;
    idx.current = n;
    setTrack(l[n]);
    setUpNext(l.length > 1 ? l[(n + 1) % l.length] : null);
    const a = el();
    a.src = l[n].audio;
    a.play().catch(() => setPlaying(false));
  };

  const load = async (s: Station) => {
    if (lists.current[s]?.length) return lists.current[s]!;
    if (!CLIENT_ID) {
      setError("music isn't set up yet.");
      return [];
    }
    setLoading(true);
    setError(null);
    try {
      const l = await fetchStation(s);
      lists.current[s] = l;
      if (!l.length) setError('no songs found right now.');
      return l;
    } catch {
      setError("couldn't reach the music library.");
      return [];
    } finally {
      setLoading(false);
    }
  };

  const toggle = async () => {
    const a = audio.current;
    if (a?.src) {
      if (a.paused) a.play().catch(() => {});
      else a.pause();
      return;
    }
    list.current = await load(station);
    playAt(0);
  };

  const next = () => playAt(idx.current + 1);
  nextRef.current = next;

  const prev = () => {
    const a = audio.current;
    if (a && a.currentTime > 3) {
      a.currentTime = 0;
      return;
    }
    playAt(idx.current - 1);
  };

  const duration = () => {
    const d = audio.current?.duration;
    return d && isFinite(d) ? d : (list.current[idx.current]?.duration ?? 0);
  };
  const time = () => audio.current?.currentTime ?? 0;

  const seek = (s: number) => {
    const a = audio.current;
    if (!a?.src) return;
    const d = duration();
    a.currentTime = Math.max(0, d ? Math.min(d - 1, s) : s);
  };
  const scrub = (delta: number) => seek(time() + delta);

  const setVol = (v: number) => {
    const n = Math.max(0, Math.min(100, Math.round(v)));
    volRef.current = n;
    setVolState(n);
    if (audio.current) audio.current.volume = n / 100;
    try {
      localStorage.setItem(VOL_KEY, String(n));
    } catch {}
  };

  const setStation = async (s: Station) => {
    setStationState(s);
    const l = await load(s);
    if (!l.length) return;
    list.current = l;
    playAt(0);
  };

  return {
    ready: !!CLIENT_ID,
    station,
    track,
    upNext,
    playing,
    loading,
    error,
    vol,
    toggle,
    next,
    prev,
    seek,
    scrub,
    setVol,
    setStation,
    time,
    duration,
  };
}

export type Radio = ReturnType<typeof useRadio>;
