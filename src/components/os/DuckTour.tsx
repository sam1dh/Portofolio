import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { FolderKey } from '../../lib/folder-types';

type Props = {
  onPoint: (id: FolderKey | null) => void;
  onDone: () => void;
};

const STEPS: { id: FolderKey; text: ReactNode }[] = [
  {
    id: 'projects',
    text: (
      <>
        <b className="font-medium">projects/</b> two builds, one placed 3rd of 650+ teams.
      </>
    ),
  },
  {
    id: 'internships',
    text: (
      <>
        <b className="font-medium">internships/</b> three of them, up to production voice AI.
      </>
    ),
  },
  {
    id: 'hobbies',
    text: (
      <>
        <b className="font-medium">hobbies/</b> debate, public speaking and hackathons.
      </>
    ),
  },
];

type Pos = { x: number; y: number; w: number; h: number; fly: boolean; flip: boolean; instant: boolean };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const frame = () => new Promise((r) => requestAnimationFrame(() => r(null)));

export default function DuckTour({ onPoint, onDone }: Props) {
  const [pos, setPos] = useState<Pos | null>(null);
  const [bubble, setBubble] = useState<ReactNode>(null);
  const stopped = useRef(false);
  const ended = useRef(false);
  const reduce = useRef(false);

  const end = () => {
    if (ended.current) return;
    ended.current = true;
    stopped.current = true;
    onPoint(null);
    onDone();
  };

  useEffect(() => {
    reduce.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ok = () => !stopped.current;
    const move = 850; // flight time

    (async () => {
      // start exactly where the real duck sits on the monitor
      const home = document.querySelector('[data-duck]')?.getBoundingClientRect();
      if (!home) return end();
      setPos({ x: home.left, y: home.top, w: home.width, h: home.height, fly: false, flip: false, instant: true });
      await frame();
      await frame();

      for (const step of STEPS) {
        const icon = document.querySelector(`[data-folder-icon="${step.id}"]`)?.getBoundingClientRect();
        if (!icon) continue;
        setBubble(null);
        setPos((p) =>
          p && {
            ...p,
            x: icon.left - p.w - 14,
            y: icon.top + icon.height / 2 - p.h / 2,
            fly: true,
            flip: icon.left - p.w - 14 < p.x,
            instant: false,
          },
        );
        await sleep(move);
        if (!ok()) return;
        setPos((p) => p && { ...p, fly: false });
        onPoint(step.id);
        setBubble(step.text);
        await sleep(2300);
        if (!ok()) return;
      }

      // fly home
      setBubble(null);
      onPoint(null);
      setPos((p) => p && { ...p, x: home.left, y: home.top, fly: true, flip: true });
      await sleep(move);
      if (!ok()) return;
      setPos((p) => p && { ...p, fly: false, flip: false });
      setBubble('quack. your turn. pick a folder.');
      await sleep(2200);
      if (ok()) end();
    })();

    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && end();
    window.addEventListener('keydown', onKey);
    return () => {
      stopped.current = true;
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  if (!pos) return null;

  const ease = 'cubic-bezier(0.5, 0, 0.3, 1)';
  const transition = pos.instant || reduce.current ? 'none' : `left .85s ${ease}, top .85s ${ease}`;

  return (
    <div className="pointer-events-none fixed inset-0 z-[960]" aria-live="polite">
      {/* the duck */}
      <div className="absolute" style={{ left: pos.x, top: pos.y, width: pos.w, height: pos.h, transition }}>
        <svg
          className={pos.fly ? 'duck-fly' : ''}
          width="100%"
          height="100%"
          viewBox="0 0 30 26"
          style={{ transform: pos.flip ? 'scaleX(-1)' : undefined }}
          aria-hidden="true"
        >
          <ellipse cx="14" cy="18" rx="12" ry="7" fill="#FAC775" stroke="#1E1A3A" strokeWidth="1.3" />
          <circle cx="20" cy="9" r="6" fill="#FAC775" stroke="#1E1A3A" strokeWidth="1.3" />
          <path d="M25 9 l5 1 -5 2z" fill="#F0997B" stroke="#1E1A3A" strokeWidth="1" />
          <circle cx="21" cy="8" r="1.2" fill="#1E1A3A" />
        </svg>
      </div>

      {/* speech bubble, always to the left of the duck so it never covers the folders */}
      {bubble && (
        <div
          className="rise absolute max-w-[260px] rounded-xl rounded-br-sm border-[1.5px] border-ink bg-win px-3 py-1.5 text-sm leading-snug text-ink"
          style={{ right: window.innerWidth - pos.x + 10, top: pos.y - 6 }}
        >
          {bubble}
        </div>
      )}

      {/* skip */}
      <button
        onClick={end}
        className="pointer-events-auto fixed bottom-24 right-5 rounded-lg border-[1.5px] border-ink bg-win px-2.5 py-1 font-mono text-xs hover:bg-titlebar"
      >
        skip tour ↵
      </button>
    </div>
  );
}
