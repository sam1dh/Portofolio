type Item = {
  label: string;
  href?: string;
  onClick?: () => void;
  primary?: boolean;
};

export default function Dock({ items }: { items: Item[] }) {
  return (
    <nav aria-label="Dock" className="flex gap-2 rounded-screen border border-ink bg-menu p-2">
      {items.map((it) => {
        const cls = `grid h-9 min-w-9 place-items-center rounded-win border border-ink px-2 font-mono text-xs transition-transform hover:-translate-y-1.5 ${
          it.primary ? 'bg-ink text-win' : 'bg-win'
        }`;
        return it.href ? (
          <a key={it.label} href={it.href} className={cls}>{it.label}</a>
        ) : (
          <button key={it.label} onClick={it.onClick} className={cls}>{it.label}</button>
        );
      })}
    </nav>
  );
}
