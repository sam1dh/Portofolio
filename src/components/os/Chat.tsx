import { useEffect, useRef, useState, type ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import Face from './Face';

export type FolderId = 'projects' | 'internships' | 'hobbies' | 'resume';

type Props = {
  onHighlight: (id: FolderId | null) => void;
  onWiggle: (id: FolderId) => void;
};

type Msg = { id: number; from: 'bot' | 'me'; content?: ReactNode; typing?: boolean };

const CHAT_KEY = 'sameen-chat-seen';
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const FOLDERS: { id: FolderId; href: string; tint: string; desc: string }[] = [
  { id: 'projects', href: '/projects', tint: 'bg-mint', desc: 'things i built, with the full story' },
  { id: 'internships', href: '/internships', tint: 'bg-sky', desc: "where i've worked and what i did" },
  { id: 'hobbies', href: '/hobbies', tint: 'bg-blush', desc: "what i do when i'm not coding" },
];

function FolderMap({ onHighlight }: { onHighlight: Props['onHighlight'] }) {
  return (
    <div>
      <p>here's where everything lives. go explore:</p>
      <div className="-mx-1.5 mt-1.5">
        {FOLDERS.map((f) => (
          <a
            key={f.id}
            href={f.href}
            onMouseEnter={() => onHighlight(f.id)}
            onMouseLeave={() => onHighlight(null)}
            onFocus={() => onHighlight(f.id)}
            onBlur={() => onHighlight(null)}
            className="flex items-center gap-2.5 rounded-lg px-1.5 py-1.5 transition-colors hover:bg-win"
          >
            <span className={`h-[15px] w-5 shrink-0 rounded-[1px_3px_3px_3px] border border-ink ${f.tint}`} />
            <span className="flex-1 leading-snug">
              <span className="font-mono text-xs font-medium">{f.id}/</span>
              <br />
              <span className="text-xs text-sub">{f.desc}</span>
            </span>
            <span className="text-sub">→</span>
          </a>
        ))}
      </div>
    </div>
  );
}

export default function Chat({ onHighlight, onWiggle }: Props) {
  const reduce = useReducedMotion();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [chipsOn, setChipsOn] = useState(false);
  const [used, setUsed] = useState<string[]>([]);
  const nextId = useRef(0);
  const queue = useRef(Promise.resolve());
  const alive = useRef(true);
  const started = useRef(false);
  const fast = useRef(false);
  const scroller = useRef<HTMLDivElement>(null);

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
  const bot = (content: ReactNode, after?: () => void, pause = 450) => {
    queue.current = queue.current.then(async () => {
      if (!alive.current) return;
      const id = nextId.current++;
      if (fast.current) {
        setMsgs((m) => [...m, { id, from: 'bot', content }]);
        after?.();
        return;
      }
      setMsgs((m) => [...m, { id, from: 'bot', typing: true }]);
      await sleep(550);
      if (!alive.current) return;
      setMsgs((m) => m.map((x) => (x.id === id ? { ...x, typing: false, content } : x)));
      after?.();
      await sleep(pause);
    });
  };

  const me = (text: string) => setMsgs((m) => [...m, { id: nextId.current++, from: 'me', content: text }]);

  const point = (id: FolderId) => {
    onHighlight(id);
    onWiggle(id);
  };

  // greeting
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    let seen = false;
    try {
      seen = sessionStorage.getItem(CHAT_KEY) === '1';
      sessionStorage.setItem(CHAT_KEY, '1');
    } catch {}
    fast.current = seen || !!reduce;

    bot(<>hi! i'm <span className="font-medium">sameen</span>.</>);
    bot(
      <>
        i build AI that <em className="font-serif text-base">talks back</em>: voice agents, RAG pipelines, and the
        backends that keep them fast.
      </>,
    );
    bot(<FolderMap onHighlight={onHighlight} />);
    bot('or ask me something first.', () => {
      fast.current = !!reduce;
      setChipsOn(true);
    });
  }, []);

  const ANSWERS: Record<string, () => void> = {
    'give me a tour': () => {
      bot(
        <>first stop: <b className="font-medium">projects/</b>. two builds, including FD Salahkar, 3rd of 650+ teams.</>,
        () => point('projects'),
        1100,
      );
      bot(
        <>next: <b className="font-medium">internships/</b>. three of them, from QA to production voice AI at Blostem.</>,
        () => point('internships'),
        1100,
      );
      bot(
        <>last: <b className="font-medium">hobbies/</b>. debate, public speaking, and lots of hackathons.</>,
        () => point('hobbies'),
        1100,
      );
      bot("that's the tour. pick a folder and dive in.", () => onHighlight(null));
    },
    "i'm a recruiter": () =>
      bot(
        "great timing. i graduate in 2027 and i'm open to SDE and AI engineering roles. my résumé is on the desktop, and @ in the dock reaches me.",
        () => point('resume'),
      ),
    'what are you best at?': () =>
      bot(
        "building AI that works in real time: RAG pipelines, voice agents, and the backends under them. that's what i shipped at Blostem.",
        () => point('internships'),
      ),
    'give me a fun fact': () =>
      bot(
        "i've won a debate competition and a public speaking prize. so yes, i can out-talk my own voice agent.",
        () => point('hobbies'),
      ),
  };

  const ask = (q: string) => {
    if (used.includes(q)) return;
    setUsed((u) => [...u, q]);
    onHighlight(null);
    me(q);
    ANSWERS[q]();
  };

  return (
    <div className="flex flex-col">
      <div ref={scroller} aria-live="polite" className="flex h-80 flex-col gap-2 overflow-y-auto p-3.5">
        <div className="mt-auto" />
        {msgs.map((m) =>
          m.from === 'bot' ? (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex origin-bottom-left items-end gap-2"
            >
              <Face size={26} />
              <div className="max-w-[310px] rounded-2xl border border-ink bg-titlebar px-3 py-2 text-[13px] leading-relaxed">
                {m.typing ? (
                  <span aria-label="typing" className="flex gap-1 text-[10px]">
                    <span className="typing-dot">●</span>
                    <span className="typing-dot" style={{ animationDelay: '0.2s' }}>●</span>
                    <span className="typing-dot" style={{ animationDelay: '0.4s' }}>●</span>
                  </span>
                ) : (
                  m.content
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex origin-bottom-right justify-end"
            >
              <div className="max-w-[310px] rounded-2xl border border-ink bg-ink px-3 py-2 text-[13px] text-win">
                {m.content}
              </div>
            </motion.div>
          ),
        )}
      </div>

      <div className="flex min-h-12 flex-wrap gap-1.5 border-t border-ink px-3.5 py-2.5">
        {chipsOn &&
          Object.keys(ANSWERS).map((q, i) => {
            const isUsed = used.includes(q);
            return (
              <motion.button
                key={q}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: isUsed ? 0.45 : 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                onClick={() => ask(q)}
                className={`rounded-full border border-ink px-3 py-1.5 font-mono text-[11px] ${
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
