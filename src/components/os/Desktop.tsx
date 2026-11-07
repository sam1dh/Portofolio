import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import MenuBar from './MenuBar';
import Window from './Window';
import FolderIcon from './FolderIcon';
import Dock from './Dock';
import Intro from './Intro'; // new

type WinId = 'welcome' | 'contact';
type WinState = { open: boolean; z: number; nudge: number };

const WINDOWS: Record<WinId, { title: string; x: number; y: number; width: number }> = {
  welcome: { title: 'welcome.txt', x: 40, y: 32, width: 420 },
  contact: { title: 'contact.txt', x: 220, y: 140, width: 300 },
};

const EMAIL = 'sameendhanimisetti@gmail.com';
const SEEN_KEY = 'sameen-os-booted'; // new

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

function Welcome() {
  return (
    <div className="p-5">
      <h1 className="font-serif text-4xl leading-none">
        hi, i'm <em>sameen</em>.
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-sub">
        I build AI that talks back: voice agents, RAG pipelines, and the backends that keep them fast.
      </p>
      <p className="mt-3 font-mono text-xs text-accent">this window becomes the chat in step 4 ▌</p>
    </div>
  );
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
  const reduceMotion = useReducedMotion(); // new
  const [intro, setIntro] = useState(true); // new
  const [ready, setReady] = useState(false); // new
  const [top, setTop] = useState(10);
  const [wins, setWins] = useState<Record<WinId, WinState>>({
    welcome: { open: true, z: 10, nudge: 0 },
    contact: { open: false, z: 0, nudge: 0 },
  });

  // new: skip the intro for returning visitors or reduced motion
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

  // new: called when the intro ends or is skipped
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

  // new: staggered entrance for folders and dock
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
                  {id === 'welcome' ? <Welcome /> : <Contact />}
                </Window>
              ),
          )}

        <div className="absolute right-3 top-6 flex flex-col gap-5">
          <motion.div {...rise(0.35)}><FolderIcon label="projects/" href="/projects" tint="bg-mint" /></motion.div>
          <motion.div {...rise(0.46)}><FolderIcon label="internships/" href="/internships" tint="bg-sky" /></motion.div>
          <motion.div {...rise(0.57)}><FolderIcon label="hobbies/" href="/hobbies" tint="bg-blush" /></motion.div>
          <motion.div {...rise(0.68)}><FolderIcon label="resume.pdf" href="/resume.pdf" tint="bg-stone" file /></motion.div>
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
