import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { STATION_LIST, type Radio } from '../../lib/useRadio';

const INK = '#1E1A3A';
const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

/* the deck on the desk: click the record to play, drag it to scrub, turn the knob for volume */
export function TurntableDeck({ radio, onOpen }: { radio: Radio; onOpen: () => void }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const recRef = useRef<SVGGElement>(null);
  const angle = useRef(0);
  const drag = useRef<{ a: number; moved: number } | null>(null);
  const knob = useRef<{ y: number; v: number } | null>(null);
  const playing = useRef(radio.playing);
  playing.current = radio.playing;

  // spin the record without re-rendering the room
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0;
    let last = 0;
    const tick = (t: number) => {
      const dt = last ? (t - last) / 1000 : 0;
      last = t;
      if (playing.current && !drag.current && !reduce) angle.current += dt * 165;
      recRef.current?.setAttribute('transform', `rotate(${angle.current} 56 58)`);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const angleAt = (e: PointerEvent) => {
    const r = svgRef.current!.getBoundingClientRect();
    const cx = r.left + (56 / 160) * r.width;
    const cy = r.top + (58 / 110) * r.height;
    return (Math.atan2(e.clientY - cy, e.clientX - cx) * 180) / Math.PI;
  };

  const play = () => {
    radio.toggle();
    onOpen();
  };

  const recDown = (e: PointerEvent<SVGGElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { a: angleAt(e), moved: 0 };
  };
  const recMove = (e: PointerEvent<SVGGElement>) => {
    const d0 = drag.current;
    if (!d0) return;
    const a = angleAt(e);
    let d = a - d0.a;
    if (d > 180) d -= 360;
    if (d < -180) d += 360;
    d0.a = a;
    d0.moved += Math.abs(d);
    angle.current += d;
    if (radio.track) radio.scrub(d / 36); // one full turn = 10 seconds
  };
  const recUp = () => {
    const d0 = drag.current;
    drag.current = null;
    if (d0 && d0.moved < 4) play(); // a click, not a drag
  };

  const knobDown = (e: PointerEvent<SVGGElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    knob.current = { y: e.clientY, v: radio.vol };
  };
  const knobMove = (e: PointerEvent<SVGGElement>) => {
    if (knob.current) radio.setVol(knob.current.v + (knob.current.y - e.clientY) * 0.8);
  };
  const knobKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
      e.preventDefault();
      radio.setVol(radio.vol + 5);
    }
    if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
      e.preventDefault();
      radio.setVol(radio.vol - 5);
    }
  };

  const ring = 2 * Math.PI * 14 * 0.75;

  return (
    <div className="group relative h-full w-full">
      <svg ref={svgRef} viewBox="0 0 160 110" className="h-full w-full overflow-visible">
        <rect x="1" y="1" width="158" height="108" rx="14" fill="#FAC775" stroke={INK} strokeWidth="1.5" />
        <rect x="8" y="8" width="96" height="94" rx="10" fill="#FBE3A6" stroke={INK} strokeWidth="1.2" />

        {/* record, with the song's cover as the label */}
        <g
          ref={recRef}
          role="button"
          tabIndex={0}
          aria-label={radio.playing ? 'Pause the music' : 'Play lo-fi music'}
          className="cursor-grab touch-none outline-none active:cursor-grabbing"
          onPointerDown={recDown}
          onPointerMove={recMove}
          onPointerUp={recUp}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              play();
            }
          }}
        >
          <circle cx="56" cy="58" r="44" fill={INK} />
          <g fill="none" stroke="#3C3489" strokeWidth="0.8">
            <circle cx="56" cy="58" r="38" />
            <circle cx="56" cy="58" r="32" />
            <circle cx="56" cy="58" r="26" />
          </g>
          <path d="M28 38 a32 32 0 0 1 18 -12" stroke="#7F77DD" strokeWidth="1.6" fill="none" strokeLinecap="round" />
          <clipPath id="tt-label">
            <circle cx="56" cy="58" r="16" />
          </clipPath>
          {radio.track?.cover ? (
            <image href={radio.track.cover} x="40" y="42" width="32" height="32" clipPath="url(#tt-label)" preserveAspectRatio="xMidYMid slice" />
          ) : (
            <circle cx="56" cy="58" r="16" fill="#F4C0D1" />
          )}
          <circle cx="56" cy="58" r="16" fill="none" stroke={INK} strokeWidth="1" />
          <circle cx="56" cy="58" r="2" fill={INK} />
        </g>

        {/* tonearm swings onto the record while playing */}
        <g
          pointerEvents="none"
          style={{
            transformBox: 'view-box',
            transformOrigin: '132px 18px',
            rotate: radio.playing ? '24deg' : '0deg',
            transition: 'rotate .6s cubic-bezier(.4,1.4,.5,1)',
          }}
        >
          <path d="M132 18 L128 70 L116 86" fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="108" y="82" width="12" height="8" rx="2" fill="#5A5578" stroke={INK} strokeWidth="1" transform="rotate(-38 114 86)" />
        </g>
        <circle cx="132" cy="18" r="7" fill="#FCFBFF" stroke={INK} strokeWidth="1.2" />
        <circle cx="132" cy="18" r="3" fill="#AFA9EC" />

        {/* volume knob */}
        <g
          transform="translate(138 88)"
          role="slider"
          tabIndex={0}
          aria-label="Volume"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={radio.vol}
          className="cursor-ns-resize touch-none outline-none"
          onPointerDown={knobDown}
          onPointerMove={knobMove}
          onPointerUp={() => (knob.current = null)}
          onKeyDown={knobKey}
        >
          <circle r="17" fill="transparent" />
          <circle
            r="14"
            fill="none"
            stroke="#5DCAA5"
            strokeWidth="2.5"
            strokeLinecap="round"
            transform="rotate(135)"
            strokeDasharray={`${(ring * radio.vol) / 100} 999`}
          />
          <circle r="10" fill="#FCFBFF" stroke={INK} strokeWidth="1.2" />
          <line x1="0" y1="0" x2="0" y2="-7" stroke={INK} strokeWidth="2" strokeLinecap="round" transform={`rotate(${-135 + (radio.vol / 100) * 270})`} />
        </g>
        <text x="138" y="108" textAnchor="middle" fill="#633806" fontSize="9" fontFamily="ui-monospace, monospace">
          vol {radio.vol}
        </text>
      </svg>

      <button
        type="button"
        onClick={onOpen}
        className="absolute -top-8 right-0 whitespace-nowrap rounded-md bg-ink px-2 py-0.5 font-mono text-[13px] text-win opacity-0 transition-opacity focus:opacity-100 group-hover:opacity-100"
      >
        {radio.playing ? 'now playing ↗' : 'lo-fi radio · click the record'}
      </button>
    </div>
  );
}

