import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react';
import type { Contributions } from '../../lib/github';
import type { AnimationItem } from 'lottie-web';
import { SITE } from '../../data/site';
import { factForToday } from '../../data/tech-facts';

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
  pointAt?: string | null;
  duckAway?: boolean;
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

const LOCKED = [
  'nice try. this drawer is personal.',
  "still locked. it's mostly snacks.",
  'ok fine: snacks and half-built side projects.',
  'access requires one (1) job offer.',
];

const BUDDY_LINES = ['hi! i guard the lab.', 'psst. projects/ is the good stuff.', 'beep boop. hire my human.'];
const BUDDY_DUR = 1700; // lottie clip length in ms; keep in sync with public/props/buddy.json

// key colors, top row of the desk keyboard (buttons 5 and 6 are the "spacebar" pair)
const KEYS = Array.from({ length: 12 }, (_, i) =>
  i === 5 || i === 6 ? '#FAC775' : i % 4 === 0 ? '#F4C0D1' : '#CECBF6',
);

const SPOTS = [
  { c: '#F4C0D1', l: '8%', t: '12%', d: '0s' },
  { c: '#9FE1CB', l: '52%', t: '4%', d: '0.4s' },
  { c: '#FAC775', l: '28%', t: '40%', d: '0.8s' },
];

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

