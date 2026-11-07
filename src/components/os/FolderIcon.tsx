import { motion, useAnimationControls } from 'motion/react';
import { useEffect } from 'react';

type Props = {
  id: string;
  label: string;
  href: string;
  tint: string;
  file?: boolean;
  lit?: boolean;
  picked?: boolean;
  wiggle?: number;
  onOpen?: () => void;
};

export default function FolderIcon({ id, label, href, tint, file, lit, picked, wiggle = 0, onOpen }: Props) {
  const controls = useAnimationControls();

  useEffect(() => {
    if (wiggle > 0) controls.start({ rotate: [0, -8, 8, -8, 8, 0], transition: { duration: 0.9 } });
  }, [wiggle, controls]);

  const glow = lit ? '-translate-y-1 scale-105 outline-2 outline-offset-4 outline-[#7F77DD]' : '';

  return (
    <a
      href={href}
      onClick={(e) => {
        if (onOpen) {
          e.preventDefault();
          onOpen();
        }
      }}
      className="group relative flex w-full flex-col items-center gap-1.5 font-mono text-[11px] lg:w-24 lg:text-xs"
    >
      <span
        aria-hidden
        className={`pointer-events-none absolute -left-4 top-3 text-sm text-accent transition-opacity ${
          lit ? 'nudge opacity-100' : 'opacity-0'
        }`}
      >
        →
      </span>
      {file ? (
        <motion.svg
          data-folder-icon={id}
          animate={controls}
          width="40"
          height="47"
          viewBox="0 0 32 38"
          aria-hidden
          className={`transition-[translate,scale] duration-150 group-hover:-translate-y-1 ${glow}`}
        >
          <path d="M1 1h21l9 9v27H1z" fill="#FCFBFF" stroke="#1E1A3A" strokeWidth="1.5" />
          <path d="M22 1v9h9" fill="#E2DEFA" stroke="#1E1A3A" strokeWidth="1.5" />
          <path d="M6 17h20M6 22h20M6 27h13" stroke="#AFA9EC" strokeWidth="2" />
        </motion.svg>
      ) : (
        <motion.span
          data-folder-icon={id}
          animate={controls}
          className={`folder ${tint} transition-[translate,scale,opacity] duration-150 group-hover:-translate-y-1 group-hover:-rotate-3 ${
            picked ? 'border-dashed opacity-40' : ''
          } ${glow}`}
        />
      )}
      <span
        className={`rounded-[5px] border-[1.5px] border-ink px-1.5 leading-relaxed ${
          picked ? 'bg-ink text-win' : 'bg-win'
        }`}
      >
        {label}
      </span>
    </a>
  );
}
