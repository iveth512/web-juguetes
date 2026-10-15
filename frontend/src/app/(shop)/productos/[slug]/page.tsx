import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getProduct } from '@/lib/api';
import { ProductGallery, type GalleryBadge } from '@/components/product/ProductGallery';
import { ProductInfo } from '@/components/product/ProductInfo';
import { ProductCard } from '@/components/product/ProductCard';
import { ReviewSection } from '@/components/product/ReviewSection';
import type { ProductDetail } from '@/types/product';

type Props = {
  params: Promise<{ slug: string }>;
};

async function fetchProduct(slug: string): Promise<ProductDetail | null> {
  try {
    return await getProduct(slug);
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await fetchProduct(slug);

  if (!product) {
    return { title: 'Producto no encontrado' };
  }

  const imageUrl = product.images.find((i) => i.is_primary)?.image || product.images[0]?.image;

  return {
    title: `${product.name} — Juguetes para Frikis`,
    description: product.short_description || product.description?.slice(0, 160),
    openGraph: {
      title: product.name,
      description: product.short_description,
      images: imageUrl ? [{ url: imageUrl }] : [],
      type: 'website',
    },
  };
}

function getBadge(product: ProductDetail): GalleryBadge | null {
  const soldOut =
    product.has_variants && product.variants.length > 0
      ? product.variants.every((v) => v.stock <= 0)
      : product.stock <= 0;
  if (soldOut) return { label: 'Agotado', tone: 'ink' };
  if (product.is_on_sale && product.sale_percentage) {
    return { label: `−${product.sale_percentage} %`, tone: 'orange' };
  }
  if (product.is_new) return { label: '¡Nuevo!', tone: 'green' };
  return null;
}

function ProductJsonLd({ product }: { product: ProductDetail }) {
  const imageUrl = product.images.find((i) => i.is_primary)?.image || product.images[0]?.image;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://juguetesparafrikis.com';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.short_description || product.description,
    image: imageUrl || '',
    sku: product.sku,
    brand: {
      '@type': 'Brand',
      name: product.brand.name,
    },
    offers: {
      '@type': 'Offer',
      price: product.base_price,
      priceCurrency: 'COP',
      availability:
        product.stock > 0
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
      url: `${siteUrl}/productos/${product.slug}`,
    },
    ...(product.review_count > 0 && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: String(product.average_rating?.toFixed(1) || '0'),
        reviewCount: String(product.review_count),
      },
    }),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;
  const product = await fetchProduct(slug);

  if (!product) {
    notFound();
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://juguetesparafrikis.com';
  const badge = getBadge(product);

  return (
    <>
      <ProductJsonLd product={product} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Inicio', item: `${siteUrl}/` },
              { '@type': 'ListItem', position: 2, name: product.franchise.name, item: `${siteUrl}/productos?franchise=${product.franchise.slug}` },
              { '@type': 'ListItem', position: 3, name: product.name },
            ],
          }),
        }}
      />

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Breadcrumbs */}
        <nav aria-label="Ruta de navegación" className="mb-6 flex min-w-0 items-center gap-2 text-sm text-[var(--color-text-muted)]">
          <Link href="/" className="shrink-0 transition-colors hover:text-[var(--color-primary-text)]">
            Inicio
          </Link>
          <span aria-hidden="true">/</span>
          <Link
            href={`/productos?franchise=${product.franchise.slug}`}
            className="shrink-0 transition-colors hover:text-[var(--color-primary-text)]"
          >
            {product.franchise.name}
          </Link>
          <span aria-hidden="true">/</span>
          <span className="min-w-0 truncate text-[var(--color-text)]" aria-current="page">
            {product.name}
          </span>
        </nav>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-[minmax(0,11fr)_minmax(0,9fr)] lg:gap-12">
          {/* Gallery */}
          <div className="md:sticky md:top-[116px] md:self-start lg:top-[164px]">
            <ProductGallery images={product.images} productName={product.name} badge={badge} />
          </div>

          {/* Info */}
          <ProductInfo product={product} />
        </div>
      </div>

      {/* Related products */}
      {product.related_products.length > 0 && (
        <section aria-labelledby="related-title" className="mt-12 bg-[var(--color-bg-alt)] py-16">
          <div className="max-w-7xl mx-auto px-4">
            <h2 id="related-title" className="type-section mb-8 text-[var(--color-text)]">
              También te puede interesar
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {product.related_products.slice(0, 4).map((related) => (
                <ProductCard key={related.id} product={related} />
              ))}
            </div>
          </div>
        </section>
      )}

      <ReviewSection productSlug={product.slug} productId={product.id} />
    </>
  );
}
