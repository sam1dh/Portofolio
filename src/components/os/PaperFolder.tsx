import { useEffect, type ReactNode } from 'react';
import { AnimatePresence, motion, useAnimate } from 'motion/react';
import type { Folder, FolderKey, Item } from '../../lib/folder-types';
import { TINT_HEX } from '../../lib/tints';

type Props = {
  folder: Folder;
  item?: string;
  compact: boolean;
  instant: boolean;
  closing: boolean;
  github: string;
  onNavigate: (folder: FolderKey, item?: string) => void;
  onRequestClose: () => void;
  onClosed: () => void;
};

const btn = 'rounded-lg border-[1.5px] border-ink bg-win px-2.5 py-1 font-mono text-xs hover:bg-titlebar';
const tile = 'rounded-xl border-[1.5px] border-ink p-3.5';
const label = 'mb-2 font-mono text-xs text-accent';

// "**bold**" in Markdown bullets becomes real bold text
function md(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**') ? (
      <b key={i} className="font-medium">
        {part.slice(2, -2)}
      </b>
    ) : (
      part
    ),
  );
}

function Card({ item, index, onOpen }: { item: Item; index: number; onOpen: () => void }) {
  const t = TINT_HEX[item.tint];
  const tilt = ['-rotate-[1.5deg]', 'rotate-[1.2deg]', '-rotate-[0.8deg]'][index % 3];
  return (
    <motion.a
      href={`/${item.folder}/${item.slug}`}
      onClick={(e) => {
        e.preventDefault();
        onOpen();
      }}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 + index * 0.08 }}
      className={`flex flex-col overflow-hidden rounded-xl border-[1.5px] border-ink bg-win transition-[rotate,translate] duration-300 hover:-translate-y-1 hover:rotate-0 ${tilt}`}
    >
      <div className="border-b-[1.5px] border-ink px-3.5 py-3" style={{ background: t.bg }}>
        <span className="rounded-md border-[1.5px] border-ink bg-win px-2 py-0.5 font-mono text-sm font-medium" style={{ color: t.ink }}>
          {item.icon}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-3.5">
        <h3 className="font-serif text-[26px] leading-none">{item.title}</h3>
        <p className="mt-1.5 text-[13px] leading-snug text-sub">{item.subtitle}</p>
        <p className={`mt-2.5 font-mono text-xs ${item.highlight ? 'text-[#854F0B]' : 'text-sub'}`}>{item.note}</p>
        <p className="mt-auto pt-3 font-mono text-xs text-accent">open →</p>
      </div>
    </motion.a>
  );
}

