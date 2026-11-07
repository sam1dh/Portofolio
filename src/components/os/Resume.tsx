import { useState } from 'react';

const UPDATED = 'nov 2026'; // change this whenever you update the PDF

export default function Resume() {
  const [zoom, setZoom] = useState(100);
  const [missing, setMissing] = useState(false);
  const set = (z: number) => setZoom(Math.max(70, Math.min(160, z)));

  return (
    <div>
      <div className="flex flex-wrap items-center gap-1.5 border-b border-ink bg-menu px-2.5 py-2 font-mono text-[11px]">
        <button onClick={() => set(zoom - 10)} aria-label="Zoom out" className="tb">−</button>
        <span className="w-10 text-center">{zoom}%</span>
        <button onClick={() => set(zoom + 10)} aria-label="Zoom in" className="tb">+</button>
        <span className="ml-1.5 text-sub max-sm:hidden">updated {UPDATED}</span>
        <span className="ml-auto flex gap-1.5">
          <a href="/resume.pdf" target="_blank" rel="noopener noreferrer" className="tb">open ↗</a>
          <a href="/resume.pdf" download="Sameen_Dhanimisetti_Resume.pdf" className="tb bg-ink text-win">
            download ↓
          </a>
        </span>
      </div>
      <div className="h-[min(62vh,560px)] overflow-auto bg-titlebar p-4">
        {missing ? (
          <div className="grid h-full place-items-center text-center font-mono text-xs text-sub">
            preview isn't ready yet. use open ↗ to see the PDF.
          </div>
        ) : (
          <img
            src="/resume-preview.png"
            alt="Sameen Dhanimisetti's résumé, page 1"
            onError={() => setMissing(true)}
            style={{ width: `${zoom}%` }}
            className="mx-auto block max-w-none border border-ink bg-white transition-[width] duration-200"
          />
        )}
      </div>
    </div>
  );
}
