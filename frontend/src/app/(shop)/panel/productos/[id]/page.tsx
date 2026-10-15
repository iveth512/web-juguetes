'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { AdminShell } from '@/components/admin/AdminShell';
import { ProductForm } from '@/components/admin/ProductForm';
import { adminGetProduct } from '@/lib/api';
import type { AdminProduct } from '@/types/admin';

function EditProduct() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const [product, setProduct] = useState<AdminProduct | null>(null);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(searchParams.get('creado') ? 'Producto creado.' : '');

  useEffect(() => {
    adminGetProduct(id)
      .then(setProduct)
      .catch(() => setError('No se encontro el producto.'));
  }, [id]);

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
        {error} <Link href="/panel/productos" className="font-semibold underline">Volver al listado</Link>
      </div>
    );
  }
  if (!product) {
    return <div className="h-96 max-w-4xl animate-pulse rounded-xl bg-[var(--color-bg-alt)]" />;
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-4 flex flex-wrap items-center gap-3 text-sm">
        <Link href="/panel/productos" className="text-[var(--color-text-muted)] hover:text-[var(--color-primary)]">&larr; Productos</Link>
        {product.is_active && (
          <Link href={`/productos/${product.slug}`} target="_blank" className="text-[var(--color-primary)] hover:underline">
            Ver en la tienda
          </Link>
        )}
        <span className="text-[var(--color-text-muted)]">{product.units_sold ?? 0} unidades vendidas</span>
      </div>
      {saved && (
        <div className="mb-4 rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-800" role="status">
          {saved}
        </div>
      )}
      <ProductForm
        key={product.updated_at}
        product={product}
        onSaved={(p) => {
          setProduct(p);
          setSaved('Cambios guardados.');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
    </div>
  );
}

export default function EditProductPage() {
  return (
    <AdminShell title="Editar producto">
      <EditProduct />
    </AdminShell>
  );
}