function List({ folder, github, onNavigate, onClose }: { folder: Folder; github: string; onNavigate: Props['onNavigate']; onClose: () => void }) {
  return (
    <>
      <header className="mb-5 flex flex-wrap items-baseline gap-x-3 gap-y-1 lg:ml-6">
        <h2 className="font-serif text-3xl leading-none lg:text-4xl">
          {folder.title[0]} <em>{folder.title[1]}</em>
        </h2>
        <span className="font-mono text-xs text-sub">{folder.sub}</span>
        <button className={`${btn} ml-auto`} onClick={onClose}>
          close ✕
        </button>
      </header>

      {folder.id === 'hobbies' ? (
        <div className="grid gap-x-5 gap-y-8 pt-2 sm:grid-cols-2 xl:grid-cols-3">
          {folder.hobbies.map((h, i) => (
            <div
              key={h.title}
              className="sticker rise"
              style={{ background: h.bg, rotate: `${[-3, 2.5, -1.5][i % 3]}deg`, animationDelay: `${i * 110}ms` }}
            >
              <span className="tape" aria-hidden="true" />
              <p className="font-serif text-4xl leading-none" style={{ color: h.ink }} aria-hidden="true">
                {h.glyph}
              </p>
              <h3 className="mt-3 text-[15px] font-medium" style={{ color: h.ink }}>
                {h.title}
              </h3>
              <p className="mt-1.5 text-[13px] leading-relaxed" style={{ color: h.ink }}>
                {h.text}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {folder.items.map((it, i) => (
            <Card key={it.slug} item={it} index={i} onOpen={() => onNavigate(folder.id, it.slug)} />
          ))}
          {folder.id === 'projects' && (
            <motion.a
              href={github}
              target="_blank"
              rel="noopener"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 + folder.items.length * 0.08 }}
              className="flex min-h-48 -rotate-[0.6deg] flex-col items-center justify-center rounded-xl border-[1.5px] border-dashed border-ink p-4 text-center transition-[rotate,translate] duration-300 hover:-translate-y-1 hover:rotate-0"
            >
              <span className="font-serif text-4xl">{'{ }'}</span>
              <span className="mt-2 text-sm font-medium">more on github</span>
              <span className="mt-1 font-mono text-xs text-sub">smaller builds and experiments ↗</span>
            </motion.a>
          )}
        </div>
      )}
    </>
  );
}

function Detail({ folder, item, onNavigate, onClose }: { folder: Folder; item: Item; onNavigate: Props['onNavigate']; onClose: () => void }) {
  const t = TINT_HEX[item.tint];
  const i = folder.items.findIndex((x) => x.slug === item.slug);
  const prev = folder.items[i - 1];
  const next = folder.items[i + 1];
  const hasSee = Boolean(item.live || item.code || item.cover);

  return (
    <>
      <header className="mb-4 flex flex-wrap items-center gap-2 lg:ml-6">
        <button className={btn} onClick={() => onNavigate(folder.id)}>
          ← {folder.id}
        </button>
        <span className="font-mono text-xs text-sub">
          {i + 1} of {folder.items.length}
        </span>
        <span className="ml-auto flex flex-wrap gap-2">
          {prev && (
            <button className={btn} onClick={() => onNavigate(folder.id, prev.slug)}>
              ← {prev.title}
            </button>
          )}
          {next && (
            <button className={btn} onClick={() => onNavigate(folder.id, next.slug)}>
              {next.title} →
            </button>
          )}
          <button className={btn} onClick={onClose}>
            close ✕
          </button>
        </span>
      </header>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <section className={`${tile} flex items-center gap-4 md:col-span-2`} style={{ background: t.bg }}>
          <span className="grid h-14 w-16 shrink-0 place-items-center rounded-xl border-[1.5px] border-ink bg-win font-mono text-lg font-medium" style={{ color: t.ink }}>
            {item.icon}
          </span>
          <div className="min-w-0">
            <h2 className="font-serif text-4xl leading-none">{item.title}</h2>
            <p className="mt-1 text-sm" style={{ color: t.ink }}>
              {item.subtitle}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {item.stack.map((s) => (
                <span key={s} className="pill">
                  {s}
                </span>
              ))}
            </div>
          </div>
        </section>

        {item.stat ? (
          <section className={`${tile} bg-sticky`}>
            <p className="mb-1 font-mono text-xs text-[#633806]">{item.labels[4]}</p>
            <p className="font-serif text-5xl leading-none text-[#412402]">{item.stat}</p>
            <p className="mt-1 font-mono text-xs text-[#633806]">{item.statLabel}</p>
            <p className="mt-2 text-xs leading-snug text-[#633806]">{item.result}</p>
          </section>
        ) : (
          <section className={`${tile} bg-win`}>
            <p className={label}>{item.labels[4]}</p>
            <p className="text-sm leading-relaxed">{item.result}</p>
          </section>
        )}

        <section className={`${tile} bg-win`}>
          <p className={label}>details</p>
          <dl className="space-y-1.5">
            {item.meta.map(([k, v]) => (
              <div key={k}>
                <dt className="font-mono text-[11px] text-sub">{k}</dt>
                <dd className="text-sm leading-snug">{v}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className={`${tile} bg-win md:col-span-2 lg:row-span-2`}>
          <p className={label}>{item.labels[1]}</p>
          <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed">
            {item.points.map((p) => (
              <li key={p}>{md(p)}</li>
            ))}
          </ul>
        </section>

        <section className={`${tile} bg-win md:col-span-2`}>
          <p className={label}>{item.labels[0]}</p>
          <p className="text-sm leading-relaxed">{item.intro}</p>
        </section>

        <section className={`${tile} bg-win ${hasSee ? '' : 'md:col-span-2'}`}>
          <p className={label}>{item.labels[2]}</p>
          <div className="flex flex-col items-start gap-1">
            {item.flow.map((f, n) => (
              <span key={f} className="flex flex-col items-start">
                {n > 0 && (
                  <span className="pl-3 text-sub" aria-hidden="true">
                    ↓
                  </span>
                )}
                <span className="rounded-md border border-ink px-2 py-0.5 font-mono text-xs" style={{ background: t.bg, color: t.ink }}>
                  {f}
                </span>
              </span>
            ))}
          </div>
        </section>

        {hasSee && (
          <section className={`${tile} flex flex-col gap-2 bg-win`}>
            <p className={`${label} mb-0`}>see it</p>
            {item.cover ? (
              <img src={item.cover} alt={`${item.title} screenshot`} className="w-full rounded-lg border border-ink" loading="lazy" />
            ) : (
              item.live && <p className="break-all font-mono text-xs text-sub">{new URL(item.live).host}</p>
            )}
            <div className="mt-auto flex flex-wrap gap-2">
              {item.live && (
                <a href={item.live} target="_blank" rel="noopener noreferrer" className={`${btn} bg-ink text-win hover:bg-ink`}>
                  live demo ↗
                </a>
              )}
              {item.code && (
                <a href={item.code} target="_blank" rel="noopener noreferrer" className={btn}>
                  code ↗
                </a>
              )}
            </div>
          </section>
        )}
      </div>
    </>
  );
}

export default function PaperFolder({ folder, item, compact, instant, closing, github, onNavigate, onRequestClose, onClosed }: Props) {
  const [scope, animate] = useAnimate();
  const current = item ? folder.items.find((x) => x.slug === item) : undefined;

  const parts = () => {
    const root = scope.current as HTMLElement;
    return {
      shell: root.querySelector<HTMLElement>('[data-shell]')!,
      cover: root.querySelector<HTMLElement>('[data-cover]'),
    };
  };
  const reduce = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // distance from the folder's center to its icon in the corner
  const offset = (shell: HTMLElement) => {
    const icon = document.querySelector(`[data-folder-icon="${folder.id}"]`);
    if (!icon) return { x: 0, y: 0 };
    const a = icon.getBoundingClientRect();
    const b = shell.getBoundingClientRect();
    return { x: a.left + a.width / 2 - (b.left + b.width / 2), y: a.top + a.height / 2 - (b.top + b.height / 2) };
  };

  // open: fly in from the corner, then swing the cover open
  useEffect(() => {
    const { shell } = parts();
    shell.focus({ preventScroll: true });
    if (instant) return;
    const { cover } = parts();
    (async () => {
      if (compact) {
        await animate(shell, { y: ['100%', '0%'], opacity: [0, 1] }, { duration: 0.4, ease: [0.65, 0, 0.35, 1] });
        return;
      }
      if (reduce()) {
        if (cover) cover.style.display = 'none';
        await animate(shell, { opacity: [0, 1] }, { duration: 0.2 });
        return;
      }
      const o = offset(shell);
      await animate(shell, { opacity: [0, 1], x: [o.x, 0], y: [o.y, 0], scale: [0.08, 1], rotate: [-10, 0] }, { duration: 0.6, ease: 'backOut' });
      if (cover) await animate(cover, { rotateY: -172 }, { duration: 0.6, ease: [0.6, 0, 0.3, 1] });
    })();
  }, []);

  // close: shut the cover, then fly back to the corner
  useEffect(() => {
    if (!closing) return;
    const { shell, cover } = parts();
    (async () => {
      if (compact) {
        await animate(shell, { y: '100%' }, { duration: 0.3, ease: [0.6, 0, 0.4, 1] });
      } else if (reduce()) {
        await animate(shell, { opacity: 0 }, { duration: 0.15 });
      } else {
        if (cover && cover.style.display !== 'none') await animate(cover, { rotateY: 0 }, { duration: 0.45, ease: [0.6, 0, 0.4, 1] });
        const o = offset(shell);
        await animate(shell, { x: o.x, y: o.y, scale: 0.08, rotate: -10, opacity: 0 }, { duration: 0.4, ease: [0.6, 0, 0.4, 1] });
      }
      onClosed();
    })();
  }, [closing]);

  // Esc closes the folder
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onRequestClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onRequestClose]);

  const color = folder.color;

  return (
    <div ref={scope} className="fixed inset-0 z-[900]">
      <motion.div
        className="absolute inset-0 bg-[rgb(30_26_58/0.38)]"
        initial={{ opacity: instant ? 1 : 0 }}
        animate={{ opacity: closing ? 0 : 1 }}
        transition={{ duration: 0.35 }}
        onClick={onRequestClose}
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 top-12 flex items-end lg:inset-0 lg:items-center lg:justify-center lg:pb-28 lg:pl-8 lg:pr-[170px] lg:pt-16">
        <motion.div
          data-shell
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-label={`${folder.id} folder`}
          initial={instant ? false : { opacity: 0 }}
          className="pointer-events-auto relative h-full w-full outline-none lg:h-[min(700px,100%)] lg:max-w-[1120px]"
          style={{ perspective: 1600 }}
        >
          {/* tab */}
          <div className="absolute left-0 top-0 hidden h-9 w-52 items-center rounded-t-xl border-[1.5px] border-b-0 border-ink px-4 font-mono text-sm font-medium lg:flex" style={{ background: color }}>
            {folder.id}/
          </div>

          {/* folder body */}
          <div
            className="absolute inset-0 rounded-t-2xl border-[1.5px] border-b-0 border-ink p-3 pt-2 lg:top-[34px] lg:rounded-[0_16px_16px_16px] lg:border-b-[1.5px] lg:p-5"
            style={{ background: color }}
          >
            <div className="mx-auto mb-2 h-1.5 w-12 rounded-full bg-ink/30 lg:hidden" />
            <div className="absolute inset-x-8 bottom-4 top-3 hidden rotate-[1.4deg] rounded-lg border-[1.5px] border-ink bg-stone lg:block" />
            <div className="absolute inset-x-6 bottom-3 top-5 hidden -rotate-1 rounded-lg border-[1.5px] border-ink bg-win lg:block" />
            <div className="relative h-[calc(100%-14px)] overflow-y-auto rounded-xl border-[1.5px] border-ink bg-win p-4 lg:h-full lg:p-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={current?.slug ?? 'list'}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18 }}
                >
                  {current ? (
                    <Detail folder={folder} item={current} onNavigate={onNavigate} onClose={onRequestClose} />
                  ) : (
                    <List folder={folder} github={github} onNavigate={onNavigate} onClose={onRequestClose} />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
            <svg className="absolute left-10 top-1 hidden lg:block" width="18" height="46" viewBox="0 0 16 40" aria-hidden="true">
              <path d="M4 36V8a4 4 0 0 1 8 0v24a2.5 2.5 0 0 1-5 0V10" fill="none" stroke="#5A5578" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>

          {/* front cover with the label sticker */}
          <motion.div
            data-cover
            initial={{ rotateY: instant ? -172 : 0 }}
            className="absolute inset-0 top-[34px] hidden items-center justify-center rounded-[0_16px_16px_16px] border-[1.5px] border-ink lg:flex"
            style={{ background: color, transformOrigin: 'left center', backfaceVisibility: 'hidden' }}
            aria-hidden="true"
          >
            <div className="relative -rotate-2 rounded-xl border-[1.5px] border-ink bg-win px-10 py-6 text-center">
              <p className="font-serif text-6xl leading-none">{folder.id}/</p>
              <p className="mt-2 font-mono text-sm text-sub">{folder.sub}</p>
              <span className="absolute -right-5 -top-5 grid size-12 rotate-12 place-items-center rounded-full border-[1.5px] border-ink bg-sticky text-xl">✦</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
