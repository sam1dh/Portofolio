import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import type { Contributions } from '../../lib/github';

const W = 1280; // design width
const H = 800; // design height
const PANEL_H = 138; // desk front, from under the desk top to the bottom of the screen
const INK = '#1E1A3A';
const line = 'border-[1.5px] border-ink';
const tip =
  'pointer-events-none absolute z-10 whitespace-nowrap rounded-md bg-ink px-2 py-0.5 font-mono text-[13px] text-win opacity-0 transition-opacity group-hover:opacity-100';

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
  id: `${(0.7 + ((i * 5) % 8) * 0.12).toFixed(2)}s`,
  idly: `${(i % 7) * 0.23}s`,
  ih: `${38 + ((i * 29) % 42)}%`,
}));

// acoustic foam panels behind everything
const FOAM =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='56'%3E%3Crect x='1' y='1' width='54' height='54' rx='3' fill='%23C7BFEE' stroke='%23B4ACE8' stroke-width='1.5'/%3E%3Cpath d='M1 12h54M1 24h54M1 36h54M1 48h54' stroke='%23BBB3EB' stroke-width='2'/%3E%3C/svg%3E\")";

function puneTime() {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date());
  const h = Number(parts.find((p) => p.type === 'hour')?.value ?? 0) % 24;
  const m = Number(parts.find((p) => p.type === 'minute')?.value ?? 0);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
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

function HexPanels() {
  return (
    <g stroke={INK} strokeWidth="1.5">
      <polygon points="40,8 59,19 59,41 40,52 21,41 21,19" fill="#AFA9EC" />
      <polygon points="78,30 97,41 97,63 78,74 59,63 59,41" fill="#F4C0D1" />
      <polygon points="40,52 59,63 59,85 40,96 21,85 21,63" fill="#9FE1CB" />
      <polygon points="108,52 127,63 127,85 108,96 89,85 89,63" fill="#FAC775" />
      <polygon points="78,62 97,73 97,95 78,106 59,95 59,73" fill="#B5D4F4" />
    </g>
  );
}