export default function DeskScene({ running, onRun, speaking, screen, contributions, pointAt, duckAway }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [s, setS] = useState(0);
  const [now, setNow] = useState<Date | null>(null);
  const [tok, setTok] = useState(40);

  const [quack, setQuack] = useState(false);
  const [hoverBar, setHoverBar] = useState<number | null>(null);
  const [voice, setVoice] = useState<string | null>(null);
  const [clockMode, setClockMode] = useState(0);
  const [hex, setHex] = useState([0, 1, 2, 3, 4]);
  const [litKeys, setLitKeys] = useState<Record<number, boolean>>({});
  const [disco, setDisco] = useState(0);
  const [fact, setFact] = useState<string | null>(null);
  const [deny, setDeny] = useState<number | null>(null);
  const [buddy, setBuddy] = useState<string | null>(null);
  const [buddyOk, setBuddyOk] = useState(true);

  // the duck hops each time the chat points at a folder
  const [hop, setHop] = useState(0);
  useEffect(() => {
    if (pointAt) setHop((h) => h + 1);
  }, [pointAt]);

  // lab buddy: a lottie animation, still until clicked
  const buddyRef = useRef<HTMLDivElement>(null);
  const anim = useRef<AnimationItem | null>(null);
  const [buddyReady, setBuddyReady] = useState(false);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/props/buddy.json');
        if (!res.ok) throw new Error('no buddy animation');
        const data = await res.json();
        const lottie = (await import('lottie-web')).default;
        if (cancelled || !buddyRef.current) return;
        anim.current = lottie.loadAnimation({
          container: buddyRef.current,
          renderer: 'svg',
          loop: true,
          autoplay: false,
          animationData: data,
        });
        anim.current.goToAndStop(0, true);
        setBuddyReady(true);
        // END TEMP PROBE
      } catch {
        if (!cancelled) setBuddyOk(false);
      }
    })();
    return () => {
      cancelled = true;
      anim.current?.destroy();
      anim.current = null;
    };
  }, []);

  // timers, with tokens so overlapping clicks don't cut each other short
  const timers = useRef<number[]>([]);
  const tokens = useRef({ voice: 0, disco: 0, fact: 0, deny: 0, quack: 0, buddy: 0, buddyStop: 0 });
  const counts = useRef({ deny: 0, buddy: 0 });
  const keyTok = useRef<Record<number, number>>({});
  const later = (key: keyof typeof tokens.current, fn: () => void, ms: number) => {
    const t = ++tokens.current[key];
    timers.current.push(
      window.setTimeout(() => {
        if (tokens.current[key] === t) fn();
      }, ms),
    );
  };
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

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

  const pune = now ? puneParts(now) : null;
  const shown = clockMode === 1 && now ? { h: now.getHours(), m: now.getMinutes() } : pune;
  const clockSub = clockMode === 0 ? 'pune · ist' : clockMode === 1 ? 'your time' : pune ? status(pune.h) : '';

  // the waveform only reacts to the chat and to its own click
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

  const hello = () => {
    setVoice('hey there, welcome in!');
    later('voice', () => setVoice(null), 2200);
  };
  const startDisco = () => {
    setDisco((d) => d + 1);
    later('disco', () => setDisco(0), 3500);
  };
  const openFact = () => {
    setFact(factForToday());
    later('fact', () => setFact(null), 5000);
  };
  const tryLocked = () => {
    setDeny(counts.current.deny++);
    later('deny', () => setDeny(null), 2600);
  };
  const ducky = () => {
    setQuack(true);
    later('quack', () => setQuack(false), 1800);
  };
  const playKey = (i: number) => {
    const my = (keyTok.current[i] ?? 0) + 1;
    keyTok.current[i] = my;
    setLitKeys((l) => ({ ...l, [i]: true }));
    timers.current.push(
      window.setTimeout(() => {
        setLitKeys((l) => {
          if (!l[i] || keyTok.current[i] !== my) return l;
          const rest = { ...l };
          delete rest[i];
          return rest;
        });
      }, 750),
    );
  };
  const pokeBuddy = () => {
    setBuddy(BUDDY_LINES[counts.current.buddy++ % BUDDY_LINES.length]);
    later('buddy', () => setBuddy(null), 3000);
    const a = anim.current;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (a && !reduce) {
      a.goToAndPlay(0, true);
      later('buddyStop', () => a.goToAndStop(0, true), BUDDY_DUR);
    }
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
      <div className="absolute inset-x-0 bottom-0 border-t-[1.5px] border-ink bg-[#F3E1C7]" style={{ height: PANEL_H * s }} />
      <div className="absolute inset-x-0 border-y-[1.5px] border-ink bg-peach" style={{ bottom: PANEL_H * s, height: 22 * s }} />

      {/* back: the room */}
      <Stage s={s}>
        {/* github heatmap */}
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

        {/* voice waveform */}
        <div style={box(430, 0, 330, 160)}>
          <svg style={box(0, 0, 330, 52)} aria-hidden="true">
            <line x1="50" y1="0" x2="50" y2="52" stroke={INK} strokeWidth="1.3" />
            <line x1="280" y1="0" x2="280" y2="52" stroke={INK} strokeWidth="1.3" />
          </svg>
          <div
            role="button"
            tabIndex={0}
            aria-label="Voice waveform, click to hear a hello"
            onClick={hello}
            onKeyDown={onKey(hello)}
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

        {/* led clock */}
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

        {/* hex lights */}
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

        {/* lab buddy: the lottie stays still until you click it, then waves with a speech bubble.
            real art bbox (from the svg, probed in-browser): x 3.5-418, y 21-474 of a 512 frame.
            sized S=195 so he stands 172px tall, feet exactly on the desk line (640). */}
        <button type="button" onClick={pokeBuddy} aria-label="Lab buddy, click to say hi" className="group" style={box(60, 460, 170, 180)}>
          <span className="pointer-events-none absolute -bottom-[4px] left-6 h-2 w-[120px] rounded-full bg-ink/15 blur-[2px]" aria-hidden="true" />
          <div
            ref={buddyRef}
            className={`pointer-events-none absolute left-[5px] top-0 transition-transform duration-200 group-hover:-translate-y-1 ${buddyReady ? '' : 'hidden'}`}
            style={{ width: 195, height: 195 }}
          />
          {!buddyReady &&
            buddyOk && (
              <span className="absolute inset-x-8 bottom-0 top-12 grid place-items-center rounded-xl border-[1.5px] border-dashed border-ink/50 text-center font-mono text-[12px] text-sub">
                your gif
                <br />
                goes here
              </span>
            )}
          <span
            className={`pointer-events-none absolute -top-2 left-[150px] z-20 whitespace-nowrap rounded-xl rounded-bl-sm border-[1.5px] border-ink bg-win px-3 py-1 font-mono text-[13px] text-ink transition-opacity ${
              buddy ? 'opacity-100' : 'opacity-0'
            }`}
            aria-live="polite"
          >
            {buddy ?? ''}
          </span>
          <span className={`${tip} -top-2 left-[150px] ${buddy ? 'hidden' : ''}`}>click me</span>
        </button>

        {/* keyboard: click a key to play it, click the body for disco */}
        <div className={`kbd group ${disco ? 'disco' : ''}`} style={box(320, 600, 210, 40)}>
          <span className={`${line} absolute inset-x-0 bottom-0 top-[18px] rounded-[6px_6px_3px_3px] bg-win`} />
          <button
            type="button"
            onClick={startDisco}
            aria-label="Keyboard body, click for disco mode"
            className="absolute inset-x-0 bottom-0 top-[20px] cursor-pointer rounded-[6px_6px_3px_3px]"
          />
          <span className="absolute inset-x-[10px] top-[10px] flex h-[14px] gap-[3px]">
            {KEYS.map((c, i) => (
              <button
                key={i}
                type="button"
                onClick={() => playKey(i)}
                aria-label={`Play key ${i + 1}`}
                className={`key flex-1 cursor-pointer rounded-[3px] border border-ink ${litKeys[i] ? 'lit' : ''}`}
                style={{ background: c, '--kc': c, '--i': `${((i * 5) % 7) * 0.06}s` } as CSSProperties}
              />
            ))}
          </span>
          <span className={`${tip} -top-7 left-0`}>{disco ? 'disco mode' : 'play the keys'}</span>
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

        {/* left drawer: today's tech fact */}
        <div className="bg-ink/40" style={box(40, 684, 380, 14, { borderRadius: 6 })} aria-hidden="true" />
        <button
          type="button"
          onClick={openFact}
          aria-label="Drawer with today's tech fact"
          className="text-left"
          style={box(40, 684, 380, 74, { translate: fact ? '0 10px' : '0 0', transition: 'translate .3s cubic-bezier(.3,1.4,.5,1)' })}
        >
          <span className={`${line} absolute inset-0 rounded-lg bg-peach`} />
          {fact ? (
            <span className="rise absolute inset-0 flex flex-col justify-center px-5" aria-live="polite">
              <span className="font-mono text-[11px] text-sub">today’s tech fact · new one tomorrow</span>
              <span className="mt-1 font-mono text-[13px] leading-snug text-ink">{fact}</span>
            </span>
          ) : (
            <>
              <span className="absolute left-4 top-3 font-mono text-[13px] text-sub">tech_fact.today</span>
              <span className={`${line} absolute left-1/2 top-1/2 h-3 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full bg-win`} />
              <span className="absolute bottom-2.5 right-4 font-mono text-[12px] text-sub">pull ↓</span>
            </>
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

      {/* running a model dims the room; disco dims it a little */}
      <div
        className="pointer-events-none absolute inset-0 bg-[rgb(20_16_44/0.5)] transition-opacity duration-500"
        style={{ opacity: running ? 1 : disco ? 0.55 : 0 }}
      />

      {/* disco spotlights */}
      {disco > 0 && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          {SPOTS.map((sp) => (
            <span
              key={sp.c}
              className="spot absolute size-[45vmin] rounded-full"
              style={{ background: sp.c, left: sp.l, top: sp.t, opacity: 0.35, animationDelay: sp.d }}
            />
          ))}
        </div>
      )}

      {/* front: glow, the PC, the duck and the AI box */}
      <Stage s={s} front>
        <svg style={box(36, 232, 250, 196)} viewBox="0 0 140 110" aria-hidden="true">
          <g style={{ opacity: running || disco ? 0.55 : 0, transition: 'opacity 0.5s' }}>
            {HEX_GLOW.map(([cx, cy, r], i) => (
              <circle key={i} cx={cx} cy={cy} r={r} fill={HEX_COLORS[hex[i] % HEX_COLORS.length]} />
            ))}
          </g>
        </svg>

        <div className="pointer-events-none" style={box(300, 166, 680, 474)}>
          <div className={`${line} pointer-events-auto h-[398px] rounded-[20px] bg-win p-[18px]`}>
            <div data-screen className={`${line} h-full overflow-hidden rounded-lg bg-win`}>
              {screen}
            </div>
          </div>
          <div className="mx-auto h-14 w-10 border-x-[1.5px] border-ink bg-win" />
          <div className={`${line} mx-auto h-5 w-[170px] rounded-t-md bg-win`} />

          {/* perch shadow so the duck sits on the bezel, not in mid-air */}
          <span className="pointer-events-none absolute -top-1 right-[52px] h-[5px] w-[42px] rounded-full bg-ink/15 blur-[1px]" aria-hidden="true" />

          <button
            type="button"
            data-duck
            onClick={ducky}
            aria-label="Rubber duck"
            className="pointer-events-auto absolute -top-[44px] right-10"
            style={{ width: 52, height: 44, visibility: duckAway ? 'hidden' : 'visible' }}
          >
            <svg key={hop} className={`wobble ${hop ? 'duck-hop' : ''}`} width="52" height="44" viewBox="0 0 30 26" aria-hidden="true">
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
