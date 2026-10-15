import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Franquicias — Juguetes para Frikis',
  description:
    'Funko Pop! originales por franquicia: anime, Marvel, Star Wars, música y más, con envío a toda Colombia.',
};

export default function FranquiciasLayout({ children }: { children: React.ReactNode }) {
  return children;
}