export default function DeskScene({ running, onRun, speaking, screen, contributions }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [s, setS] = useState(0);
  const [time, setTime] = useState('--:--');
  const [tok, setTok] = useState(40);
  const [quack, setQuack] = useState(false);

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
    const t = () => setTime(puneTime());
    t();
    const id = setInterval(t, 20_000);
    return () => clearInterval(id);
  }, []);

  // tokens per second wobble while the model runs
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setTok(38 + Math.round(Math.random() * 8)), 700);
    return () => clearInterval(id);
  }, [running]);

  const ducky = () => {
    setQuack(true);
    setTimeout(() => setQuack(false), 1800);
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
        {/* github heatmap */}
        <div style={box(36, 46, 250, 104)} className="rounded-md border-[3px] border-win bg-[#26215C] px-2.5 py-2 outline outline-[1.5px] outline-ink">
          <div className="mb-1.5 flex justify-between font-mono text-[12px]">
            <span className="text-[#CECBF6]">github · past year</span>
            {contributions.total > 0 && <span className="text-[#9FE1CB]">{contributions.total.toLocaleString('en-IN')}</span>}
          </div>
          <div className="grid grid-flow-col gap-[2px]" style={{ gridTemplateRows: 'repeat(7, 6px)', gridAutoColumns: '6px' }}>
            {contributions.weeks.flatMap((w, i) =>
              w.map((lvl, j) => <span key={`${i}-${j}`} className="rounded-[1px]" style={{ background: HEAT[lvl] }} />),
            )}
          </div>
        </div>

        {/* hackathon lanyards */}
        <div className="group" style={box(306, 36, 70, 110)}>
          <span className={`${line} absolute left-[30px] top-0 size-2.5 rounded-full bg-win`} />
          <svg style={box(0, 6, 70, 44)} aria-hidden="true">
            <path d="M35 2 L13 40 M35 2 L35 42 M35 2 L57 38" stroke={INK} strokeWidth="1.3" fill="none" />
          </svg>
          <span className={`${line} absolute left-[2px] top-[46px] h-8 w-[22px] -rotate-[8deg] rounded bg-[#F4C0D1]`} />
          <span className={`${line} absolute left-[24px] top-[48px] h-8 w-[22px] rounded bg-[#9FE1CB]`} />
          <span className={`${line} absolute left-[46px] top-[44px] h-8 w-[22px] rotate-[7deg] rounded bg-sticky`} />
          <span className={`${tip} left-0 top-[88px]`}>hackathon badges: SIH · SanDisk · Blostem</span>
        </div>

        {/* voice waveform: moves only while the chat is speaking */}
        <div className={speaking ? 'talking' : ''} style={box(430, 0, 330, 160)} aria-hidden="true">
          <svg style={box(0, 0, 330, 52)}>
            <line x1="50" y1="0" x2="50" y2="52" stroke={INK} strokeWidth="1.3" />
            <line x1="280" y1="0" x2="280" y2="52" stroke={INK} strokeWidth="1.3" />
          </svg>
          <div className="absolute left-0 top-[50px] flex h-[80px] w-[330px] items-end gap-[5px] rounded-xl border-[1.5px] border-ink bg-[#26215C] px-4 py-3">
            {BARS.map((b, i) => (
              <i
                key={i}
                className="bar flex-1 rounded-t-[3px]"
                style={{ background: b.c, height: '16%', '--d': b.d, '--h': b.h, '--id': b.id, '--idly': b.idly, '--ih': b.ih } as CSSProperties}
              />
            ))}
          </div>
          <span className="absolute left-[44px] top-[136px] font-mono text-[13px] text-sub">
            voice_agent · {speaking ? 'speaking' : 'idle'}
          </span>
        </div>

        {/* led clock */}
        <div style={box(820, 46, 170, 72)} className="flex flex-col items-center justify-center rounded-xl border-[1.5px] border-ink bg-[#26215C]">
          <span className="font-mono text-[30px] font-medium leading-none tracking-[3px] text-[#9FE1CB]">{time}</span>
          <span className="mt-1 font-mono text-[13px] text-[#AFA9EC]">pune · ist</span>
        </div>

        {/* hex light panels */}
        <svg style={box(36, 232, 250, 196)} viewBox="0 0 140 110" aria-hidden="true">
          <HexPanels />
        </svg>

        {/* boom-arm mic */}
        <div className="group" style={box(70, 430, 200, 210)}>
          <svg style={box(0, 0, 200, 210)} viewBox="0 0 110 116" aria-hidden="true">
            <path d="M62 114 V98 L30 60 L48 28" fill="none" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
            <circle cx="30" cy="60" r="3.5" fill="#FCFBFF" stroke={INK} strokeWidth="1.5" />
            <rect x="52" y="96" width="20" height="10" fill="#FCFBFF" stroke={INK} strokeWidth="1.5" />
            <rect x="36" y="2" width="24" height="38" rx="12" fill="#CECBF6" stroke={INK} strokeWidth="1.5" transform="rotate(20 48 21)" />
          </svg>
          <span className={`${tip} left-[110px] top-0`}>voice_agent: listening…</span>
        </div>

        {/* headphones on a hook */}
        <svg style={box(1010, 330, 90, 140)} viewBox="0 0 60 90" aria-hidden="true">
          <rect x="26" y="0" width="8" height="14" rx="2" fill="#FCFBFF" stroke={INK} strokeWidth="1.5" />
          <path d="M10 52 V36 a20 20 0 0 1 40 0 V52" fill="none" stroke={INK} strokeWidth="3" />
          <rect x="4" y="46" width="13" height="22" rx="5" fill="#ED93B1" stroke={INK} strokeWidth="1.5" />
          <rect x="43" y="46" width="13" height="22" rx="5" fill="#ED93B1" stroke={INK} strokeWidth="1.5" />
        </svg>

        {/* keyboard and mouse */}
        <div style={box(320, 610, 210, 30)} aria-hidden="true">
          <span className={`${line} absolute inset-x-0 bottom-0 top-[8px] rounded-[6px_6px_3px_3px] bg-win`} />
          <span className="absolute inset-x-[10px] top-0 flex h-[14px] gap-[3px]">
            {Array.from({ length: 12 }, (_, i) => (
              <span
                key={i}
                className="flex-1 rounded-[3px] border border-ink"
                style={{ background: i === 5 || i === 6 ? '#FAC775' : i % 4 === 0 ? '#F4C0D1' : '#CECBF6' }}
              />
            ))}
          </span>
        </div>
        <span className={`${line} bg-win`} style={box(760, 622, 26, 18, { borderRadius: '13px 13px 5px 5px' })} />

        {/* </> mug */}
        <div style={box(840, 576, 46, 64)} aria-hidden="true">
          <svg style={box(2, -40, 42, 36)} viewBox="0 0 26 22">
            <path className="steam" d="M6 20c-3-4 3-6 0-9s3-6 0-9" fill="none" stroke={INK} strokeWidth="1.3" />
            <path className="steam" style={{ animationDelay: '0.8s' }} d="M13 20c-3-4 3-6 0-9s3-6 0-9" fill="none" stroke={INK} strokeWidth="1.3" />
            <path className="steam" style={{ animationDelay: '1.6s' }} d="M20 20c-3-4 3-6 0-9s3-6 0-9" fill="none" stroke={INK} strokeWidth="1.3" />
          </svg>
          <div className={`${line} grid h-full w-full place-items-center bg-[#26215C] font-mono text-[13px] text-[#9FE1CB]`} style={{ borderRadius: '3px 3px 12px 12px' }}>
            {'</>'}
          </div>
          <div className={`${line} border-l-0`} style={box(46, 12, 16, 24, { borderRadius: '0 12px 12px 0' })} />
        </div>

        {/* desk drawers (the dock sits between them) */}
        {[40, 860].map((x) => (
          <div key={x} className={`${line} rounded-lg bg-peach`} style={box(x, 684, 380, 74)} aria-hidden="true">
            <span className={`${line} absolute left-1/2 top-1/2 h-3 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full bg-win`} />
          </div>
        ))}
      </Stage>

      {/* running a model dims the room */}
      <div className="pointer-events-none absolute inset-0 bg-[rgb(20_16_44/0.5)] transition-opacity duration-500" style={{ opacity: running ? 1 : 0 }} />

      {/* front: glow, the PC, the duck and the AI box */}
      <Stage s={s} front>
        <svg style={box(36, 232, 250, 196)} viewBox="0 0 140 110" aria-hidden="true">
          <g style={{ opacity: running ? 0.55 : 0, transition: 'opacity 0.5s' }}>
            <circle cx="40" cy="30" r="30" fill="#AFA9EC" />
            <circle cx="78" cy="70" r="34" fill="#5DCAA5" />
            <circle cx="108" cy="74" r="24" fill="#FAC775" />
          </g>
        </svg>

        {/* the PC: 398 screen + 56 neck + 20 foot = rests exactly on the desk */}
        <div className="pointer-events-auto" style={box(300, 166, 680, 474)}>
          <div className={`${line} h-[398px] rounded-[20px] bg-win p-[18px]`}>
            <div className={`${line} h-full overflow-hidden rounded-lg bg-win`}>{screen}</div>
          </div>
          <div className="mx-auto h-14 w-14 border-x-[1.5px] border-ink bg-win" />
          <div className={`${line} mx-auto h-5 w-[200px] rounded-t-md bg-win`} />

          {/* rubber duck */}
          <button type="button" onClick={ducky} aria-label="Rubber duck" className="absolute -top-[42px] right-10" style={{ width: 52, height: 44 }}>
            <svg width="52" height="44" viewBox="0 0 30 26" aria-hidden="true">
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
