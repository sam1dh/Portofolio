import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';

const W = 1280; // design width
const H = 800; // design height
const FLOOR_H = 138; // from the underside of the desk to the bottom
const INK = '#1E1A3A';
const line = 'border-[1.5px] border-ink';

type Props = {
  night: boolean;
  onLamp: () => void;
  screen: ReactNode;
  folders: ReactNode;
};

const box = (left: number, top: number, width: number, height: number, extra: CSSProperties = {}): CSSProperties => ({
  position: 'absolute',
  left,
  top,
  width,
  height,
  ...extra,
});

const BULB_COLORS = ['#FAC775', '#ED93B1', '#5DCAA5', '#85B7EB', '#F0997B'];
const BULBS = Array.from({ length: 13 }, (_, i) => {
  const x = 30 + i * 68;
  const t = x / 880;
  const y = (1 - t) ** 2 * 12 + 2 * (1 - t) * t * (t < 0.5 ? 80 : 28) + t * t * 20;
  return { x, y, c: BULB_COLORS[i % BULB_COLORS.length] };
});

const BOOKS = [
  { l: 44, t: 302, w: 28, h: 78, c: '#5DCAA5', r: 0 },
  { l: 76, t: 290, w: 28, h: 90, c: '#85B7EB', r: 0 },
  { l: 108, t: 314, w: 24, h: 66, c: '#ED93B1', r: 0 },
  { l: 136, t: 324, w: 22, h: 56, c: '#FAC775', r: 12 },
];

const STARS = [
  [30, 26],
  [118, 52],
  [160, 104],
  [70, 124],
];

// the room lives in Pune, so its clock and sky follow Pune time
function puneTime() {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date());
  const h = Number(parts.find((p) => p.type === 'hour')?.value ?? 12) % 24;
  const m = Number(parts.find((p) => p.type === 'minute')?.value ?? 0);
  return { h, m };
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

