import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react';
import type { Contributions } from '../../lib/github';
import { SITE } from '../../data/site';

const W = 1280; // design width
const H = 800; // design height
const PANEL_H = 138; // desk front, from under the desk top to the bottom of the screen
const INK = '#1E1A3A';
const line = 'border-[1.5px] border-ink';
const tip =
  'pointer-events-none absolute z-20 whitespace-nowrap rounded-md bg-ink px-2 py-0.5 font-mono text-[13px] text-win opacity-0 transition-opacity group-hover:opacity-100';

type Props = {
  running: boolean;
  onRun: () => void;
  speaking: boolean;
  screen: ReactNode;
  contributions: Contributions;
};

const box = (left: number, top: number, width: number, height: number, extra: CSSProperties = {}): CSSProperties => ({
  position: 'absolute',
  left,
  top,
  width,
  height,
  ...extra,
});

const HEAT = ['#3C3489', '#534AB7', '#7F77DD', '#5DCAA5', '#9FE1CB'];
const BAR_COLORS = ['#AFA9EC', '#9FE1CB', '#F4C0D1', '#FAC775', '#B5D4F4'];
const BARS = Array.from({ length: 22 }, (_, i) => ({
  c: BAR_COLORS[i % BAR_COLORS.length],
  d: `${(0.3 + ((i * 7) % 5) * 0.08).toFixed(2)}s`,
  h: `${50 + ((i * 37) % 50)}%`,
}));

const HEX_COLORS = ['#AFA9EC', '#F4C0D1', '#9FE1CB', '#FAC775', '#B5D4F4', '#F0997B'];
const HEX_POINTS = [
  '40,8 59,19 59,41 40,52 21,41 21,19',
  '78,30 97,41 97,63 78,74 59,63 59,41',
  '40,52 59,63 59,85 40,96 21,85 21,63',
  '108,52 127,63 127,85 108,96 89,85 89,63',
  '78,62 97,73 97,95 78,106 59,95 59,73',
];
const HEX_GLOW = [
  [40, 30, 30],
  [78, 52, 30],
  [40, 74, 30],
  [108, 74, 26],
  [78, 84, 28],
];

const BADGES = [
  { id: 'sih', color: '#F4C0D1', tilt: -18, label: 'Smart India Hackathon · internal round winner' },
  { id: 'snd', color: '#9FE1CB', tilt: 0, label: 'SanDisk hackathon · finalist' },
  { id: 'blo', color: '#FAC775', tilt: 16, label: 'Blostem AI Builder · 3rd of 650+ teams' },
];

const FACTS = [
  'won a debate competition. will also win the tabs vs spaces argument.',
  '3rd of 650+ teams at a hackathon. the other 647 were great too.',
  'cgpa 9.13. the .13 took the most effort.',
  '3 internships before final year. sleep schedule: in code review.',
  "i debug by explaining bugs to the rubber duck. it hasn't failed me yet.",
  'first prize in public speaking, zero stage fright. ask me to demo.',
];
const LOCKED = [
  'nice try. this drawer is personal.',
  "still locked. it's mostly snacks.",
  'ok fine: snacks and half-built side projects.',
  'access requires one (1) job offer.',
];
const HEARD = ['heard: “hire sameen”', 'heard: “ship it”', 'heard: “one more feature”', 'heard: “it works on my machine”'];

// acoustic foam panels behind everything
const FOAM =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='56'%3E%3Crect x='1' y='1' width='54' height='54' rx='3' fill='%23C7BFEE' stroke='%23B4ACE8' stroke-width='1.5'/%3E%3Cpath d='M1 12h54M1 24h54M1 36h54M1 48h54' stroke='%23BBB3EB' stroke-width='2'/%3E%3C/svg%3E\")";

const pad = (n: number) => String(n).padStart(2, '0');

function puneParts(d: Date) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(d);
  const h = Number(parts.find((p) => p.type === 'hour')?.value ?? 0) % 24;
  const m = Number(parts.find((p) => p.type === 'minute')?.value ?? 0);
  return { h, m };
}

// what i'm probably doing right now, by pune time
function status(h: number) {
  if (h < 6) return 'asleep (probably)';
  if (h < 9) return 'chai + inbox';
  if (h < 13) return 'deep work';
  if (h < 14) return 'lunch break';
  if (h < 19) return 'shipping things';
  if (h < 23) return 'side projects';
  return 'one more commit';
}

