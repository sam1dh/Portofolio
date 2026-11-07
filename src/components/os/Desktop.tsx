import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import MenuBar from './MenuBar';
import Window from './Window';
import FolderIcon from './FolderIcon';
import Dock from './Dock';
import Intro from './Intro';
import Chat, { type FolderId } from './Chat';

type WinId = 'welcome' | 'contact';
type WinState = { open: boolean; z: number; nudge: number };

// centered chat on desktop; contact opens as a bottom sheet on phones
const WINDOWS: Record<WinId, { title: string; x: string; y: string; width: number; sheet?: boolean }> = {
  welcome: { title: 'sameen.chat', x: 'calc(50% - 280px)', y: 'max(24px, 6vh)', width: 560 },
  contact: { title: 'contact.txt', x: 'calc(50% + 120px)', y: 'max(140px, 22vh)', width: 300, sheet: true },
};

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
    const q = window.matchMedia('(max-width: 767px)');
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
        <button onClick={copy} className="rounded-lg border border-ink bg-ink px-3 py-2 font-mono text-xs text-win">
          {copied ? 'copied ✓' : 'copy email'}
        </button>
        <a href={`mailto:${EMAIL}`} className="rounded-lg border border-ink bg-menu px-3 py-2 font-mono text-xs">
          send mail ↗
        </a>
      </div>
    </div>
  );
}

export default function Desktop() {
  const deskRef = useRef<HTMLDivElement>(null);
  const decided = useRef(false);
  const isMobile = useIsMobile();
  const [intro, setIntro] = useState(true);
  const [ready, setReady] = useState(false);
  const [top, setTop] = useState(10);
  const [wins, setWins] = useState<Record<WinId, WinState>>({
    welcome: { open: true, z: 10, nudge: 0 },
    contact: { open: false, z: 0, nudge: 0 },
  });
  const [lit, setLit] = useState<FolderId | null>(null);
  const [wiggles, setWiggles] = useState<Record<FolderId, number>>({
    projects: 0,
    internships: 0,
    hobbies: 0,
    resume: 0,
  });
  const wiggle = useCallback((id: FolderId) => setWiggles((w) => ({ ...w, [id]: w[id] + 1 })), []);

  // decide once: replay (?intro=1), skip (already seen / reduced motion), or play
  useEffect(() => {
    if (decided.current) return;
    decided.current = true;
    if (new URLSearchParams(window.location.search).has('intro')) {
      window.history.replaceState(null, '', '/');
      return;
    }
    let seen = false;
    try {
      seen = sessionStorage.getItem(SEEN_KEY) === '1';
    } catch {}
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (seen || reduce) {
      setIntro(false);
      setReady(true);
    }
  }, []);

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
    <div className="flex min-h-dvh flex-col md:h-dvh md:overflow-hidden">
      {intro && <Intro onDone={finishIntro} />}
      <MenuBar />
      <div
        ref={deskRef}
        className="relative flex flex-1 flex-col gap-4 p-3 pb-28 md:block md:overflow-hidden md:p-0"
      >
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

        {/* phones: a row of folders on top. desktop: a column on the right */}
        <div className="order-first grid grid-cols-4 justify-items-center gap-1 pt-2 md:absolute md:right-3 md:top-6 md:flex md:flex-col md:gap-5 md:pt-0">
          {FOLDER_ICONS.map((f, i) => (
            <motion.div key={f.id} {...rise(0.35 + i * 0.11)} className="w-full md:w-auto">
              <FolderIcon
                label={f.label}
                href={f.href}
                tint={f.tint}
                file={f.file}
                lit={lit === f.id}
                wiggle={wiggles[f.id]}
                vt={f.file ? undefined : `folder-${f.id}`}
              />
            </motion.div>
          ))}
        </div>

        <div
          className="fixed bottom-[max(12px,env(safe-area-inset-bottom))] left-1/2 z-[1000] -translate-x-1/2 md:absolute md:bottom-3"
          style={{ viewTransitionName: 'dock' }}
        >
          <motion.div {...rise(0.5)}>
            <Dock
              items={[
                { label: 'me', onClick: () => open('welcome') },
                { label: '~/projects', short: 'proj', href: '/projects' },
                { label: '~/work', short: 'work', href: '/internships' },
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