export default function DeskScene({ night, onLamp, screen, folders }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [s, setS] = useState(0);
  const [time, setTime] = useState<{ h: number; m: number } | null>(null);

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
    const tick = () => setTime(puneTime());
    tick();
    const t = setInterval(tick, 30_000);
    return () => clearInterval(t);
  }, []);

  const h = time?.h ?? 12;
  const m = time?.m ?? 0;
  const phase = night ? 'night' : h >= 6 && h < 17 ? 'day' : h >= 17 && h < 19 ? 'eve' : 'night';
  const sky = { day: '#85B7EB', eve: '#F0997B', night: '#26215C' }[phase];
  const showSun = phase !== 'night';

  return (
    <div
      ref={ref}
      className="relative h-full w-full overflow-hidden bg-wall transition-opacity duration-500"
      style={{
        opacity: s ? 1 : 0,
        backgroundImage: 'radial-gradient(rgb(60 52 137 / 0.18) 1px, transparent 1.3px)',
        backgroundSize: '18px 18px',
      }}
    >
      {/* floor and desk top stretch the full width */}
      <div className="absolute inset-x-0 bottom-0 border-t-[1.5px] border-ink bg-[#AFA9EC]" style={{ height: FLOOR_H * s }} />
      <div className="absolute inset-x-0 border-y-[1.5px] border-ink bg-peach" style={{ bottom: FLOOR_H * s, height: 22 * s }} />

      {/* back: the room */}
      <Stage s={s}>
        <svg style={box(0, 0, 880, 120)} viewBox="0 0 880 120" aria-hidden="true">
          <path d="M0 12 Q221 80 440 28 T880 20" fill="none" stroke={INK} strokeWidth="1.5" />
          {BULBS.map((b) => (
            <g key={b.x}>
              <line x1={b.x} y1={b.y} x2={b.x} y2={b.y + 8} stroke={INK} strokeWidth="1.5" />
              <ellipse cx={b.x} cy={b.y + 17} rx="6" ry="8" fill={b.c} stroke={INK} strokeWidth="1.2" />
            </g>
          ))}
        </svg>

        {/* window */}
        <div className={`${line} overflow-hidden rounded-lg transition-colors duration-500`} style={box(50, 82, 210, 172, { background: sky })} aria-hidden="true">
          <span className={`${line} absolute right-5 top-[18px] size-9 rounded-full bg-sticky transition-opacity`} style={{ opacity: showSun ? 1 : 0 }} />
          <span className={`${line} absolute left-5 top-[76px] h-6 w-[74px] rounded-full bg-white transition-opacity`} style={{ opacity: showSun ? 1 : 0 }} />
          {!showSun && STARS.map(([x, y]) => <span key={x} className="absolute size-1 rounded-full bg-white" style={{ left: x, top: y }} />)}
          <span className="absolute inset-y-0 left-1/2 w-[1.5px] bg-ink" />
          <span className="absolute inset-x-0 top-1/2 h-[1.5px] bg-ink" />
        </div>
        <div className="bg-ink" style={box(20, 70, 268, 5)} />
        <div className={`${line} bg-[#F4C0D1]`} style={box(22, 76, 42, 208, { borderRadius: '3px 3px 18px 6px' })} />
        <div className={`${line} bg-[#F4C0D1]`} style={box(246, 76, 42, 208, { borderRadius: '3px 3px 6px 18px' })} />

        {/* shelf */}
        {BOOKS.map((b) => (
          <div
            key={b.l}
            className={`${line} border-b-0`}
            style={box(b.l, b.t, b.w, b.h, { background: b.c, borderRadius: '3px 3px 0 0', rotate: `${b.r}deg`, transformOrigin: 'bottom left' })}
          />
        ))}
        <div style={box(200, 304, 48, 76)} aria-hidden="true">
          <span className={`${line} bg-[#97C459]`} style={box(4, 8, 14, 26, { borderRadius: '14px 14px 3px 3px', rotate: '-20deg' })} />
          <span className={`${line} bg-[#639922]`} style={box(17, 0, 14, 34, { borderRadius: '14px 14px 3px 3px' })} />
          <span className={`${line} bg-[#97C459]`} style={box(30, 10, 14, 24, { borderRadius: '14px 14px 3px 3px', rotate: '22deg' })} />
          <span className={`${line} bg-[#F0997B]`} style={box(0, 34, 48, 42, { borderRadius: '3px 3px 10px 10px' })} />
        </div>
        <div className={`${line} bg-peach`} style={box(26, 380, 244, 12, { borderRadius: 3 })} />

        {/* clock */}
        <svg style={box(850, 24, 90, 90)} viewBox="0 0 58 58" aria-hidden="true">
          <circle cx="29" cy="29" r="27" fill="#FCFBFF" stroke={INK} strokeWidth="1.8" />
          <circle cx="29" cy="29" r="22" fill="none" stroke="#CECBF6" strokeWidth="3" />
          <line x1="29" y1="29" x2="29" y2="16" stroke={INK} strokeWidth="3" strokeLinecap="round" transform={`rotate(${(h % 12) * 30 + m * 0.5} 29 29)`} />
          <line x1="29" y1="29" x2="29" y2="9" stroke="#D85A30" strokeWidth="2" strokeLinecap="round" transform={`rotate(${m * 6} 29 29)`} />
          <circle cx="29" cy="29" r="2.5" fill={INK} />
        </svg>

        {/* desk legs and rug */}
        <div className={`${line} border-t-0 bg-peach`} style={box(60, 662, 20, 138)} />
        <div className={`${line} border-t-0 bg-peach`} style={box(1200, 662, 20, 138)} />
        <div className={`${line} bg-[#F4C0D1]`} style={box(300, 740, 680, 60, { borderRadius: '50% 50% 0 0 / 40% 40% 0 0' })} />

        {/* lamp: click it for night mode */}
        <button
          type="button"
          onClick={onLamp}
          aria-label={night ? 'Turn the lights on' : 'Turn the lights off'}
          className="cursor-pointer"
          style={box(56, 446, 130, 194)}
        >
          <span className="bg-ink" style={box(38, 30, 6, 160, { rotate: '-8deg', transformOrigin: 'bottom' })} />
          <span className={`${line} bg-[#F0997B]`} style={box(30, 6, 80, 40, { borderRadius: '40px 40px 6px 6px', rotate: '28deg' })} />
          <span className={`${line} bg-win`} style={box(12, 178, 72, 16, { borderRadius: '50%' })} />
        </button>

        {/* chai */}
        <div style={box(1010, 576, 46, 64)} aria-hidden="true">
          <svg style={box(2, -40, 42, 36)} viewBox="0 0 26 22">
            <path className="steam" d="M6 20c-3-4 3-6 0-9s3-6 0-9" fill="none" stroke={INK} strokeWidth="1.3" />
            <path className="steam" style={{ animationDelay: '0.8s' }} d="M13 20c-3-4 3-6 0-9s3-6 0-9" fill="none" stroke={INK} strokeWidth="1.3" />
            <path className="steam" style={{ animationDelay: '1.6s' }} d="M20 20c-3-4 3-6 0-9s3-6 0-9" fill="none" stroke={INK} strokeWidth="1.3" />
          </svg>
          <div className={`${line} h-full w-full bg-blush`} style={{ borderRadius: '3px 3px 12px 12px' }} />
          <div className={`${line} border-l-0`} style={box(46, 12, 16, 24, { borderRadius: '0 12px 12px 0' })} />
        </div>

        {/* plant */}
        <div style={box(1086, 500, 100, 140)} aria-hidden="true">
          <div className="sway" style={box(6, 0, 88, 100, { transformOrigin: '50% 100%' })}>
            <span className={`${line} bg-[#97C459]`} style={box(4, 22, 38, 54, { borderRadius: '50% 0 50% 0', rotate: '-30deg' })} />
            <span className={`${line} bg-[#639922]`} style={box(26, 0, 38, 64, { borderRadius: '50% 0 50% 0', rotate: '10deg' })} />
            <span className={`${line} bg-[#97C459]`} style={box(46, 26, 38, 52, { borderRadius: '0 50% 0 50%', rotate: '30deg' })} />
          </div>
          <div className={`${line} bg-[#F0997B]`} style={box(20, 88, 62, 52, { borderRadius: '3px 3px 12px 12px' })} />
        </div>
      </Stage>

      {/* night dims the room, not the PC or folders */}
      <div className="pointer-events-none absolute inset-0 bg-[rgb(30_26_58/0.45)] transition-opacity duration-500" style={{ opacity: night ? 1 : 0 }} />

      {/* front: glow, the PC and the folders */}
      <Stage s={s} front>
        <svg style={box(0, 0, 880, 120)} viewBox="0 0 880 120" aria-hidden="true">
          {BULBS.map((b) => (
            <circle key={b.x} cx={b.x} cy={b.y + 17} r="16" fill={b.c} style={{ opacity: night ? 0.55 : 0, transition: 'opacity 0.5s' }} />
          ))}
        </svg>
        <div
          className="transition-opacity duration-500"
          style={box(110, 500, 190, 140, {
            background: 'rgb(250 199 117 / 0.55)',
            clipPath: 'polygon(18% 0, 42% 0, 100% 100%, 0 100%)',
            opacity: night ? 1 : 0,
          })}
        />

        {/* the PC: 398 screen + 56 neck + 20 foot = sits exactly on the desk */}
        <div className="pointer-events-auto" style={box(300, 166, 680, 474)}>
          <div className={`${line} h-[398px] rounded-[20px] bg-win p-[18px]`}>
            <div className={`${line} h-full overflow-hidden rounded-lg bg-win`}>{screen}</div>
          </div>
          <div className="mx-auto h-14 w-14 border-x-[1.5px] border-ink bg-win" />
          <div className={`${line} mx-auto h-5 w-[200px] rounded-t-md bg-win`} />
        </div>

        <div className="pointer-events-auto absolute right-6 top-8 flex origin-top-right scale-[1.35] flex-col items-center gap-6">
          {folders}
        </div>
      </Stage>
    </div>
  );
}
