import { motion, useAnimationControls } from 'motion/react';
import { useEffect } from 'react';

type Props = {
  label: string;
  href: string;
  tint: string;
  file?: boolean;
  lit?: boolean;
  wiggle?: number;
  vt?: string;
  onOpen?: () => void;
};

export default function FolderIcon({ label, href, tint, file, lit, wiggle = 0, vt, onOpen }: Props) {
  const controls = useAnimationControls();

  useEffect(() => {
    if (wiggle > 0) controls.start({ rotate: [0, -8, 8, -8, 8, 0], transition: { duration: 0.9 } });
  }, [wiggle, controls]);

  return (
    <a
  href={href}
  onClick={(e) => {
    if (onOpen) {
      e.preventDefault();
      onOpen();
    }
  }}
  className="group relative flex w-full flex-col items-center gap-1.5 font-mono text-[11px] md:w-21 md:text-xs"
>
      <span
        aria-hidden
        className={`pointer-events-none absolute -left-5 top-3 text-sm text-accent transition-opacity ${
          lit ? 'nudge opacity-100' : 'opacity-0'
        }`}
      >
        →
      </span>
      <motion.span
        animate={controls}
        style={vt ? { viewTransitionName: vt } : undefined}
        className={`${file ? 'file-icon' : 'folder'} ${tint} transition-[translate,scale] duration-150 group-hover:-translate-y-1 group-hover:-rotate-3 ${
          lit ? '-translate-y-1 scale-105 outline-2 outline-offset-4 outline-[#7F77DD]' : ''
        }`}
      />
      <span className="rounded-[5px] border-[1.5px] border-ink bg-win px-1.5 leading-relaxed">{label}</span>
    </a>
  );
}
