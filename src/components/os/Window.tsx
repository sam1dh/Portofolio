import { motion, useAnimationControls, useDragControls } from 'motion/react';
import { useEffect, type ReactNode, type RefObject } from 'react';

type Props = {
  title: string;
  x: number;
  y: number;
  width: number;
  z: number;
  nudge: number;
  bounds: RefObject<HTMLDivElement | null>;
  isMobile: boolean;
  onFocus: () => void;
  onClose: () => void;
  children: ReactNode;
};

export default function Window({
  title, x, y, width, z, nudge, bounds, isMobile, onFocus, onClose, children,
}: Props) {
  const drag = useDragControls();
  const pop = useAnimationControls();

  // pop in on open, small bounce when reopened from the dock
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
      className={isMobile ? 'absolute inset-x-2 top-2' : 'absolute'}
      style={isMobile ? { zIndex: z } : { left: x, top: y, width, zIndex: z }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={pop}
        className="overflow-hidden rounded-win border border-ink bg-win"
      >
        <div
          onPointerDown={(e) => !isMobile && drag.start(e)}
          className="flex cursor-grab touch-none select-none items-center gap-1.5 border-b border-ink bg-titlebar px-3 py-2 font-mono text-xs active:cursor-grabbing"
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
