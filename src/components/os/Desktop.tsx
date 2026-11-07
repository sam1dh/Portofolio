import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import MenuBar from './MenuBar';
import Window from './Window';
import FolderIcon from './FolderIcon';
import Dock from './Dock';
import Intro from './Intro';
import Chat, { type FolderId } from './Chat'; // new

type WinId = 'welcome' | 'contact';
type WinState = { open: boolean; z: number; nudge: number };

const WINDOWS: Record<WinId, { title: string; x: number; y: number; width: number }> = {
  welcome: { title: 'sameen.chat', x: 40, y: 28, width: 470 }, // new title + width
  contact: { title: 'contact.txt', x: 220, y: 140, width: 300 },
};

// new: folder list in one place
const FOLDER_ICONS: { id: FolderId; label: string; href: string; tint: string; file?: boolean }[] = [
  { id: 'projects', label: 'projects/', href: '/projects', tint: 'bg-mint' },
  { id: 'internships', label: 'internships/', href: '/internships', tint: 'bg-sky' },
  { id: 'hobbies', label: 'hobbies/', href: '/hobbies', tint: 'bg-blush' },
  { id: 'resume', label: 'resume.pdf', href: '/resume.pdf', tint: 'bg-stone', file: true },
];

const EMAIL = 'sameendhanimisetti@gmail.com';
const SEEN_KEY = 'sameen-os-booted';

function useIsMobile() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const q = window.matchMedia('(max-width: 700px)');
    const update = () => setMobile(q.matches);
    update();
    q.addEventListener('change', update);
    return () => q.removeEventListener('change', update);
  }, []);
  return mobile;
}

function Contact() {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(EMAIL);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };
  return (
    <div className="p-4">
      <p className="font-serif text-2xl leading-tight">
        let's <em>talk</em>.
      </p>
      <p className="mt-1 text-sm text-sub">Open to SDE and AI engineering roles for 2027.</p>
      <p className="mt-3 break-all font-mono text-xs">{EMAIL}</p>
      <div className="mt-3 flex gap-2">
        <button onClick={copy} className="rounded-lg border border-ink bg-ink px-3 py-1.5 font-mono text-xs text-win">
          {copied ? 'copied ✓' : 'copy email'}
        </button>
        <a href={`mailto:${EMAIL}`} className="rounded-lg border border-ink bg-menu px-3 py-1.5 font-mono text-xs">
          send mail ↗
        </a>
      </div>
    </div>
  );
}

export default function Desktop() {
  const deskRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const reduceMotion = useReducedMotion();
  const [intro, setIntro] = useState(true);
  const [ready, setReady] = useState(false);
  const [top, setTop] = useState(10);
  const [wins, setWins] = useState<Record<WinId, WinState>>({
    welcome: { open: true, z: 10, nudge: 0 },
    contact: { open: false, z: 0, nudge: 0 },
  });

  // new: which folder the chat is pointing at, and wiggle counters
  const [lit, setLit] = useState<FolderId | null>(null);
  const [wiggles, setWiggles] = useState<Record<FolderId, number>>({
    projects: 0,
    internships: 0,
    hobbies: 0,
    resume: 0,
  });
  const wiggle = useCallback((id: FolderId) => setWiggles((w) => ({ ...w, [id]: w[id] + 1 })), []);

  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem(SEEN_KEY) === '1';
    } catch {}
    if (seen || reduceMotion) {
      setIntro(false);
      setReady(true);
    }
  }, [reduceMotion]);

  const finishIntro = useCallback(() => {
    try {
      sessionStorage.setItem(SEEN_KEY, '1');
    } catch {}
    setIntro(false);
    setReady(true);
  }, []);

  const focus = (id: WinId) => {
    const z = top + 1;
    setTop(z);
    setWins((w) => ({ ...w, [id]: { ...w[id], z } }));
  };

  const open = (id: WinId) => {
    const z = top + 1;
    setTop(z);
    setWins((w) => ({
      ...w,
      [id]: { open: true, z, nudge: w[id].open ? w[id].nudge + 1 : 0 },
    }));
  };

  const close = (id: WinId) => setWins((w) => ({ ...w, [id]: { ...w[id], open: false } }));

  const rise = (delay: number) => ({
    initial: { opacity: 0, y: 20 },
    animate: ready ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 },
    transition: { duration: 0.45, delay, ease: 'easeOut' as const },
  });

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      {intro && <Intro onDone={finishIntro} />}
      <MenuBar />
      <div ref={deskRef} className="relative flex-1 overflow-hidden">
        {ready &&
          (Object.keys(WINDOWS) as WinId[]).map(
            (id) =>
              wins[id].open && (
                <Window
                  key={id}
                  {...WINDOWS[id]}
                  z={wins[id].z}
                  nudge={wins[id].nudge}
                  bounds={deskRef}
                  isMobile={isMobile}
                  onFocus={() => focus(id)}
                  onClose={() => close(id)}
                >
                  {id === 'welcome' ? <Chat onHighlight={setLit} onWiggle={wiggle} /> : <Contact />}
                </Window>
              ),
          )}

        <div className="absolute right-3 top-6 flex flex-col gap-5">
          {FOLDER_ICONS.map((f, i) => (
            <motion.div key={f.id} {...rise(0.35 + i * 0.11)}>
              <FolderIcon
                label={f.label}
                href={f.href}
                tint={f.tint}
                file={f.file}
                lit={lit === f.id}
                wiggle={wiggles[f.id]}
              />
            </motion.div>
          ))}
        </div>

        <div className="absolute bottom-3 left-1/2 z-[1000] -translate-x-1/2">
          <motion.div {...rise(0.5)}>
            <Dock
              items={[
                { label: 'me', onClick: () => open('welcome') },
                { label: '~/projects', href: '/projects' },
                { label: '~/work', href: '/internships' },
                { label: 'fun', href: '/hobbies' },
                { label: 'cv', href: '/resume.pdf' },
                { label: '@', onClick: () => open('contact'), primary: true },
              ]}
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
