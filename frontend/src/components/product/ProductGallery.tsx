'use client';

import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
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

  const handleMouseEnter = useCallback(() => setShowZoom(true), []);
  const handleMouseLeave = useCallback(() => setShowZoom(false), []);

  return (
    <div className="relative">
      <div className="flex flex-col gap-3">
        {/* Main image */}
        <div
          ref={mainRef}
          className="relative aspect-square bg-[var(--color-bg-alt)] rounded-lg border border-[var(--color-border)] overflow-hidden cursor-crosshair"
          onMouseMove={handleMouseMove}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onClick={() => {
            // Mobile: open lightbox
            if (window.matchMedia('(max-width: 768px)').matches) {
              setLightboxOpen(true);
            }
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
            <div className="flex items-center justify-center h-full text-[var(--color-text-muted)] text-sm">
              [Imagen no disponible]
            </div>
          )}

          {/* Badge */}
          {badge && (
            <span
              className={cn(
                'absolute top-3 left-3 px-3 py-1 rounded text-xs font-semibold z-10',
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

          {/* Zoom hint */}
          <span className="hidden md:block absolute bottom-2 right-2 text-xs text-[var(--color-text-muted)] bg-[var(--color-bg-card)] bg-opacity-80 px-2 py-1 rounded z-10">
            Hover para zoom
          </span>
        </div>

        {/* Zoom panel (desktop, absolutely positioned right of gallery) */}
        {showZoom && activeImage && (
          <div
            className="hidden md:block absolute top-0 left-[calc(100%+16px)] w-[400px] h-[400px] border border-[var(--color-border)] rounded-lg overflow-hidden z-30 bg-white"
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
          <div className="flex gap-2 overflow-x-auto">
            {sortedImages.map((img, index) => (
              <button
                key={img.id}
                onClick={() => setActiveIndex(index)}
                className={cn(
                  'shrink-0 w-[80px] h-[80px] rounded border-2 overflow-hidden bg-[var(--color-bg-alt)]',
                  index === activeIndex
                    ? 'border-[var(--color-primary)]'
                    : 'border-[var(--color-border)] hover:border-[var(--color-primary)]/50'
                )}
              >
                <Image
                  src={img.image}
                  alt={img.alt_text || `${productName} - ${index + 1}`}
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

      {/* Mobile lightbox */}
      {lightboxOpen && activeImage && (
        <div
          className="fixed inset-0 z-50 bg-black flex items-center justify-center md:hidden"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            className="absolute top-4 right-4 text-white text-3xl z-50 w-10 h-10 flex items-center justify-center"
            onClick={(e) => {
              e.stopPropagation();
              setLightboxOpen(false);
            }}
            aria-label="Cerrar"
          >
            &times;
          </button>
          <div className="relative w-full h-full">
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
