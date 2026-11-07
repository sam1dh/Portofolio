import { useEffect, useRef, useState, type ReactNode } from 'react';
import { motion } from 'motion/react';

export type FolderId = 'projects' | 'internships' | 'hobbies' | 'resume';

type Props = {
  onHighlight: (id: FolderId | null) => void;
  onWiggle: (id: FolderId) => void;
  onOpenResume: () => void;
  onClose?: () => void;
  hint: string;
};

type Msg = { id: number; from: 'bot' | 'me'; content?: ReactNode; typing?: boolean };

const CHAT_KEY = 'sameen-chat-seen';
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function Chat({ onHighlight, onWiggle, onOpenResume, onClose, hint }: Props) {
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
  const bot = (content: ReactNode, after?: () => void, pause = 400) => {
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

  // greeting (types the first time, instant after that)
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    reduce.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let seen = false;
    try {
      seen = sessionStorage.getItem(CHAT_KEY) === '1';
      sessionStorage.setItem(CHAT_KEY, '1');
    } catch {}
    fast.current = seen || reduce.current;

    bot(<>hi! i'm <span className="font-medium">sameen</span>.</>);
    bot(
      <>
        i build AI that <em className="font-serif text-[1.15em]">talks back</em>: voice agents and RAG pipelines.
      </>,
    );
    bot(`my work is in the folders ${hint}`, () => {
      fast.current = reduce.current;
      setChipsOn(true);
    });
  }, []);

  const ANSWERS: Record<string, () => void> = {
    'give me a tour': () => {
      bot(<>first: <b className="font-medium">projects/</b>. two builds, one placed 3rd of 650+ teams.</>, () => point('projects'), 1100);
      bot(<>next: <b className="font-medium">internships/</b>. three of them, up to production voice AI.</>, () => point('internships'), 1100);
      bot(<>last: <b className="font-medium">hobbies/</b>. debate, public speaking and hackathons.</>, () => point('hobbies'), 1100);
      bot('pick a folder and dive in.', () => onHighlight(null));
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
    'fun fact': () =>
      bot("i've won a debate competition and a public speaking prize. i can out-talk my own voice agent.", () =>
        point('hobbies'),
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
        <span className="relative size-8 shrink-0 rounded-full border border-ink bg-sticky" aria-hidden="true">
          <span className="absolute left-[8px] top-[11px] h-2 w-1 rounded-full bg-ink" />
          <span className="absolute right-[8px] top-[11px] h-2 w-1 rounded-full bg-ink" />
        </span>
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
              m.from === 'bot'
                ? 'max-w-[75%] origin-bottom-left self-start rounded-2xl border border-ink bg-titlebar px-3.5 py-2 text-[15px] leading-snug'
                : 'max-w-[75%] origin-bottom-right self-end rounded-2xl border border-ink bg-ink px-3.5 py-2 text-[15px] leading-snug text-win'
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
