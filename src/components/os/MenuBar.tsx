import { useEffect, useState } from 'react';

const fmt = () =>
  new Date()
    .toLocaleString('en-IN', { weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false })
    .toLowerCase();

export default function MenuBar() {
  const [now, setNow] = useState('');

  useEffect(() => {
    setNow(fmt());
    const t = setInterval(() => setNow(fmt()), 30_000);
    return () => clearInterval(t);
  }, []);

  return (
    <header
      style={{ viewTransitionName: 'menubar' }}
      className="flex items-center justify-between border-b border-ink bg-menu px-4 py-2 font-mono text-xs"
    >
      <nav className="flex gap-4">
        <a href="/" className="font-medium">sameen’s lab</a>
        <a href="/?intro=1" className="hover:underline max-md:hidden">replay intro</a>
      </nav>
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-[#1D9E75]" />
          <span className="max-sm:hidden">open to 2027 roles</span>
        </span>
        <span>{now}</span>
      </div>
    </header>
  );
}
