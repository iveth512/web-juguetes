import { MetadataRoute } from 'next';

const API_URL = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://juguetesparafrikis.com';

  // Static pages
  const staticPages = [
    '', '/productos', '/ofertas', '/novedades', '/franquicias', '/buscar',
    '/envios', '/devoluciones', '/privacidad', '/nosotros', '/contacto',
  ].map(path => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: path === '' ? 1 : 0.8,
  }));

  // Dynamic product pages
  let productPages: MetadataRoute.Sitemap = [];
  try {
    const res = await fetch(`${API_URL}/products/?page_size=48`);
    if (res.ok) {
      const data = await res.json();
      productPages = data.results.map((p: { slug: string; created_at: string }) => ({
        url: `${baseUrl}/productos/${p.slug}`,
        lastModified: new Date(p.created_at),
        changeFrequency: 'daily' as const,
        priority: 0.9,
      }));
    }
  } catch {}

  return [...staticPages, ...productPages];
}
