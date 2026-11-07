import { motion, useAnimationControls, useDragControls } from 'motion/react';
import { useEffect, type CSSProperties, type ReactNode, type RefObject } from 'react';

type Props = {
  title: string;
  x: string;
  y: string;
  width: number;
  z: number;
  nudge: number;
  sheet?: boolean;
  bounds: RefObject<HTMLDivElement | null>;
  isMobile: boolean;
  onFocus: () => void;
  onClose: () => void;
  children: ReactNode;
};

export default function Window({
  title, x, y, width, z, nudge, sheet, bounds, isMobile, onFocus, onClose, children,
}: Props) {
  const drag = useDragControls();
  const pop = useAnimationControls();

  useEffect(() => {
    pop.start({
      opacity: 1,
      scale: nudge === 0 ? [0.85, 1.03, 1] : [0.95, 1.03, 1],
      transition: { duration: 0.35 },
    });
  }, [nudge, pop]);

  return (
    <motion.div
      drag={!isMobile}
      dragControls={drag}
      dragListener={false}
      dragMomentum={false}
      dragConstraints={bounds}
      onPointerDown={onFocus}
      className={`relative w-full md:absolute md:left-[var(--x)] md:top-[var(--y)] md:w-[var(--w)] ${
        sheet ? 'max-md:fixed max-md:inset-x-2 max-md:bottom-24 max-md:w-auto' : ''
      }`}
      style={{ '--x': x, '--y': y, '--w': `${width}px`, zIndex: z } as CSSProperties}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={pop}
        className="overflow-hidden rounded-win border border-ink bg-win"
      >
        <div
          onPointerDown={(e) => !isMobile && drag.start(e)}
          className="flex select-none items-center gap-1.5 border-b border-ink bg-titlebar px-3 py-2 font-mono text-xs md:cursor-grab md:touch-none md:active:cursor-grabbing"
        >
          <button
            aria-label={`Close ${title}`}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={onClose}
            className="size-2.5 rounded-full border border-ink bg-[#F09595] hover:brightness-90"
          />
          <span className="size-2.5 rounded-full border border-ink bg-[#FAC775]" />
          <span className="size-2.5 rounded-full border border-ink bg-[#97C459]" />
          <span className="ml-2">{title}</span>
        </div>
        {children}
      </motion.div>
    </motion.div>
  );
}
