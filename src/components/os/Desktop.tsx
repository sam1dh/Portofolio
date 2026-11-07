import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import MenuBar from './MenuBar';
import Window from './Window';
import FolderIcon from './FolderIcon';
import Dock from './Dock';
import Intro from './Intro';
import Chat, { type FolderId } from './Chat';
import Resume from './Resume';
import DeskScene from './DeskScene';

type WinId = 'contact' | 'resume';
type WinState = { open: boolean; z: number; nudge: number };

const WINDOWS: Record<WinId, { title: string; x: string; y: string; width: number; sheet?: boolean }> = {
  contact: { title: 'contact.txt', x: 'calc(50% + 140px)', y: 'max(120px, 18vh)', width: 300, sheet: true },
  resume: { title: 'resume.pdf — preview', x: 'calc(50% - 270px)', y: 'max(16px, 3vh)', width: 540 },
};

const FOLDER_ICONS: { id: FolderId; label: string; href: string; tint: string; file?: boolean }[] = [
  { id: 'projects', label: 'projects/', href: '/projects', tint: 'bg-[#9FE1CB]' },
  { id: 'internships', label: 'internships/', href: '/internships', tint: 'bg-[#B5D4F4]' },
  { id: 'hobbies', label: 'hobbies/', href: '/hobbies', tint: 'bg-[#F4C0D1]' },
  { id: 'resume', label: 'resume.pdf', href: '/resume.pdf', tint: 'bg-win', file: true },
];

const EMAIL = 'sameendhanimisetti@gmail.com';
const SEEN_KEY = 'sameen-os-booted';

// phones and tablets get the simple layout; laptops and bigger get the room
function useCompact() {
  const [compact, setCompact] = useState<boolean | null>(null);
  useEffect(() => {
    const q = window.matchMedia('(max-width: 1023px)');
    const update = () => setCompact(q.matches);
    update();
    q.addEventListener('change', update);
    return () => q.removeEventListener('change', update);
  }, []);
  return compact;
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

// what the PC shows when the chat is closed
function Sleep({ onWake }: { onWake: () => void }) {
  return (
    <button
      type="button"
      onClick={onWake}
      className="flex h-full w-full flex-col items-center justify-center gap-3 bg-[#AFA9EC] text-ink"
    >
      <span className="relative block size-16 rounded-full border border-ink bg-sticky" aria-hidden="true">
        <span className="absolute left-[14px] top-[28px] h-0.5 w-4 rounded bg-ink" />
        <span className="absolute right-[14px] top-[28px] h-0.5 w-4 rounded bg-ink" />
        <span className="zz absolute -right-4 -top-1 font-mono text-sm">z</span>
        <span className="zz absolute -right-6 -top-4 font-mono text-sm" style={{ animationDelay: '0.7s' }}>z</span>
      </span>
      <span className="font-mono text-[13px]">click to wake me up</span>
    </button>
  );
}

export default function Desktop() {
  const deskRef = useRef<HTMLDivElement>(null);
  const decided = useRef(false);
  const topZ = useRef(10);
  const compact = useCompact();
  const [intro, setIntro] = useState(true);
  const [ready, setReady] = useState(false);
  const [awake, setAwake] = useState(true);
  const [night, setNight] = useState(false);
  const [wins, setWins] = useState<Record<WinId, WinState>>({
    contact: { open: false, z: 0, nudge: 0 },
    resume: { open: false, z: 0, nudge: 0 },
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

  const focus = useCallback((id: WinId) => {
    const z = ++topZ.current;
    setWins((w) => ({ ...w, [id]: { ...w[id], z } }));
  }, []);

  const open = useCallback((id: WinId) => {
    const z = ++topZ.current;
    setWins((w) => ({
      ...w,
      [id]: { open: true, z, nudge: w[id].open ? w[id].nudge + 1 : 0 },
    }));
  }, []);

  const close = (id: WinId) => setWins((w) => ({ ...w, [id]: { ...w[id], open: false } }));

  // phones get the PDF directly; bigger screens get the preview window
  const openResume = useCallback(() => {
    if (window.matchMedia('(max-width: 767px)').matches) window.location.href = '/resume.pdf';
    else open('resume');
  }, [open]);

  const rise = (delay: number) => ({
    initial: { opacity: 0, y: 20 },
    animate: ready ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 },
    transition: { duration: 0.45, delay, ease: 'easeOut' as const },
  });

  const chat =
    ready && compact !== null ? (
      <Chat
        onHighlight={setLit}
        onWiggle={wiggle}
        onOpenResume={openResume}
        onClose={
          compact
            ? undefined
            : () => {
                setLit(null);
                setAwake(false);
              }
        }
        hint={compact ? 'above ↑' : 'on the right →'}
      />
    ) : null;

  const screen = awake ? chat : <Sleep onWake={() => setAwake(true)} />;

  const folders = FOLDER_ICONS.map((f, i) => (
    <motion.div key={f.id} {...rise(0.35 + i * 0.11)} className="w-full md:w-auto">
      <FolderIcon
        label={f.label}
        href={f.href}
        tint={f.tint}
        file={f.file}
        lit={lit === f.id}
        wiggle={wiggles[f.id]}
        vt={f.file ? undefined : `folder-${f.id}`}
        onOpen={f.file ? openResume : undefined}
      />
    </motion.div>
  ));

  return (
    <div className="flex min-h-dvh flex-col lg:h-dvh lg:overflow-hidden">
      {intro && <Intro onDone={finishIntro} />}
      <MenuBar />
      <div ref={deskRef} className="relative flex-1 lg:overflow-hidden">
        {/* laptops and bigger: the desk room */}
        <div className="absolute inset-0 max-lg:hidden">
          <DeskScene
            night={night}
            onLamp={() => setNight((n) => !n)}
            screen={compact === false ? screen : null}
            folders={compact === false ? folders : null}
          />
        </div>

        {/* phones and tablets: simple layout */}
        <div className="mx-auto flex w-full max-w-xl flex-col gap-4 p-3 pb-28 lg:hidden">
          <div className="grid grid-cols-4 justify-items-center gap-1 pt-2">{compact === true && folders}</div>
          <div className="h-[60dvh] overflow-hidden rounded-win border-[1.5px] border-ink bg-win">
            {compact === true && chat}
          </div>
        </div>

        {/* contact and résumé windows */}
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
                  isMobile={compact === true}
                  onFocus={() => focus(id)}
                  onClose={() => close(id)}
                >
                  {id === 'resume' ? <Resume /> : <Contact />}
                </Window>
              ),
          )}

        <div
          className="fixed bottom-[max(12px,env(safe-area-inset-bottom))] left-1/2 z-[1000] -translate-x-1/2 lg:absolute lg:bottom-3"
          style={{ viewTransitionName: 'dock' }}
        >
          <motion.div {...rise(0.5)}>
            <Dock
              items={[
                { label: 'me', onClick: () => setAwake(true) },
                { label: '~/projects', short: 'proj', href: '/projects' },
                { label: '~/work', short: 'work', href: '/internships' },
                { label: 'fun', href: '/hobbies' },
                { label: 'cv', onClick: openResume },
                { label: '@', onClick: () => open('contact'), primary: true },
              ]}
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
