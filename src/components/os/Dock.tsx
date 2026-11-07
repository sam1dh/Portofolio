type Item = {
  label: string;
  short?: string;
  href?: string;
  onClick?: () => void;
  primary?: boolean;
};

export default function Dock({ items }: { items: Item[] }) {
  return (
    <nav aria-label="Dock" className="flex gap-1.5 rounded-screen border border-ink bg-menu p-1.5 md:gap-2 md:p-2">
      {items.map((it) => {
        const cls = `grid h-10 min-w-10 place-items-center rounded-win border border-ink px-2 font-mono text-xs transition-transform hover:-translate-y-1.5 md:h-9 md:min-w-9 ${
          it.primary ? 'bg-ink text-win' : 'bg-win'
        }`;
        const text = it.short ? (
          <>
            <span className="md:hidden">{it.short}</span>
            <span className="max-md:hidden">{it.label}</span>
          </>
        ) : (
          it.label
        );
        return it.href ? (
          <a key={it.label} href={it.href} aria-label={it.label} className={cls}>{text}</a>
        ) : (
          <button key={it.label} onClick={it.onClick} aria-label={it.label} className={cls}>{text}</button>
        );
      })}
    </nav>
  );
}
