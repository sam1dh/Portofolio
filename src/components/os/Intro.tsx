import { Fragment, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';

const SPIN = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

// the greeting, streamed one token at a time
const TOKENS: { t: string; em?: boolean }[] = [
  { t: 'hi,' },
  { t: " i'm " },
  { t: 'sameen', em: true },
  { t: '.' },
  { t: ' welcome' },
  { t: ' to' },
  { t: ' my ' },
  { t: 'lab', em: true },
  { t: '.' },
];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const Dim = ({ children }: { children: ReactNode }) => <span className="text-[#7F77DD]">{children}</span>;
const Hi = ({ children }: { children: ReactNode }) => <span className="text-[#FCFBFF]">{children}</span>;
const Tag = ({ children }: { children: ReactNode }) => <span className="text-[#FAC775]">{children}</span>;
const Check = () => <span className="text-[#5DCAA5]">✓</span>;
const Cursor = () => <span className="caret text-[#9FE1CB]">▌</span>;

function Prompt({ text, cursor }: { text: string; cursor?: boolean }) {
  return (
    <div>
      <span className="text-[#5DCAA5]">~/lab ❯</span> <Hi>{text}</Hi>
      {cursor && <Cursor />}
    </div>
  );
}

function Row({ label, value, note }: { label: string; value: ReactNode; note?: string }) {
  return (
    <div className="pl-4">
      <Check /> <Dim>{label.padEnd(8, ' ')}</Dim>
      {value}
      {note && (
        <>
          {' '}
          <Dim>{note}</Dim>
        </>
      )}
    </div>
  );
}

function Spinner({ k }: { k: number }) {
  return (
    <div className="pl-4">
      <span className="text-[#ED93B1]">{SPIN[k % SPIN.length]}</span> <Dim>resolving model…</Dim>
    </div>
  );
}

function Bar({ n }: { n: number }) {
  return (
    <div className="pl-4">
      <Dim>weights </Dim>
      <span className="text-[#ED93B1]">{'█'.repeat(n)}</span>
      <Dim>{'░'.repeat(16 - n)}</Dim> <Hi>{Math.round((n / 16) * 100)}%</Hi>
    </div>
  );
}

function Output({ count, cursor }: { count: number; cursor?: boolean }) {
  return (
    <div className="relative my-3 ml-4 rounded-lg border border-[#534AB7] px-4 pb-3 pt-4">
      <span className="absolute -top-2.5 left-3 bg-[#1E1A3A] px-1.5 text-[#7F77DD]">output</span>
      <p className="whitespace-normal font-serif text-2xl leading-snug text-[#FCFBFF] lg:text-[28px]">
        {TOKENS.slice(0, count).map((x, i) => (x.em ? <em key={i}>{x.t}</em> : <Fragment key={i}>{x.t}</Fragment>))}
        {cursor && <Cursor />}
      </p>
    </div>
  );
}

export default function Intro({ onDone }: { onDone: () => void }) {
  const [lines, setLines] = useState<{ id: number; node: ReactNode }[]>([]);
  const [leaving, setLeaving] = useState(false);
  const shellRef = useRef<HTMLDivElement>(null);
  const nid = useRef(0);
  const stopped = useRef(false);
  const finished = useRef(false);

  const add = (node: ReactNode) => {
    const id = nid.current++;
    setLines((l) => [...l, { id, node }]);
    return id;
  };
  const set = (id: number, node: ReactNode) => setLines((l) => l.map((x) => (x.id === id ? { ...x, node } : x)));

  // shrink the terminal window into the monitor (or the chat card on phones)
  const finish = useCallback(() => {
    if (finished.current) return;
    finished.current = true;
    try {
      sessionStorage.setItem('sameen-intro-played', '1');
    } catch {}
    stopped.current = true;
    setLeaving(true);

    const shell = shellRef.current;
    const target = Array.from(document.querySelectorAll<HTMLElement>('[data-screen]')).find((el) => {
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    });

    if (shell && target) {
      const a = shell.getBoundingClientRect();
      const b = target.getBoundingClientRect();
      Object.assign(shell.style, {
        position: 'fixed',
        left: `${a.left}px`,
        top: `${a.top}px`,
        width: `${a.width}px`,
        height: `${a.height}px`,
        margin: '0',
        transition: 'none',
      });
      shell.getBoundingClientRect(); // lock in the starting position
      const ease = 'cubic-bezier(0.65, 0, 0.35, 1)';
      Object.assign(shell.style, {
        transition: `left .7s ${ease}, top .7s ${ease}, width .7s ${ease}, height .7s ${ease}, border-radius .7s ${ease}, background-color .5s .25s`,
        left: `${b.left}px`,
        top: `${b.top}px`,
        width: `${b.width}px`,
        height: `${b.height}px`,
        borderRadius: '8px',
        backgroundColor: '#FCFBFF',
      });
    }
    setTimeout(onDone, 750);
  }, [onDone]);

  // the script
  useEffect(() => {
    const ok = () => !stopped.current;

    const type = async (text: string, speed: number) => {
      const id = add(<Prompt text="" cursor />);
      for (let i = 1; i <= text.length; i++) {
        if (!ok()) return false;
        set(id, <Prompt text={text.slice(0, i)} cursor />);
        await sleep(speed);
      }
      set(id, <Prompt text={text} />);
      return true;
    };

    (async () => {
      await sleep(300);
      if (!ok() || !(await type('run sameen --greet', 34))) return;

      const s = add(null);
      for (let k = 0; k < 7; k++) {
        if (!ok()) return;
        set(s, <Spinner k={k} />);
        await sleep(80);
      }
      set(s, <Row label="model" value={<Hi>sameen-v2027</Hi>} note="· cs @ vit · grad 2027" />);

      await sleep(130);
      if (!ok()) return;
      add(<Row label="device" value={<Hi>ai·box 01</Hi>} note="· pune, in" />);

      await sleep(130);
      if (!ok()) return;
      add(
        <Row
          label="skills"
          value={
            <>
              <Tag>voice-ai</Tag> <Dim>·</Dim> <Tag>rag</Tag> <Dim>·</Dim> <Tag>backends</Tag>
            </>
          }
        />,
      );

      await sleep(140);
      const b = add(null);
      for (let n = 1; n <= 16; n++) {
        if (!ok()) return;
        set(b, <Bar n={n} />);
        await sleep(26);
      }
      set(b, <Row label="weights" value={<Hi>loaded</Hi>} note="· 0.4s" />);

      await sleep(140);
      const o = add(null);
      for (let i = 0; i <= TOKENS.length; i++) {
        if (!ok()) return;
        set(o, <Output count={i} cursor />);
        await sleep(85);
      }
      set(o, <Output count={TOKENS.length} />);

      await sleep(120);
      if (!ok()) return;
      add(
        <div className="pl-4">
          <Check /> <Hi>done</Hi> <Dim>· 9 tokens · 41 tok/s · 0.21s</Dim>
        </div>,
      );

      await sleep(320);
      if (!ok() || !(await type('open lab', 45))) return;
      await sleep(260);
      if (ok()) finish();
    })();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === 'Escape') finish();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      stopped.current = true;
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  return (
    <div
      data-intro
      role="dialog"
      aria-label="Loading sameen’s lab"
      className={`fixed inset-0 z-[5000] grid place-items-center p-4 transition-colors duration-700 ${
        leaving ? 'bg-transparent' : 'bg-[rgb(18_14_40/0.86)]'
      }`}
    >
      <div
        ref={shellRef}
        className="w-full max-w-[560px] overflow-hidden rounded-xl border-[1.5px] border-[#1E1A3A] bg-[#1E1A3A]"
        style={{ animation: 'rise .35s ease backwards' }}
      >
        <div
          className={`flex items-center gap-1.5 border-b border-[#3C3489] bg-[#2C2754] px-3 py-2 font-mono text-xs text-[#AFA9EC] transition-opacity duration-200 ${
            leaving ? 'opacity-0' : ''
          }`}
        >
          <span className="size-2.5 rounded-full bg-[#F09595]" />
          <span className="size-2.5 rounded-full bg-[#FAC775]" />
          <span className="size-2.5 rounded-full bg-[#97C459]" />
          <span className="mx-auto">sameen@lab: ~/lab</span>
          <span>zsh</span>
        </div>
        <div
          aria-live="polite"
          className={`min-h-[300px] whitespace-pre-wrap px-4 py-3.5 font-mono text-[13px] leading-[1.7] text-[#E2DEFA] transition-opacity duration-200 lg:text-sm ${
            leaving ? 'opacity-0' : ''
          }`}
        >
          {lines.map((l) => (
            <Fragment key={l.id}>{l.node}</Fragment>
          ))}
        </div>
      </div>

      {!leaving && (
        <button onClick={finish} className="fixed bottom-4 right-5 font-mono text-xs text-[#AFA9EC] hover:text-white">
          skip ↵
        </button>
      )}
    </div>
  );
}
