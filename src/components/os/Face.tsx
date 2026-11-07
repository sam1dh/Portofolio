import { useEffect, useRef } from 'react';

export default function Face({ size = 62 }: { size?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const k = size / 62;
  const px = (n: number) => `${n * k}px`;

  // pupils follow the visitor's pointer
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const pupils = el.querySelectorAll<HTMLSpanElement>('[data-pupil]');
    let raf = 0;
    const move = (e: PointerEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        pupils.forEach((p) => {
          const r = p.parentElement!.getBoundingClientRect();
          const a = Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2));
          p.style.transform = `translate(${Math.cos(a) * 3 * k}px, ${Math.sin(a) * 3.5 * k}px)`;
        });
      });
    };
    window.addEventListener('pointermove', move);
    return () => {
      window.removeEventListener('pointermove', move);
      cancelAnimationFrame(raf);
    };
  }, [k]);

  return (
    <div
      ref={ref}
      aria-hidden
      className="relative shrink-0 rounded-full border border-ink bg-sticky"
      style={{ width: size, height: size }}
    >
      {(['left', 'right'] as const).map((side) => (
        <span
          key={side}
          className="eye absolute overflow-hidden rounded-full border border-ink bg-white"
          style={{ [side]: px(13), top: px(20), width: px(14), height: px(16) }}
        >
          <span
            data-pupil
            className="absolute rounded-full bg-ink transition-transform duration-75"
            style={{ left: px(3), top: px(3), width: px(7), height: px(8) }}
          />
        </span>
      ))}
      <span className="absolute rounded-full bg-[#ED93B1]" style={{ left: px(6), top: px(36), width: px(9), height: px(5) }} />
      <span className="absolute rounded-full bg-[#ED93B1]" style={{ right: px(6), top: px(36), width: px(9), height: px(5) }} />
      <span
        className="absolute left-1/2 -translate-x-1/2 border border-t-0 border-ink"
        style={{ bottom: px(12), width: px(16), height: px(8), borderRadius: `0 0 ${px(16)} ${px(16)}` }}
      />
    </div>
  );
}
