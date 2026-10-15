import type { Metadata } from 'next';
import { HeroBanner } from '@/components/home/HeroBanner';
import { NewProductsSection, FeaturedProductsSection } from '@/components/home/ProductSection';
import { OffersSection } from '@/components/home/OffersSection';
import { TrustBadges } from '@/components/home/TrustBadges';
import { VideoShowcase } from '@/components/home/VideoShowcase';

export const metadata: Metadata = {
  title: 'Juguetes para Frikis — Funko Pop! originales en Colombia',
  description:
    'Tienda online de Funko Pop! originales en Colombia: Demon Slayer, Naruto, One Piece, Pokémon, Marvel, Star Wars y mucho más. Envío a todo el país.',
};

export default function HomePage() {
  return (
    <>
      <HeroBanner />
      <NewProductsSection />
      <OffersSection />
      <FeaturedProductsSection />
      <VideoShowcase />
      <TrustBadges />
    </>
  );
}
