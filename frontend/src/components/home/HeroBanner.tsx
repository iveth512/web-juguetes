'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';

const showcase = [
  { src: '/media/batman', title: 'Batman', href: '/productos/funko-pop-batman-518' },
  { src: '/media/luffy-gear-5', title: 'Luffy Quinta Marcha', href: '/productos/funko-pop-luffy-quinta-marcha-1607' },
  { src: '/media/mel-arcane', title: 'Mel · Arcane', href: '/productos/funko-pop-mel-1489' },
];

/** Studio clip that only plays while visible and never when the user prefers reduced motion. */
function StudioClip({ src, title, href, priority }: (typeof showcase)[number] & { priority?: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) video.play().catch(() => {});
        else video.pause();
      },
      { threshold: 0.3 },
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  return (
    <Link href={href} className="group block focus-visible:outline-offset-4">
      <div className="overflow-hidden bg-[var(--color-showcase-raised)]">
        <video
          ref={ref}
          src={`${src}.mp4`}
          poster={`${src}.jpg`}
          muted
          loop
          playsInline
          preload={priority ? 'auto' : 'metadata'}
          aria-hidden="true"
          className="aspect-[9/16] w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
        />
      </div>
      <span className="mt-3 block text-sm font-medium text-[var(--color-showcase-muted)] transition-colors group-hover:text-[var(--color-showcase-text)]">
        {title}
      </span>
    </Link>
  );
}

export function HeroBanner() {
  return (
    <section className="grain bg-[var(--color-showcase)] text-[var(--color-showcase-text)] transition-colors duration-300">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 pb-14 pt-10 md:pb-20 md:pt-16 lg:grid-cols-[minmax(0,6fr)_minmax(0,6fr)] lg:gap-12">
        <div>
          <h1 className="type-hero">Míralo antes de tenerlo</h1>
          <p className="type-lead mt-6 max-w-[34ch] text-[var(--color-showcase-muted)]">
            Funko Pop! originales con envío a toda Colombia. Grabamos nuestras piezas en
            estudio, tal como llegan a tu casa.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
            <Link
              href="/productos"
              className="inline-flex min-h-12 items-center rounded-full bg-[var(--color-primary)] px-7 text-base font-semibold text-[var(--color-on-primary)] transition-colors hover:bg-[var(--color-primary-hover)] active:scale-[0.98]"
            >
              Ver catálogo
            </Link>
            <Link
              href="/ofertas"
              className="inline-flex min-h-12 items-center text-base font-semibold text-[var(--color-showcase-text)] underline decoration-[var(--color-primary)] decoration-2 underline-offset-[6px] transition-colors hover:text-[var(--color-primary-text)]"
            >
              Ofertas de la semana
            </Link>
          </div>
        </div>

        {/* Staggered like boxes on a shelf; scrolls sideways on phones instead of shrinking. */}
        <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 lg:mx-0 lg:grid lg:grid-cols-3 lg:gap-4 lg:overflow-visible lg:px-0 lg:pb-0">
          {showcase.map((clip, i) => (
            <div
              key={clip.src}
              className={
                'w-[42%] shrink-0 snap-start sm:w-[30%] lg:w-auto ' + (i === 1 ? 'lg:-mt-12' : 'lg:mt-12')
              }
            >
              <StudioClip {...clip} priority={i === 1} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