/* the dark now-playing panel: floats above the deck on laptops, sits under the chat on phones */
export function RadioPanel({
  radio,
  onClose,
  anchor,
}: {
  radio: Radio;
  onClose?: () => void;
  anchor?: { current: HTMLElement | null };
}) {
  const barRef = useRef<HTMLSpanElement>(null);
  const curRef = useRef<HTMLSpanElement>(null);
  const durRef = useRef<HTMLSpanElement>(null);
  const radioRef = useRef(radio);
  radioRef.current = radio;
  const [place, setPlace] = useState<{ right: number; bottom: number } | null>(null);

  // live progress, read straight from the audio element
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const r = radioRef.current;
      const t = r.time();
      const d = r.duration();
      if (barRef.current) barRef.current.style.width = d ? `${Math.min(100, (t / d) * 100)}%` : '0%';
      if (curRef.current) curRef.current.textContent = fmt(t);
      if (durRef.current) durRef.current.textContent = fmt(d);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // float above the deck, and close with esc
  useEffect(() => {
    if (!anchor) return;
    const put = () => {
      const r = anchor.current?.getBoundingClientRect();
      if (r) setPlace({ right: Math.max(12, window.innerWidth - r.right), bottom: window.innerHeight - r.top + 12 });
    };
    const onKey = (e: globalThis.KeyboardEvent) => e.key === 'Escape' && onClose?.();
    put();
    window.addEventListener('resize', put);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('resize', put);
      window.removeEventListener('keydown', onKey);
    };
  }, [anchor, onClose]);

  const t = radio.track;
  const floating = !!anchor;
  const key = 'grid h-9 place-items-center rounded-lg border border-ink bg-[#2C2754] text-[#E2DEFA] transition-colors hover:bg-[#3C3489]';

  return (
    <div
      role="region"
      aria-label="Lo-fi radio"
      className={`${floating ? 'fixed z-[940] w-[320px]' : 'w-full'} rise rounded-2xl border-[1.5px] border-ink bg-ink p-4`}
      style={floating ? (place ?? { visibility: 'hidden' }) : undefined}
    >
      <div className="mb-3 flex items-center gap-2">
        <span className={`size-2 rounded-full ${radio.playing ? 'blink bg-[#5DCAA5]' : 'bg-[#3C3489]'}`} />
        <span className="font-mono text-xs text-[#7F77DD]">
          {radio.loading ? 'tuning in…' : `lo-fi radio · ${radio.station}${radio.playing ? ' · playing' : ''}`}
        </span>
        {onClose && (
          <button onClick={onClose} aria-label="Close player" className="ml-auto px-1 font-mono text-sm text-[#AFA9EC] hover:text-win">
            ×
          </button>
        )}
      </div>

      <div className="flex items-center gap-3">
        {t?.cover ? (
          <img src={t.cover} alt="" className="size-14 shrink-0 rounded-lg object-cover" />
        ) : (
          <span className="size-14 shrink-0 rounded-lg bg-[#2C2754]" />
        )}
        <div className="min-w-0">
          <p className="truncate font-mono text-xs text-[#AFA9EC]">{t?.artist ?? 'press play'}</p>
          <p className="truncate font-serif text-2xl leading-tight text-win">{t?.title ?? 'lo-fi radio'}</p>
        </div>
      </div>

      <div className="mt-3">
        <div
          role="slider"
          aria-label="Seek"
          aria-valuemin={0}
          aria-valuemax={100}
          tabIndex={0}
          onClick={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            radio.seek(((e.clientX - r.left) / r.width) * radio.duration());
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight') radio.scrub(5);
            if (e.key === 'ArrowLeft') radio.scrub(-5);
          }}
          className="h-1.5 cursor-pointer overflow-hidden rounded-full bg-[#3C3489]"
        >
          <span ref={barRef} className="block h-full bg-[#9FE1CB]" style={{ width: 0 }} />
        </div>
        <div className="mt-1 flex justify-between font-mono text-[11px] text-[#AFA9EC]">
          <span ref={curRef}>0:00</span>
          <span ref={durRef}>0:00</span>
        </div>
      </div>

      <div className="mt-2 flex items-center gap-2">
        <button onClick={radio.prev} aria-label="Previous" className={`${key} w-10`}>
          ⏮
        </button>
        <button
          onClick={radio.toggle}
          aria-label={radio.playing ? 'Pause' : 'Play'}
          className="grid h-9 w-14 place-items-center rounded-lg border border-ink bg-win text-ink"
        >
          {radio.playing ? '⏸' : '▶'}
        </button>
        <button onClick={radio.next} aria-label="Next" className={`${key} w-10`}>
          ⏭
        </button>
      </div>

      <div className="mt-3 flex gap-1.5">
        {STATION_LIST.map((s) => (
          <button
            key={s}
            onClick={() => radio.setStation(s)}
            aria-pressed={radio.station === s}
            className={`rounded-full border px-2.5 py-0.5 font-mono text-[11px] ${
              radio.station === s ? 'border-[#9FE1CB] bg-[#9FE1CB] text-ink' : 'border-[#534AB7] text-[#AFA9EC] hover:text-win'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="mt-3 flex justify-between gap-2 border-t border-dashed border-[#3C3489] pt-2 font-mono text-[11px] text-[#7F77DD]">
        <span className="truncate">
          up next · <span className="text-[#CECBF6]">{radio.upNext?.title ?? '—'}</span>
        </span>
        {t && (
          <span className="flex shrink-0 gap-2">
            <a href={t.license} target="_blank" rel="noopener" className="hover:text-win">
              cc
            </a>
            <a href={t.url} target="_blank" rel="noopener" className="text-[#AFA9EC] hover:text-win">
              jamendo ↗
            </a>
          </span>
        )}
      </div>

      {radio.error && <p className="mt-2 font-mono text-[11px] text-[#F0997B]">{radio.error}</p>}
    </div>
  );
}
