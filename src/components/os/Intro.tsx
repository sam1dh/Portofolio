import { motion } from 'motion/react';
import { useEffect, useState } from 'react';

const COLORS = ['#9FE1CB', '#B5D4F4', '#CECBF6', '#F4C0D1', '#FAC775'];
const CAPTIONS: Record<number, string> = {
  0: 'waking up…',
  3: 'loading voice_ai…',
  7: 'brewing cutting chai…',
  11: 'ready ✓',
};
const SEGMENTS = 12;
const START = 1100; // ms before the bar starts filling
const STEP = 130; // ms per segment
const END = START + SEGMENTS * STEP;

export default function Intro({ onDone }: { onDone: () => void }) {
  const [filled, setFilled] = useState(0);
  const [wink, setWink] = useState(false);
  const [hideWin, setHideWin] = useState(false);
  const [zoom, setZoom] = useState(false);

  useEffect(() => {
    const timers: number[] = [];
    const at = (ms: number, fn: () => void) => timers.push(window.setTimeout(fn, ms));

    for (let i = 1; i <= SEGMENTS; i++) at(START + (i - 1) * STEP, () => setFilled(i));
    at(END + 250, () => setWink(true));
    at(END + 550, () => setWink(false));
    at(END + 600, () => setHideWin(true));
    at(END + 850, () => setZoom(true));
    at(END + 1500, onDone);

    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onDone();
    window.addEventListener('keydown', onKey);
    return () => {
      timers.forEach(clearTimeout);
      window.removeEventListener('keydown', onKey);
    };
  }, [onDone]);

  const caption = Object.entries(CAPTIONS)
    .filter(([k]) => Number(k) < Math.max(filled, 1))
    .pop()?.[1];

  return (
    <motion.div
      data-intro
      role="dialog"
      aria-label="Welcome to sameen.os"
      className="fixed inset-0 z-[5000] grid place-items-center overflow-hidden bg-wall"
      animate={{ opacity: zoom ? 0 : 1 }}
      transition={{ duration: 0.4, delay: zoom ? 0.5 : 0 }}
    >
      <button
        onClick={onDone}
        className="absolute right-4 top-3 font-mono text-xs text-sub hover:text-ink"
      >
        skip intro →
      </button>

      <div className="flex flex-col items-center gap-5 lg:scale-[1.3]">
        {/* the little computer */}
        <motion.div
          aria-hidden
          className="flex flex-col items-center"
          style={{ transformOrigin: '50% 41px' }}
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1, scale: zoom ? 18 : 1 }}
          transition={zoom ? { duration: 0.9, ease: [0.7, 0, 0.3, 1] } : { duration: 0.6, ease: 'backOut' }}
        >
          <div className="flex h-[100px] w-[128px] justify-center rounded-xl border border-ink bg-win pt-2.5">
            <div className="relative h-[62px] w-[100px] rounded-md border border-ink bg-[#AFA9EC]">
              <span className="absolute left-[34px] top-[18px] h-2.5 w-1.5 rounded-sm bg-ink" />
              <motion.span
                animate={{ scaleY: wink ? 0.15 : 1 }}
                transition={{ duration: 0.12 }}
                className="absolute right-[34px] top-[18px] h-2.5 w-1.5 rounded-sm bg-ink"
              />
              <span className="absolute left-6 top-[30px] h-1 w-2 rounded-full bg-[#ED93B1]" />
              <span className="absolute right-6 top-[30px] h-1 w-2 rounded-full bg-[#ED93B1]" />
              <span className="absolute bottom-3 left-1/2 h-[9px] w-5 -translate-x-1/2 rounded-b-full border-[1.5px] border-t-0 border-ink" />
            </div>
          </div>
          <div className="h-3 w-[26px] border-x border-ink bg-win" />
          <div className="h-2.5 w-[84px] rounded border border-ink bg-win" />
        </motion.div>

        {/* welcome window with the progress bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: hideWin ? 0 : 1, y: 0 }}
          transition={{ duration: 0.4, delay: hideWin ? 0 : 0.5 }}
          className="w-[260px] overflow-hidden rounded-win border border-ink bg-win"
        >
          <div className="flex items-center gap-1.5 border-b border-ink bg-titlebar px-3 py-2 font-mono text-xs">
            <span className="size-2.5 rounded-full border border-ink bg-[#F09595]" />
            <span className="size-2.5 rounded-full border border-ink bg-[#FAC775]" />
            <span className="size-2.5 rounded-full border border-ink bg-[#97C459]" />
            <span className="ml-2">welcome.app</span>
          </div>
          <div className="p-4">
            <p className="font-serif text-2xl leading-none">
              welcome to <em>sameen.os</em>
            </p>
            <div
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={SEGMENTS}
              aria-valuenow={filled}
              className="mt-2.5 flex gap-[3px] rounded-md border border-ink p-[3px]"
            >
              {Array.from({ length: SEGMENTS }, (_, i) => (
                <span
                  key={i}
                  className="h-2.5 flex-1 rounded-[2px] transition-colors duration-150"
                  style={{ background: i < filled ? COLORS[i % COLORS.length] : 'transparent' }}
                />
              ))}
            </div>
            <p className="mt-2 font-mono text-xs text-sub">{caption}</p>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
