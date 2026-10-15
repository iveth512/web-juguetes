'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';

const clips = [
  { src: '/media/luffy-gear-5', title: 'Luffy Quinta Marcha', href: '/productos/funko-pop-luffy-quinta-marcha-1607' },
  { src: '/media/mel-arcane', title: 'Mel · Arcane', href: '/productos/funko-pop-mel-1489' },
  { src: '/media/viserion', title: 'Viserion de hielo', href: '/productos/funko-pop-viserion-de-hielo' },
  { src: '/media/spider-man', title: 'Spider-Man', href: '/productos?franchise=marvel' },
  { src: '/media/batman', title: 'Batman', href: '/productos/funko-pop-batman-518' },
  { src: '/media/deadpool-classics', title: 'Deadpool', href: '/productos?franchise=marvel' },
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
      className="group relative block shrink-0 w-[46%] sm:w-[30%] lg:w-auto snap-start overflow-hidden rounded-lg bg-[var(--color-secondary)]"
    >
      <video
        ref={ref}
        src={`${src}.mp4`}
        poster={`${src}.jpg`}
        muted
        loop
        playsInline
        preload="none"
        aria-label={`Video de ${title}`}
        className="aspect-[9/16] w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
      />
      <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-3 pb-3 pt-10 text-sm font-semibold text-white">
        {title}
      </span>
    </Link>
  );
}

export function VideoShowcase() {
  return (
    <section className="py-12 bg-[var(--color-bg)]">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="font-heading text-[22px] font-bold text-[var(--color-text)]">
              Nuestra vitrina en video
            </h2>
            <p className="text-sm text-[var(--color-text-muted)]">
              Cada pieza grabada en nuestro estudio, tal como llega a tu casa.
            </p>
          </div>
          <Link href="/productos" className="text-sm font-medium text-[var(--color-primary)] hover:underline">
            Ver catálogo &rarr;
          </Link>
        </div>
        <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 snap-x lg:mx-0 lg:grid lg:grid-cols-6 lg:overflow-visible lg:px-0">
          {clips.map((clip) => (
            <ShowcaseClip key={clip.src} {...clip} />
          ))}
        </div>
      </div>
    </section>
  );
}
