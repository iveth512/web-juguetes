'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const slides = [
  {
    badge: 'Anime',
    title: 'Funko Pop! de Demon Slayer, Naruto y One Piece',
    description:
      'Inosuke, Nezuko, Sasuke, Luffy y sus compañeros de aventura listos para tu vitrina.',
    image: { src: '/media/luffy-gear-5.jpg', alt: 'Funko Pop! de Luffy Quinta Marcha' },
    cta: 'Ver Demon Slayer',
    ctaLink: '/productos?franchise=demon-slayer',
    ctaSecondary: 'Ver One Piece',
    ctaSecondaryLink: '/productos?franchise=one-piece',
  },
  {
    badge: 'Marvel',
    title: 'Funko Pop! de Marvel y el Spider-Verse',
    description:
      'Spider-Man, Miles Morales, los Vengadores y más héroes de Marvel en su versión Funko Pop!.',
    image: { src: '/media/spider-man.jpg', alt: 'Funko Pop! de Spider-Man en su caja' },
    cta: 'Ver Marvel',
    ctaLink: '/productos?franchise=marvel',
    ctaSecondary: 'Todas las franquicias',
    ctaSecondaryLink: '/franquicias',
  },
  {
    badge: 'Ofertas de la semana',
    title: 'Funko Pop! con descuento por tiempo limitado',
    description:
      'Cada semana seleccionamos Funko Pop! con precio especial. Aprovecha antes de que se agoten.',
    image: { src: '/media/batman.jpg', alt: 'Funko Pop! de Batman iluminado' },
    cta: 'Ver ofertas de la semana',
    ctaLink: '/ofertas',
    ctaSecondary: 'Novedades',
    ctaSecondaryLink: '/novedades',
  },
];

export function HeroBanner() {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % slides.length);
  }, []);

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [isPaused, next]);

  const slide = slides[current];

  return (
    <section
      className="relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, var(--color-secondary) 0%, var(--color-primary) 100%)',
      }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="max-w-7xl mx-auto px-4 py-10 min-h-[85vh] sm:min-h-0 md:py-20 flex flex-col justify-center">
        <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
          {/* Left side */}
          <div className="flex-1 text-white text-center md:text-left">
            <span className="inline-block px-3 py-1 rounded-full bg-[var(--color-accent)] text-white text-xs font-semibold mb-4">
              {slide.badge}
            </span>
            <h1 className="font-heading text-2xl sm:text-3xl md:text-4xl font-extrabold leading-tight mb-4">
              {slide.title}
            </h1>
            <p className="text-white/80 text-sm sm:text-base mb-6 max-w-md mx-auto md:mx-0">
              {slide.description}
            </p>
            <div className="flex flex-wrap gap-3 justify-center md:justify-start">
              <Link
                href={slide.ctaLink}
                className="inline-flex items-center px-6 py-3 rounded-lg bg-[var(--color-primary)] text-white font-semibold text-sm hover:bg-[var(--color-primary-hover)] transition-colors"
              >
                {slide.cta}
              </Link>
              <Link
                href={slide.ctaSecondaryLink}
                className="inline-flex items-center px-6 py-3 rounded-lg border-2 border-white/40 text-white font-semibold text-sm hover:bg-white/10 transition-colors"
              >
                {slide.ctaSecondary}
              </Link>
            </div>
          </div>

          <div className="flex-shrink-0 mt-4 md:mt-0">
            <Image
              key={slide.image.src}
              src={slide.image.src}
              alt={slide.image.alt}
              width={540}
              height={960}
              priority
              className="w-52 sm:w-56 md:w-64 aspect-[3/4] object-cover rounded-2xl border border-white/20 shadow-2xl"
            />
          </div>
        </div>

        {/* Navigation dots */}
        <div className="flex justify-center gap-2 mt-8 md:mt-10">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              aria-label={`Ir a slide ${i + 1}`}
              className={cn(
                'h-2 rounded-full transition-all duration-300',
                i === current
                  ? 'w-8 bg-[var(--color-primary)]'
                  : 'w-2 bg-white/50 hover:bg-white/80'
              )}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
