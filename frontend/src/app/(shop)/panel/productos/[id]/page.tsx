'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { AdminShell } from '@/components/admin/AdminShell';
import { DeleteProductControl } from '@/components/admin/DeleteProductControl';
import { ProductForm } from '@/components/admin/ProductForm';
import { adminCardClass } from '@/components/admin/AdminShell';
import { adminGetProduct } from '@/lib/api';
import type { AdminProduct } from '@/types/admin';

function EditProduct() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [product, setProduct] = useState<AdminProduct | null>(null);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(searchParams.get('creado') ? 'Producto creado.' : '');
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    adminGetProduct(id)
      .then(setProduct)
      .catch(() => setError('No se encontró el producto.'));
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
        <Link href="/panel/productos" className="inline-flex min-h-11 items-center text-[var(--color-text-muted)] hover:text-[var(--color-primary-text)]">Volver a productos</Link>
        {product.is_active && (
          <Link href={`/productos/${product.slug}`} target="_blank" className="inline-flex min-h-11 items-center font-semibold text-[var(--color-primary-text)] hover:underline">
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
      <section className={`${adminCardClass} mt-6 flex flex-col gap-3 p-6 sm:flex-row sm:items-center sm:justify-between`} aria-labelledby="delete-title">
        <div>
          <h2 id="delete-title" className="text-base font-bold text-[var(--color-text)]">Eliminar producto</h2>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">Si tiene ventas, solo se desactivará y dejará de verse en la tienda.</p>
          {deleteError && <p className="mt-2 text-sm text-[var(--color-error)]" role="alert">{deleteError}</p>}
        </div>
        <DeleteProductControl
          productId={product.id}
          label="Eliminar producto"
          onError={setDeleteError}
          onDeleted={(deactivated) => {
            const param = deactivated ? 'desactivado' : 'eliminado';
            router.push(`/panel/productos?${param}=${encodeURIComponent(product.name)}`);
          }}
          className="shrink-0"
        />
      </section>
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
