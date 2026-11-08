import { useEffect, useRef, useState, type ReactNode } from 'react';
import { motion } from 'motion/react';
import type { FolderKey } from '../../lib/folder-types';

export type FolderId = 'projects' | 'internships' | 'hobbies' | 'resume';

type Props = {
  onHighlight: (id: FolderId | null) => void;
  onWiggle: (id: FolderId) => void;
  onOpenResume: () => void;
  onClose?: () => void;
  onSpeaking?: (talking: boolean) => void;
  hint: string;
  onOpenFolder: (folder: FolderKey, item?: string) => void;
  tourItems: Record<FolderKey, { label: string; slug?: string }[]>;
  onStartTour?: () => void;
};

type Msg = { id: number; from: 'bot' | 'me'; content?: ReactNode; typing?: boolean; wide?: boolean };

const CHAT_KEY = 'sameen-chat-seen';
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const TOUR: { id: FolderKey; label: string; text: string }[] = [
  { id: 'projects', label: 'projects/', text: 'two builds, one placed 3rd of 650+ teams.' },
  { id: 'internships', label: 'internships/', text: 'three internships, up to production voice AI.' },
  { id: 'hobbies', label: 'hobbies/', text: 'debate, public speaking and hackathons.' },
];

// one card that updates in place instead of posting a message per step
function TourCard({
  items,
  onStep,
  onOpen,
}: {
  items: Record<FolderKey, { label: string; slug?: string }[]>;
  onStep: (id: FolderKey | null) => void;
  onOpen: (folder: FolderKey, item?: string) => void;
}) {
  const [i, setI] = useState(0);
  const done = i >= TOUR.length;

  useEffect(() => {
    onStep(done ? null : TOUR[i].id);
  }, [i]);

  const btn = 'rounded-lg border border-ink px-2.5 py-1 font-mono text-xs';

  if (done) {
    return (
      <div>
        <p className="font-mono text-xs text-[#0F6E56]">✓ tour done</p>
        <p className="mt-1 text-sm">pick a folder, or ask me something else.</p>
      </div>
    );
  }

  const s = TOUR[i];
  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <span className="font-mono text-xs text-sub">tour · {i + 1}/{TOUR.length}</span>
        <span className="h-1 flex-1 overflow-hidden rounded-full bg-titlebar">
          <span
            className="block h-full rounded-full bg-[#5DCAA5] transition-[width] duration-300"
            style={{ width: `${((i + 1) / TOUR.length) * 100}%` }}
          />
        </span>
      </div>
      <p className="text-sm leading-snug">
        <b className="font-medium">{s.label}</b> {s.text}
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {items[s.id].map((it) => (
          <button
            key={it.label}
            onClick={() => onOpen(s.id, it.slug)}
            className="rounded-full border border-ink bg-menu px-2 py-0.5 font-mono text-[11px] hover:bg-titlebar"
          >
            {it.label}
          </button>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button onClick={() => onOpen(s.id)} className={`${btn} bg-ink text-win`}>
          open {s.label} ↗
        </button>
        {i > 0 && (
          <button onClick={() => setI(i - 1)} className={`${btn} bg-win hover:bg-titlebar`}>
            back
          </button>
        )}
        <button onClick={() => setI(i + 1)} className={`${btn} ml-auto bg-win hover:bg-titlebar`}>
          {i === TOUR.length - 1 ? 'finish' : 'next →'}
        </button>
      </div>
    </div>
  );
}

export default function Chat({ onHighlight, onWiggle, onOpenResume, onClose, onSpeaking, onOpenFolder, tourItems, onStartTour, hint }: Props) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [chipsOn, setChipsOn] = useState(false);
  const [used, setUsed] = useState<string[]>([]);
  const nextId = useRef(0);
  const queue = useRef<Promise<void>>(Promise.resolve());
  const alive = useRef(true);
  const started = useRef(false);
  const fast = useRef(false);
  const reduce = useRef(false);
  const scroller = useRef<HTMLDivElement>(null);
  const speak = useRef(onSpeaking);
  speak.current = onSpeaking;

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  // keep the newest message in view
  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: 'smooth' });
  }, [msgs]);

  // bot messages run one after another, each with a short "typing…" moment
  const bot = (content: ReactNode, after?: () => void, pause = 400, wide = false) => {
    queue.current = queue.current.then(async () => {
      if (!alive.current) return;
      const id = nextId.current++;
      if (fast.current) {
        setMsgs((m) => [...m, { id, from: 'bot', content, wide }]);
        after?.();
        return;
      }
      speak.current?.(true);
      setMsgs((m) => [...m, { id, from: 'bot', typing: true }]);
      await sleep(550);
      if (!alive.current) return;
      setMsgs((m) => m.map((x) => (x.id === id ? { ...x, typing: false, content, wide } : x)));
      after?.();
      await sleep(250);
      speak.current?.(false);
      await sleep(pause);
    });
  };

  const me = (text: string) => setMsgs((m) => [...m, { id: nextId.current++, from: 'me', content: text }]);

  const point = (id: FolderId) => {
    onHighlight(id);
    onWiggle(id);
  };

  // greeting (types the first time, instant after that)
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    reduce.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let seen = false;
    let introPlayed = false;
    try {
      seen = sessionStorage.getItem(CHAT_KEY) === '1';
      introPlayed = sessionStorage.getItem('sameen-intro-played') === '1';
      sessionStorage.setItem(CHAT_KEY, '1');
    } catch {}
    fast.current = seen || reduce.current;

    if (introPlayed) {
      // the terminal already introduced me, so don't repeat it
      bot('glad you made it in.');
    } else {
      bot(<>hi! i'm <span className="font-medium">sameen</span>.</>);
      bot(
        <>
          i build AI that <em className="font-serif text-[1.15em]">talks back</em>: voice agents and RAG pipelines.
        </>,
      );
    }
    bot(`my work is in the folders ${hint}, or ask me something.`, () => {
      fast.current = reduce.current;
      setChipsOn(true);
    });
  }, []);

  const ANSWERS: Record<string, () => void> = {
    'give me a tour': () => {
      if (onStartTour) {
        // laptops: the duck leads the tour
        bot('follow the duck →', () => onStartTour());
      } else {
        // phones: no room, so use the tour card
        bot(
          <TourCard items={tourItems} onOpen={onOpenFolder} onStep={(id) => (id ? point(id) : onHighlight(null))} />,
          undefined,
          400,
          true,
        );
      }
    },
    "i'm a recruiter": () =>
      bot(
        <>
          great timing. i graduate in 2027 and i'm open to SDE and AI engineering roles.
          <button
            onClick={onOpenResume}
            className="mt-2 block rounded-full border border-ink bg-ink px-3 py-1 font-mono text-xs text-win"
          >
            open my résumé →
          </button>
        </>,
        () => point('resume'),
      ),
    'what are you best at?': () =>
      bot(
        "building AI that works in real time: RAG pipelines, voice agents, and the backends under them. that's what i shipped at Blostem.",
        () => point('internships'),
      ),
  };

  const ask = (q: string) => {
    if (used.includes(q)) return;
    setUsed((u) => [...u, q]);
    onHighlight(null);
    me(q);
    ANSWERS[q]();
  };

  const dot = 'size-3 rounded-full border border-ink';

  return (
    <div className="flex h-full flex-col bg-win text-ink">
      <div className="flex items-center gap-1.5 border-b-[1.5px] border-ink bg-titlebar px-3 py-2 font-mono text-[13px]">
        {onClose ? (
          <button aria-label="Put the computer to sleep" onClick={onClose} className={`${dot} bg-[#F09595] hover:brightness-90`} />
        ) : (
          <span className={`${dot} bg-[#F09595]`} />
        )}
        <span className={`${dot} bg-[#FAC775]`} />
        <span className={`${dot} bg-[#97C459]`} />
        <span className="ml-2">sameen.chat</span>
        <span className="ml-auto text-[#0F6E56]">● online</span>
      </div>

      <div className="flex items-center gap-2.5 border-b border-dashed border-[#AFA9EC] px-4 py-2">
        <img
          src="/props/teddy.gif"
          alt=""
          aria-hidden="true"
          className="size-8 shrink-0 rounded-full border border-ink bg-sticky object-cover"
        />
        <span className="leading-tight">
          <span className="text-sm font-medium">sameen</span>
          <br />
          <span className="font-mono text-[11px] text-sub">replies instantly · pune</span>
        </span>
      </div>

      <div ref={scroller} aria-live="polite" className="flex flex-1 flex-col gap-2 overflow-y-auto px-4 py-3">
        <div className="mt-auto" />
        {msgs.map((m) => (
          <motion.div
            key={m.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={
  m.from === 'me'
    ? 'max-w-[75%] origin-bottom-right self-end rounded-2xl border border-ink bg-ink px-3.5 py-2 text-[15px] leading-snug text-win'
    : m.wide && !m.typing
      ? 'w-full max-w-[92%] origin-bottom-left self-start rounded-2xl border border-ink bg-win px-3.5 py-3'
      : 'max-w-[75%] origin-bottom-left self-start rounded-2xl border border-ink bg-titlebar px-3.5 py-2 text-[15px] leading-snug'
}
          >
            {m.typing ? (
              <span aria-label="typing" className="flex gap-1 text-[10px]">
                <span className="typing-dot">●</span>
                <span className="typing-dot" style={{ animationDelay: '0.2s' }}>●</span>
                <span className="typing-dot" style={{ animationDelay: '0.4s' }}>●</span>
              </span>
            ) : (
              m.content
            )}
          </motion.div>
        ))}
      </div>

      <div className="flex min-h-[52px] flex-wrap items-center gap-2 border-t-[1.5px] border-ink px-4 py-2.5">
        {chipsOn &&
          Object.keys(ANSWERS).map((q, i) => {
            const isUsed = used.includes(q);
            return (
              <motion.button
                key={q}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: isUsed ? 0.4 : 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                onClick={() => ask(q)}
                className={`rounded-full border border-ink px-3 py-1 font-mono text-[13px] ${
                  i === 0 && !isUsed ? 'bg-ink text-win' : 'bg-win hover:bg-titlebar'
                }`}
              >
                {q}
              </motion.button>
            );
          })}
      </div>
    </div>
  );
}
