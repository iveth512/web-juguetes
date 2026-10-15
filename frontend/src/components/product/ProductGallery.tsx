'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { Maximize2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ProductImage } from '@/types/product';

interface ProductGalleryProps {
  images: ProductImage[];
  productName: string;
  badge?: { label: string; className: string } | null;
}

export function ProductGallery({ images, productName, badge }: ProductGalleryProps) {
  const sortedImages = [...images].sort((a, b) => a.display_order - b.display_order);
  const [activeIndex, setActiveIndex] = useState(0);
  const [showZoom, setShowZoom] = useState(false);
  const [lensPos, setLensPos] = useState({ x: 0, y: 0 });
  const [bgPos, setBgPos] = useState({ x: 0, y: 0 });
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const mainRef = useRef<HTMLDivElement>(null);

  const activeImage = sortedImages[activeIndex] || null;
  const LENS_SIZE = 150;
  const ZOOM_FACTOR = 2.5;

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = mainRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Clamp lens position
      const lx = Math.max(LENS_SIZE / 2, Math.min(x, rect.width - LENS_SIZE / 2));
      const ly = Math.max(LENS_SIZE / 2, Math.min(y, rect.height - LENS_SIZE / 2));

      setLensPos({ x: lx - LENS_SIZE / 2, y: ly - LENS_SIZE / 2 });

      // Background position as percentage
      const px = (x / rect.width) * 100;
      const py = (y / rect.height) * 100;
      setBgPos({ x: px, y: py });
    },
    []
  );

  // Only a real hovering pointer gets the lens; touch goes straight to the lightbox.
  const handleMouseEnter = useCallback(() => {
    if (window.matchMedia('(hover: hover) and (min-width: 768px)').matches) setShowZoom(true);
  }, []);

  useEffect(() => {
    if (!lightboxOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxOpen(false);
    };
    window.addEventListener('keydown', onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [lightboxOpen]);
  const handleMouseLeave = useCallback(() => setShowZoom(false), []);

  return (
    <div className="relative">
      <div className="flex flex-col gap-3">
        {/* Main image */}
        <div
          ref={mainRef}
          className="relative aspect-square cursor-zoom-in overflow-hidden rounded-2xl bg-[var(--color-bg-alt)] md:cursor-crosshair"
          onMouseMove={handleMouseMove}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onClick={() => {
            if (activeImage) setLightboxOpen(true);
          }}
        >
          {activeImage ? (
            <Image
              src={activeImage.image}
              alt={activeImage.alt_text || productName}
              fill
              sizes="(max-width: 768px) 100vw, 55vw"
              className="object-contain"
              priority
              unoptimized
            />
          ) : (
            <div className="flex items-center justify-center h-full text-[var(--color-text-muted)] text-base">
              Imagen no disponible
            </div>
          )}

          {/* Badge */}
          {badge && (
            <span
              className={cn(
                'absolute top-3 left-3 z-10 rounded-full px-3 py-1 text-sm font-semibold',
                badge.className
              )}
            >
              {badge.label}
            </span>
          )}

          {/* Lens indicator (desktop only) */}
          {showZoom && activeImage && (
            <div
              className="hidden md:block absolute pointer-events-none z-20"
              style={{
                width: LENS_SIZE,
                height: LENS_SIZE,
                left: lensPos.x,
                top: lensPos.y,
                border: '2px solid var(--color-primary)',
                backgroundColor: 'rgba(255, 165, 0, 0.1)',
              }}
            />
          )}

          {activeImage && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setLightboxOpen(true);
              }}
              className="absolute bottom-3 right-3 z-10 flex min-h-11 items-center gap-2 rounded-full bg-[var(--color-bg-card)] px-4 text-sm font-medium text-[var(--color-text)] transition-colors hover:bg-[var(--color-bg)]"
            >
              <Maximize2 className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
              Ver en grande
            </button>
          )}
        </div>

        {/* Zoom panel (desktop, absolutely positioned right of gallery) */}
        {showZoom && activeImage && (
          <div
            aria-hidden="true"
            className="hidden md:block absolute top-0 left-[calc(100%+16px)] z-30 h-[400px] w-[400px] overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] shadow-xl"
            style={{
              backgroundImage: `url(${activeImage.image})`,
              backgroundSize: `${ZOOM_FACTOR * 100}%`,
              backgroundPosition: `${bgPos.x}% ${bgPos.y}%`,
              backgroundRepeat: 'no-repeat',
            }}
          />
        )}

        {/* Thumbnails */}
        {sortedImages.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {sortedImages.map((img, index) => (
              <button
                key={img.id}
                type="button"
                onClick={() => setActiveIndex(index)}
                aria-label={`Ver imagen ${index + 1} de ${sortedImages.length}`}
                aria-current={index === activeIndex ? 'true' : undefined}
                className={cn(
                  'h-[80px] w-[80px] shrink-0 overflow-hidden rounded-xl border-2 bg-[var(--color-bg-alt)]',
                  index === activeIndex
                    ? 'border-[var(--color-primary)]'
                    : 'border-[var(--color-border)] hover:border-[var(--color-primary)]/50'
                )}
              >
                <Image
                  src={img.image}
                  alt=""
                  width={80}
                  height={80}
                  className="object-contain w-full h-full"
                  unoptimized
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {lightboxOpen && activeImage && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Imagen ampliada de ${productName}`}
          className="fixed inset-0 z-[80] flex items-center justify-center bg-[var(--color-stage)] p-4 md:p-10"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            type="button"
            autoFocus
            className="absolute right-[max(1rem,env(safe-area-inset-right))] top-[max(1rem,env(safe-area-inset-top))] z-10 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-stage-raised)] text-[var(--color-stage-text)] transition-opacity hover:opacity-80"
            onClick={(e) => {
              e.stopPropagation();
              setLightboxOpen(false);
            }}
            aria-label="Cerrar imagen ampliada"
          >
            <X className="h-6 w-6" strokeWidth={1.75} aria-hidden="true" />
          </button>
          <div className="relative h-full w-full">
            <Image
              src={activeImage.image}
              alt={activeImage.alt_text || productName}
              fill
              className="object-contain"
              unoptimized
            />
          </div>
        </div>
      )}
    </div>
  );
}
