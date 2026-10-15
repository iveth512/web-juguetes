'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';

// The hero already shows Batman, Luffy and Mel; this band carries the rest of the studio footage.
const clips = [
  { src: '/media/viserion', title: 'Viserion de hielo', href: '/productos/funko-pop-viserion-de-hielo' },
  { src: '/media/deadpool-classics', title: 'Deadpool · Pop! Classics', href: '/productos?franchise=marvel' },
  { src: '/media/spider-man', title: 'Spider-Man', href: '/productos?franchise=marvel' },
];

/** Plays only the clips on screen, and none when the user prefers reduced motion. */
function ShowcaseClip({ src, title, href }: (typeof clips)[number]) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) video.play().catch(() => {});
        else video.pause();
      },
      { threshold: 0.4 },
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  return (
    <Link
      href={href}
      className="group block w-[62%] shrink-0 snap-start sm:w-[40%] md:w-auto"
    >
      <div className="overflow-hidden bg-[var(--color-stage-raised)]">
      <video
        ref={ref}
        src={`${src}.mp4`}
        poster={`${src}.jpg`}
        muted
        loop
        playsInline
        preload="none"
        aria-hidden="true"
        className="aspect-[4/5] w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
      />
      </div>
      <span className="mt-3 block text-base font-medium text-[var(--color-stage-muted)] transition-colors group-hover:text-[var(--color-stage-text)]">
        {title}
      </span>
    </Link>
  );
}

export function VideoShowcase() {
  return (
    <section className="bg-[var(--color-stage)] py-16 text-[var(--color-stage-text)] md:py-24">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-x-8 gap-y-3 md:mb-10">
          <div className="max-w-xl">
            <h2 className="type-section">Así llegan a tu casa</h2>
            <p className="mt-3 text-base text-[var(--color-stage-muted)]">
              Cada pieza grabada en nuestro estudio, tal como llega a tu casa.
            </p>
          </div>
          <Link
            href="/productos"
            className="inline-flex min-h-11 items-center text-base font-semibold underline decoration-[var(--color-accent)] decoration-2 underline-offset-[6px] hover:text-[var(--color-accent)]"
          >
            Ver catálogo
          </Link>
        </div>
        <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-3 md:gap-6 md:overflow-visible md:px-0 md:pb-0">
          {clips.map((clip) => (
            <ShowcaseClip key={clip.src} {...clip} />
          ))}
        </div>
      </div>
    </section>
  );
}