function Stage({ s, front, children }: { s: number; front?: boolean; children: ReactNode }) {
  return (
    <div
      className={`absolute bottom-0 left-1/2 ${front ? 'pointer-events-none' : ''}`}
      style={{ width: W, height: H, transform: `translateX(-50%) scale(${s})`, transformOrigin: '50% 100%' }}
    >
      {children}
    </div>
  );
}

export default function DeskScene({ running, onRun, speaking, screen, contributions }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [s, setS] = useState(0);
  const [now, setNow] = useState<Date | null>(null);
  const [tok, setTok] = useState(40);

  // interactive state
  const [quack, setQuack] = useState(false);
  const [hoverBar, setHoverBar] = useState<number | null>(null);
  const [voice, setVoice] = useState<string | null>(null);
  const [clockMode, setClockMode] = useState(0);
  const [hex, setHex] = useState([0, 1, 2, 3, 4]);
  const [badge, setBadge] = useState<string | null>(null);
  const [micOn, setMicOn] = useState(false);
  const [music, setMusic] = useState(0); // 0 = off, otherwise a counter so notes replay
  const [fact, setFact] = useState<number | null>(null);
  const [deny, setDeny] = useState<number | null>(null);

  // timers, with tokens so overlapping clicks don't cut each other short
  const timers = useRef<number[]>([]);
  const tokens = useRef({ voice: 0, mic: 0, music: 0, fact: 0, deny: 0, quack: 0 });
  const counts = useRef({ fact: 0, deny: 0, heard: 0 });
  const later = (key: keyof typeof tokens.current, fn: () => void, ms: number) => {
    const t = ++tokens.current[key];
    timers.current.push(
      window.setTimeout(() => {
        if (tokens.current[key] === t) fn();
      }, ms),
    );
  };
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const say = (text: string, ms: number) => {
    setVoice(text);
    later('voice', () => setVoice(null), ms);
  };

  // scale the room to fit the screen
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => {
      const r = el.getBoundingClientRect();
      setS(Math.min(r.width / W, r.height / H));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 20_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setTok(38 + Math.round(Math.random() * 8)), 700);
    return () => clearInterval(id);
  }, [running]);

  // clock: pune time → your time → what i'm probably doing
  const pune = now ? puneParts(now) : null;
  const shown = clockMode === 1 && now ? { h: now.getHours(), m: now.getMinutes() } : pune;
  const clockSub = clockMode === 0 ? 'pune · ist' : clockMode === 1 ? 'your time' : pune ? status(pune.h) : '';

  const talking = speaking || voice !== null;
  const caption = voice ?? (speaking ? 'speaking' : hoverBar !== null ? 'tuning…' : 'idle');

  const barStyle = (b: (typeof BARS)[number], i: number): CSSProperties => {
    const base = { background: b.c, '--d': b.d, '--h': b.h } as CSSProperties;
    if (!talking && hoverBar !== null) {
      const d = i - hoverBar;
      return { ...base, height: `${Math.round(16 + 80 * Math.exp(-(d * d) / 8))}%`, transition: 'height .12s' };
    }
    return { ...base, height: '14%', transition: 'height .3s' };
  };

  const listen = () => {
    setMicOn(true);
    later('mic', () => setMicOn(false), 2600);
    say(HEARD[counts.current.heard++ % HEARD.length], 2600);
  };

  const playMusic = () => {
    setMusic((m) => m + 1);
    later('music', () => setMusic(0), 2800);
    say('now playing: lo-fi to debug to', 2800);
  };

  const openFact = () => {
    setFact(counts.current.fact++ % FACTS.length);
    later('fact', () => setFact(null), 4500);
  };

  const tryLocked = () => {
    setDeny(counts.current.deny++);
    later('deny', () => setDeny(null), 2600);
  };

  const ducky = () => {
    setQuack(true);
    later('quack', () => setQuack(false), 1800);
  };

  const onKey = (fn: () => void) => (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fn();
    }
  };

  return (
    <div
      ref={ref}
      className="relative h-full w-full overflow-hidden bg-wall transition-opacity duration-500"
      style={{ opacity: s ? 1 : 0, backgroundImage: FOAM }}
    >
      {/* desk front and desk top stretch the full width */}
      <div className="absolute inset-x-0 bottom-0 border-t-[1.5px] border-ink bg-[#F3E1C7]" style={{ height: PANEL_H * s }} />
      <div className="absolute inset-x-0 border-y-[1.5px] border-ink bg-peach" style={{ bottom: PANEL_H * s, height: 22 * s }} />

      {/* back: the room */}
      <Stage s={s}>
        {/* github heatmap: hangs from a nail, swings on hover, opens github */}
        <a href={SITE.github} target="_blank" rel="noopener" aria-label="My GitHub profile" className="hang heat group" style={box(36, 22, 250, 142)}>
          <svg style={box(0, 0, 250, 40)} aria-hidden="true">
            <path d="M125 6 L22 38 M125 6 L228 38" stroke={INK} strokeWidth="1.2" fill="none" />
            <circle cx="125" cy="6" r="4" fill="#FCFBFF" stroke={INK} strokeWidth="1.5" />
          </svg>
          <span className="absolute left-0 top-[34px] block w-[250px] rounded-md border-[3px] border-win bg-[#26215C] px-2.5 py-2 outline outline-[1.5px] outline-ink">
            <span className="mb-1.5 flex justify-between font-mono text-[12px]">
              <span className="text-[#CECBF6]">github · past year</span>
              {contributions.total > 0 && <span className="text-[#9FE1CB]">{contributions.total.toLocaleString('en-IN')}</span>}
            </span>
            <span className="grid grid-flow-col gap-[2px]" style={{ gridTemplateRows: 'repeat(7, 6px)', gridAutoColumns: '6px' }}>
              {contributions.weeks.flatMap((w, i) =>
                w.map((lvl, j) => (
                  <span key={`${i}-${j}`} className="cell rounded-[1px]" style={{ background: HEAT[lvl], '--c': i } as CSSProperties} />
                )),
              )}
            </span>
          </span>
          <span className={`${tip} -bottom-7 left-0`}>open my github ↗</span>
        </a>

        {/* hackathon lanyards: each card swings on its own */}
        <div style={box(306, 30, 90, 150)}>
          <span className={`${line} absolute left-[40px] top-0 size-2.5 rounded-full bg-win`} />
          {BADGES.map((b) => (
            <div key={b.id} className="hang pointer-events-none absolute left-[28px] top-[8px] h-[100px] w-[34px]">
              <div className="h-full w-full" style={{ rotate: `${b.tilt}deg`, transformOrigin: '50% 0' }}>
                <span className="absolute left-1/2 top-0 h-[46px] w-[1.3px] -translate-x-1/2 bg-ink" />
                <span
                  onMouseEnter={() => setBadge(b.label)}
                  onMouseLeave={() => setBadge(null)}
                  className={`${line} pointer-events-auto absolute left-0 top-[46px] flex h-[44px] w-[34px] cursor-default flex-col items-center rounded`}
                  style={{ background: b.color }}
                >
                  <span className="mt-1 h-1.5 w-3 rounded-full border border-ink bg-win" />
                  <span className="mt-1 font-mono text-[12px] text-ink">{b.id}</span>
                </span>
              </div>
            </div>
          ))}
          {badge && (
            <span className="absolute left-0 top-[104px] z-20 whitespace-nowrap rounded-md bg-ink px-2 py-0.5 font-mono text-[13px] text-win">
              {badge}
            </span>
          )}
        </div>

        {/* voice waveform: follows the cursor, speaks on click */}
        <div style={box(430, 0, 330, 160)}>
          <svg style={box(0, 0, 330, 52)} aria-hidden="true">
            <line x1="50" y1="0" x2="50" y2="52" stroke={INK} strokeWidth="1.3" />
            <line x1="280" y1="0" x2="280" y2="52" stroke={INK} strokeWidth="1.3" />
          </svg>
          <div
            role="button"
            tabIndex={0}
            aria-label="Voice waveform, click to hear a hello"
            onClick={() => say('hey there, welcome in!', 2200)}
            onKeyDown={onKey(() => say('hey there, welcome in!', 2200))}
            onMouseMove={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              setHoverBar(((e.clientX - r.left) / r.width) * BARS.length);
            }}
            onMouseLeave={() => setHoverBar(null)}
            className={`absolute left-0 top-[50px] flex h-[80px] w-[330px] cursor-pointer items-end gap-[5px] rounded-xl border-[1.5px] border-ink bg-[#26215C] px-4 py-3 ${
              talking ? 'talking' : ''
            }`}
          >
            {BARS.map((b, i) => (
              <i key={i} className="bar flex-1 rounded-t-[3px]" style={barStyle(b, i)} />
            ))}
          </div>
          <span className="absolute left-[44px] top-[136px] font-mono text-[13px] text-sub">voice_agent · {caption}</span>
        </div>

        {/* led clock: click to cycle */}
        <button
          type="button"
          onClick={() => setClockMode((c) => (c + 1) % 3)}
          aria-label="Clock, click to change what it shows"
          className="group"
          style={box(820, 46, 170, 72)}
        >
          <span className="absolute inset-0 flex flex-col items-center justify-center rounded-xl border-[1.5px] border-ink bg-[#26215C]">
            <span key={clockMode} className="rise font-mono text-[30px] font-medium leading-none tracking-[3px] text-[#9FE1CB]">
              {shown ? pad(shown.h) : '--'}
              <span className="colon">:</span>
              {shown ? pad(shown.m) : '--'}
            </span>
            <span className="mt-1 font-mono text-[13px] text-[#AFA9EC]">{clockSub}</span>
          </span>
          <span className={`${tip} -bottom-8 right-0`}>click to switch</span>
        </button>

        {/* hex lights: click a panel to change its color */}
        <svg style={box(36, 232, 250, 196)} viewBox="0 0 140 110" role="group" aria-label="Hex lights, click a panel to change its color">
          <g stroke={INK} strokeWidth="1.5">
            {HEX_POINTS.map((p, i) => (
              <polygon
                key={i}
                points={p}
                className="hexp"
                fill={HEX_COLORS[hex[i] % HEX_COLORS.length]}
                onClick={() => setHex((h) => h.map((v, j) => (j === i ? v + 1 : v)))}
              />
            ))}
          </g>
        </svg>

        {/* mic: click to "talk" to the voice agent */}
        <button type="button" onClick={listen} aria-label="Microphone, click to talk to my voice agent" className="group" style={box(70, 430, 200, 210)}>
          <svg
            style={box(0, 0, 200, 210)}
            viewBox="0 0 110 116"
            className="transition-transform duration-200 group-hover:-translate-y-1"
            aria-hidden="true"
          >
            <path d="M62 114 V98 L30 60 L48 28" fill="none" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
            <circle cx="30" cy="60" r="3.5" fill="#FCFBFF" stroke={INK} strokeWidth="1.5" />
            <rect x="52" y="96" width="20" height="10" fill="#FCFBFF" stroke={INK} strokeWidth="1.5" />
            {micOn && (
              <>
                <circle className="ring" cx="48" cy="21" r="16" fill="none" stroke="#5DCAA5" strokeWidth="1.5" />
                <circle className="ring" style={{ animationDelay: '0.5s' }} cx="48" cy="21" r="16" fill="none" stroke="#5DCAA5" strokeWidth="1.5" />
              </>
            )}
            <rect
              x="36"
              y="2"
              width="24"
              height="38"
              rx="12"
              fill={micOn ? '#9FE1CB' : '#CECBF6'}
              stroke={INK}
              strokeWidth="1.5"
              transform="rotate(20 48 21)"
            />
          </svg>
          <span className={`${tip} left-[110px] top-0`}>{micOn ? 'listening…' : 'click to talk'}</span>
        </button>

        {/* headphones: hang from a hook, swing, play on click */}
        <span className={`${line} bg-win`} style={box(1046, 330, 16, 26, { borderRadius: 3 })} />
        <button
          type="button"
          onClick={playMusic}
          aria-label="Headphones, click to see what I code to"
          className={`hang group ${music ? 'go' : ''}`}
          style={box(1010, 350, 90, 120)}
        >
          <svg width="90" height="120" viewBox="0 0 60 80" aria-hidden="true">
            <path d="M10 42 V26 a20 20 0 0 1 40 0 V42" fill="none" stroke={INK} strokeWidth="3" />
            <rect x="4" y="36" width="13" height="22" rx="5" fill="#ED93B1" stroke={INK} strokeWidth="1.5" />
            <rect x="43" y="36" width="13" height="22" rx="5" fill="#ED93B1" stroke={INK} strokeWidth="1.5" />
          </svg>
          {music > 0 &&
            ['♪', '♫', '♪'].map((n, i) => (
              <span
                key={`${music}-${i}`}
                className="note absolute font-mono text-xl text-accent"
                style={{ left: 14 + i * 22, top: 4, animationDelay: `${i * 0.25}s`, '--x': `${(i - 1) * 14}px` } as CSSProperties}
                aria-hidden="true"
              >
                {n}
              </span>
            ))}
          <span className={`${tip} -bottom-7 right-0`}>{music ? 'now playing: lo-fi to debug to' : 'click me'}</span>
        </button>

        {/* keyboard: keys press on hover */}
        <div className="kbd" style={box(320, 610, 210, 30)} aria-hidden="true">
          <span className={`${line} absolute inset-x-0 bottom-0 top-[8px] rounded-[6px_6px_3px_3px] bg-win`} />
          <span className="absolute inset-x-[10px] top-0 flex h-[14px] gap-[3px]">
            {Array.from({ length: 12 }, (_, i) => (
              <span
                key={i}
                className="key flex-1 rounded-[3px] border border-ink"
                style={
                  {
                    background: i === 5 || i === 6 ? '#FAC775' : i % 4 === 0 ? '#F4C0D1' : '#CECBF6',
                    '--i': `${((i * 5) % 7) * 0.06}s`,
                  } as CSSProperties
                }
              />
            ))}
          </span>
        </div>
        <span className={`${line} bg-win`} style={box(760, 622, 26, 18, { borderRadius: '13px 13px 5px 5px' })} />

        {/* </> mug */}
        <div className="group" style={box(840, 576, 46, 64)}>
          <svg style={box(2, -40, 42, 36)} viewBox="0 0 26 22" aria-hidden="true">
            <path className="steam" d="M6 20c-3-4 3-6 0-9s3-6 0-9" fill="none" stroke={INK} strokeWidth="1.3" />
            <path className="steam" style={{ animationDelay: '0.8s' }} d="M13 20c-3-4 3-6 0-9s3-6 0-9" fill="none" stroke={INK} strokeWidth="1.3" />
            <path className="steam" style={{ animationDelay: '1.6s' }} d="M20 20c-3-4 3-6 0-9s3-6 0-9" fill="none" stroke={INK} strokeWidth="1.3" />
          </svg>
          <div className={`${line} grid h-full w-full place-items-center bg-[#26215C] font-mono text-[13px] text-[#9FE1CB]`} style={{ borderRadius: '3px 3px 12px 12px' }}>
            {'</>'}
          </div>
          <div className={`${line} border-l-0`} style={box(46, 12, 16, 24, { borderRadius: '0 12px 12px 0' })} />
          <span className={`${tip} -top-14 left-0`}>fuel: chai</span>
        </div>

        {/* left drawer: fun facts */}
        <div className="bg-ink/40" style={box(40, 684, 380, 14, { borderRadius: 6 })} aria-hidden="true" />
        <button
          type="button"
          onClick={openFact}
          aria-label="Drawer of fun facts"
          className="text-left"
          style={box(40, 684, 380, 74, { translate: fact !== null ? '0 10px' : '0 0', transition: 'translate .3s cubic-bezier(.3,1.4,.5,1)' })}
        >
          <span className={`${line} absolute inset-0 rounded-lg bg-peach`} />
          {fact === null ? (
            <>
              <span className="absolute left-4 top-3 font-mono text-[13px] text-sub">fun_facts/</span>
              <span className={`${line} absolute left-1/2 top-1/2 h-3 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full bg-win`} />
              <span className="absolute bottom-2.5 right-4 font-mono text-[12px] text-sub">pull ↓</span>
            </>
          ) : (
            <span key={fact} className="rise absolute inset-0 flex items-center px-5 font-mono text-[14px] leading-snug text-ink" aria-live="polite">
              {FACTS[fact]}
            </span>
          )}
        </button>

        {/* right drawer: locked */}
        <button type="button" onClick={tryLocked} aria-label="A locked private drawer" className="text-left" style={box(860, 684, 380, 74)}>
          <span key={deny ?? 'idle'} className={`absolute inset-0 ${deny !== null ? 'shake' : ''}`}>
            <span className={`${line} absolute inset-0 rounded-lg bg-peach`} />
            {deny === null ? (
              <>
                <span className="absolute left-4 top-3 font-mono text-[13px] text-sub">private/</span>
                <span className={`${line} absolute left-1/2 top-1/2 h-3 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full bg-win`} />
                <svg className="absolute bottom-2.5 right-4" width="16" height="18" viewBox="0 0 16 18" aria-hidden="true">
                  <rect x="1.5" y="8" width="13" height="9" rx="2" fill="#FAC775" stroke={INK} strokeWidth="1.3" />
                  <path d="M4.5 8V5.5a3.5 3.5 0 0 1 7 0V8" fill="none" stroke={INK} strokeWidth="1.3" />
                </svg>
              </>
            ) : (
              <span className="absolute inset-0 flex items-center px-5 font-mono text-[14px] leading-snug text-ink" aria-live="polite">
                {LOCKED[Math.min(deny, LOCKED.length - 1)]}
              </span>
            )}
          </span>
        </button>
      </Stage>

      {/* running a model dims the room */}
      <div className="pointer-events-none absolute inset-0 bg-[rgb(20_16_44/0.5)] transition-opacity duration-500" style={{ opacity: running ? 1 : 0 }} />

      {/* front: glow, the PC, the duck and the AI box */}
      <Stage s={s} front>
        <svg style={box(36, 232, 250, 196)} viewBox="0 0 140 110" aria-hidden="true">
          <g style={{ opacity: running ? 0.55 : 0, transition: 'opacity 0.5s' }}>
            {HEX_GLOW.map(([cx, cy, r], i) => (
              <circle key={i} cx={cx} cy={cy} r={r} fill={HEX_COLORS[hex[i] % HEX_COLORS.length]} />
            ))}
          </g>
        </svg>

        {/* the PC: 398 screen + 56 neck + 20 foot = rests exactly on the desk */}
        <div className="pointer-events-auto" style={box(300, 166, 680, 474)}>
          <div className={`${line} h-[398px] rounded-[20px] bg-win p-[18px]`}>
            <div data-screen className={`${line} h-full overflow-hidden rounded-lg bg-win`}>
              {screen}
            </div>
          </div>
          <div className="mx-auto h-14 w-14 border-x-[1.5px] border-ink bg-win" />
          <div className={`${line} mx-auto h-5 w-[200px] rounded-t-md bg-win`} />

          {/* rubber duck */}
          <button type="button" onClick={ducky} aria-label="Rubber duck" className="absolute -top-[42px] right-10" style={{ width: 52, height: 44 }}>
            <svg className="wobble" width="52" height="44" viewBox="0 0 30 26" aria-hidden="true">
              <ellipse cx="14" cy="18" rx="12" ry="7" fill="#FAC775" stroke={INK} strokeWidth="1.3" />
              <circle cx="20" cy="9" r="6" fill="#FAC775" stroke={INK} strokeWidth="1.3" />
              <path d="M25 9 l5 1 -5 2z" fill="#F0997B" stroke={INK} strokeWidth="1" />
              <circle cx="21" cy="8" r="1.2" fill={INK} />
            </svg>
            <span
              className={`pointer-events-none absolute -top-8 right-0 whitespace-nowrap rounded-md bg-ink px-2 py-0.5 font-mono text-[13px] text-win transition-opacity ${
                quack ? 'opacity-100' : 'opacity-0'
              }`}
              aria-live="polite"
            >
              {quack ? 'quack. did you check the logs?' : ''}
            </span>
          </button>
        </div>

        {/* mini AI box: click to run a model (the room's night mode) */}
        <button
          type="button"
          onClick={onRun}
          aria-pressed={running}
          aria-label={running ? 'Stop the model' : 'Run a model on my AI box'}
          className="group pointer-events-auto"
          style={box(990, 512, 170, 128)}
        >
          <span className={`${line} absolute inset-0 overflow-hidden rounded-[16px_16px_10px_10px] bg-peach`}>
            <span className="absolute inset-x-3 top-3 flex h-9 items-center gap-2 rounded-md bg-ink px-3">
              <span className="blink size-2 rounded-full bg-[#5DCAA5]" />
              <span className="font-mono text-[13px] text-[#9FE1CB]">{running ? `running · ${tok} tok/s` : 'idle'}</span>
            </span>
            <span className="absolute inset-x-3 top-[60px] flex flex-col gap-1.5">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className={`h-1.5 rounded-full ${running ? 'vent-on bg-[#5DCAA5]' : 'bg-[#CECBF6]'}`}
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </span>
            <span className="absolute bottom-2 left-3 font-mono text-[13px] text-[#633806]">ai·box 01</span>
          </span>
          <span className={`${tip} -top-8 right-0`}>{running ? 'click to stop' : 'my mini AI box · click to run a model'}</span>
        </button>
      </Stage>
    </div>
  );
}
